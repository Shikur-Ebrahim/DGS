"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    doc,
    runTransaction,
    serverTimestamp,
    setDoc,
    getDoc,
    addDoc,
    orderBy,
    limit,
    Timestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function WithdrawalPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [amount, setAmount] = useState("");
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");

    // Banks from Admin
    const [availableBanks, setAvailableBanks] = useState<any[]>([]);
    const [showBankList, setShowBankList] = useState(false);

    // Password Component States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [withdrawalPassword, setWithdrawalPassword] = useState("");
    const [hasSetPassword, setHasSetPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showRestrictionDashboard, setShowRestrictionDashboard] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Withdrawal Rules
    const [withdrawalRules, setWithdrawalRules] = useState<any>(null);
    const [isRestricted, setIsRestricted] = useState(false);
    const [restrictionReason, setRestrictionReason] = useState("");
    const [totalRecharge, setTotalRecharge] = useState(0);
    const [inviteRechargeTotal, setInviteRechargeTotal] = useState(0);
    const [userProductIds, setUserProductIds] = useState<string[]>([]);
    const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
    const [lastWithdrawalTime, setLastWithdrawalTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    const FEE_PERCENT = 0.06; // 6% fee

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
            if (firebaseUser) {
                // Fetch User Data
                const userRef = doc(db, "Customers", firebaseUser.uid);
                const userUnsub = onSnapshot(userRef, (docSnap: any) => {
                    if (docSnap.exists()) {
                        setUser({ id: docSnap.id, ...docSnap.data() });
                    }
                });

                // Check for Withdrawal Password
                const pwdRef = doc(db, "WithdrawalPasswords", firebaseUser.uid);
                const pwdSnap = await getDoc(pwdRef);
                setHasSetPassword(pwdSnap.exists());

                setLoading(false);
                return () => userUnsub();
            } else {
                router.push("/welcome");
            }
        });

        // Fetch Supported Banks
        const banksRef = collection(db, "WithdrawalBanks");
        const banksUnsub = onSnapshot(banksRef, (snapshot: any) => {
            const banksData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as any) }));
            setAvailableBanks(banksData);
        });

        return () => {
            unsubscribe();
            banksUnsub();
        };
    }, [router]);

    // Fetch withdrawal rules and user-specific data
    useEffect(() => {
        if (!user?.id) return;

        // Fetch withdrawal rules
        const fetchRules = async () => {
            const rulesDoc = await getDoc(doc(db, "Settings", "withdrawalRules"));
            if (rulesDoc.exists()) {
                setWithdrawalRules(rulesDoc.data());
            }
        };
        fetchRules();

        // Check if user is restricted
        const checkRestriction = async () => {
            const restrictionDoc = await getDoc(doc(db, "WithdrawalRestrictions", user.id));
            if (restrictionDoc.exists() && restrictionDoc.data().isRestricted) {
                setIsRestricted(true);
                setRestrictionReason(restrictionDoc.data().reason || "Your account is restricted from withdrawals.");
            }
        };
        checkRestriction();

        // Calculate total recharge
        const qRecharge = query(
            collection(db, "RechargeReview"),
            where("userId", "==", user.id),
            where("status", "==", "approved")
        );
        const unsubRecharge = onSnapshot(qRecharge, (snapshot) => {
            const total = snapshot.docs.reduce((sum, doc) => sum + (parseFloat(doc.data().amount) || 0), 0);
            setTotalRecharge(total);
        });

        // Count valid invites and calculate their total recharge
        const qInvites = query(
            collection(db, "Customers"),
            where("inviterA", "==", user.id),
            where("isValidMember", "==", true)
        );
        const unsubInvites = onSnapshot(qInvites, async (snapshot) => {
            // Calculate total recharge from invited users
            let totalInviteRecharge = 0;
            for (const inviteDoc of snapshot.docs) {
                const inviteUserId = inviteDoc.id;
                const qInviteRecharge = query(
                    collection(db, "RechargeReview"),
                    where("userId", "==", inviteUserId),
                    where("status", "==", "approved")
                );
                const inviteRechargeSnap = await getDocs(qInviteRecharge);
                const inviteTotal = inviteRechargeSnap.docs.reduce((sum, doc) => sum + (parseFloat(doc.data().amount) || 0), 0);
                totalInviteRecharge += inviteTotal;
            }
            setInviteRechargeTotal(totalInviteRecharge);
        });

        return () => {
            unsubRecharge();
            unsubInvites();
        };
    }, [user?.id]);

    // Real-time listener for withdrawals to handle restriction
    useEffect(() => {
        if (!user?.id) return;

        const withdrawRef = collection(db, "withdraw");
        const q = query(withdrawRef, where("userId", "==", user.id));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Sort in memory to find the latest withdrawal WITHOUT requiring an index
                const withdrawals = snapshot.docs.map(doc => doc.data());
                const latestWithdrawal = withdrawals
                    .filter(w => w.createdAt) // Ensure it has a timestamp
                    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())[0];

                if (latestWithdrawal) {
                    setLastWithdrawalTime(latestWithdrawal.createdAt.toMillis());
                } else {
                    setLastWithdrawalTime(null);
                }
            } else {
                // If no withdrawals exist (or all were deleted), unlock immediately
                setLastWithdrawalTime(null);
            }
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Countdown Timer logic
    useEffect(() => {
        if (!lastWithdrawalTime) return;

        const updateTimer = () => {
            const now = Date.now();
            const MS_PER_DAY = 24 * 60 * 60 * 1000;
            const lastWithdrawalDay = Math.floor(lastWithdrawalTime / MS_PER_DAY);
            const currentDay = Math.floor(now / MS_PER_DAY);

            // If the last withdrawal was on the same UTC day, we are restricted until the next UTC day starts
            if (lastWithdrawalDay === currentDay) {
                const nextDayStart = (currentDay + 1) * MS_PER_DAY;
                const remaining = nextDayStart - now;

                if (remaining > 0) {
                    const hours = Math.floor(remaining / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

                    setTimeRemaining(
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    );
                } else {
                    setTimeRemaining(null);
                }
            } else {
                // Last withdrawal was on a previous day (or earlier), so no restriction
                setTimeRemaining(null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [lastWithdrawalTime]);

    // Fetch user's purchased products
    useEffect(() => {
        if (!user?.id) return;

        const fetchUserProducts = async () => {
            const qOrders = query(
                collection(db, "UserOrders"),
                where("userId", "==", user.id)
            );
            const ordersSnap = await getDocs(qOrders);

            // Get unique product IDs
            const productIds = [...new Set(ordersSnap.docs.map(doc => doc.data().productId))];
            setUserProductIds(productIds as string[]);

            // Check if user has purchased at least one product
            setHasPurchasedProduct(ordersSnap.docs.length > 0);
        };
        fetchUserProducts();
    }, [user?.id]);

    // Auto-fill account details when bank is selected
    useEffect(() => {
        if (selectedBank && user) {
            const fetchSavedAccount = async () => {
                const q = query(
                    collection(db, "UserLinkedBanks"),
                    where("userId", "==", user.uid),
                    where("bankName", "==", selectedBank.name)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setAccountNumber(data.accountNumber);
                    setAccountHolderName(data.accountHolderName);
                } else {
                    // Reset if no saved account for this bank
                    setAccountNumber("");
                    setAccountHolderName("");
                }
            };
            fetchSavedAccount();
        }
    }, [selectedBank, user]);

    const handleWithdrawClick = () => {
        // Remove 24-hour restriction check here, move to handlePasswordSubmit

        // Check if user has purchased a product
        if (!hasPurchasedProduct) {
            showNotification(t.dashboard.mustPurchaseProduct, "error");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showNotification(t.dashboard.validAmount, "error");
            return;
        }
        if (parseFloat(amount) > (user?.balanceWallet || 0)) {
            showNotification(t.dashboard.insufficientBalance, "error");
            return;
        }
        if (parseFloat(amount) < 300 || parseFloat(amount) > 40000) {
            showNotification(t.dashboard.withdrawRange, "error");
            return;
        }
        if (!selectedBank || !accountNumber || !accountHolderName) {
            showNotification(t.dashboard.fillBankDetails, "error");
            return;
        }

        // Check if user is restricted
        if (isRestricted) {
            showNotification(restrictionReason, "error");
            return;
        }

        // Validate against withdrawal rules
        if (withdrawalRules) {
            const withdrawAmount = parseFloat(amount);
            const maxAllowedPercent = totalRecharge * (withdrawalRules.maxWithdrawalPercent / 100);

            // Find matching product rules for user's purchased products
            const productRules = withdrawalRules.productRules || [];
            const matchingRules = productRules.filter((rule: any) =>
                userProductIds.includes(rule.productId)
            );

            // Get the highest invite recharge requirement from matching products
            const requiredInviteRecharge = matchingRules.length > 0
                ? Math.max(...matchingRules.map((r: any) => r.inviteRechargeRequired))
                : 0;

            // Check if user has met invite recharge requirement
            const hasMetInviteRequirement = requiredInviteRecharge === 0 || inviteRechargeTotal >= requiredInviteRecharge;

            if (!hasMetInviteRequirement && withdrawAmount > maxAllowedPercent) {
                // User hasn't met invite requirement and is trying to withdraw more than allowed percentage
                const missingRecharge = Math.max(0, requiredInviteRecharge - inviteRechargeTotal);
                const matchingProductNames = matchingRules.map((r: any) => r.productName).join(", ");

                let message = withdrawalRules.customMessage || "You need more recharge from invited users to unlock full withdrawal.";
                message += `\n\nCurrent Status:\n`;
                message += `• Your Products: ${matchingProductNames || "None"}\n`;
                message += `• Max Withdrawal: ${withdrawalRules.maxWithdrawalPercent}% of ${totalRecharge.toFixed(2)} ETB = ${maxAllowedPercent.toFixed(2)} ETB\n`;
                message += `• Invite Recharge: ${inviteRechargeTotal.toFixed(2)} ETB / ${requiredInviteRecharge} ETB${missingRecharge > 0 ? ` (Need ${missingRecharge.toFixed(2)} ETB more)` : ' ✓ Unlimited!'}`;

                showNotification(message, "error");
                return;
            }
        }

        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async () => {
        if (!withdrawalPassword || withdrawalPassword.length < 4) {
            showNotification(t.dashboard.invalidPassword, "error");
            return;
        }

        // Move 24-hour restriction check here
        if (timeRemaining) {
            setShowRestrictionDashboard(true);
            setShowPasswordModal(false);
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error("Auth required");

            const pwdRef = doc(db, "WithdrawalPasswords", userId);

            if (!hasSetPassword) {
                // Set first time
                if (withdrawalPassword !== confirmPassword) {
                    showNotification(t.dashboard.passwordMismatch, "error");
                    setIsSubmitting(false);
                    return;
                }
                await setDoc(pwdRef, { password: withdrawalPassword, createdAt: serverTimestamp() });
                setHasSetPassword(true);
            } else {
                // Verify
                const pwdSnap = await getDoc(pwdRef);
                if (pwdSnap.data()?.password !== withdrawalPassword) {
                    showNotification(t.dashboard.withdrawCodeIncorrect, "error");
                    setIsSubmitting(false);
                    return;
                }
            }

            // Proceed with withdrawal transaction
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "Customers", userId);
                const userSnap = await transaction.get(userRef);

                if (!userSnap.exists()) throw new Error("User data not found");
                const currentBalance = userSnap.data().balanceWallet || 0;
                const withdrawAmount = parseFloat(amount);

                if (currentBalance < withdrawAmount) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                // 1. Deduct balance
                transaction.update(userRef, {
                    balanceWallet: currentBalance - withdrawAmount
                });

                // 2. Create withdrawal request
                const withdrawRef = doc(collection(db, "withdraw"));
                transaction.set(withdrawRef, {
                    userId,
                    phoneNumber: userSnap.data().phoneNumber || "",
                    amount: withdrawAmount,
                    fee: withdrawAmount * FEE_PERCENT,
                    actualReceipt: withdrawAmount * (1 - FEE_PERCENT),
                    bankName: selectedBank.name,
                    accountNumber,
                    accountHolderName,
                    status: "pending",
                    createdAt: serverTimestamp()
                });

                // 3. Save/Update linked bank info for auto-fill later
                const linkedBankRef = doc(db, "UserLinkedBanks", `${userId}_${selectedBank.name.replace(/\s+/g, '_')}`);
                transaction.set(linkedBankRef, {
                    userId,
                    bankId: selectedBank.id,
                    bankName: selectedBank.name,
                    accountNumber,
                    accountHolderName,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            });

            showNotification(t.dashboard.withdrawRequestSubmitted, "success");
            setShowPasswordModal(false);
            setAmount("");
            setWithdrawalPassword("");
            setConfirmPassword("");
            setTimeout(() => router.push("/wallet"), 2000);
        } catch (error: any) {
            console.error("Withdrawal error:", error);
            if (error.message === "INSUFFICIENT_FUNDS") {
                showNotification(t.dashboard.insufficientBalance, "error");
            } else {
                showNotification(t.dashboard.transactionFailed, "error");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div>
        </div>
    );

    const actualReceipt = parseFloat(amount) ? (parseFloat(amount) * (1 - FEE_PERCENT)).toFixed(2) : "0.00";

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-900 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-5 flex items-center border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="flex-1 text-center text-xl font-black text-gray-900 -ml-10">{t.dashboard.withdrawal}</h1>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] p-1 rounded-2xl shadow-2xl animate-fade-in backdrop-blur-xl border border-white/20 ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} text-white`}>
                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
                            {notification.type === 'success' ? "✓" : "!"}
                        </div>
                        <p className="font-bold text-sm">{notification.message}</p>
                    </div>
                    <div className="h-1 bg-white/30 rounded-full mx-1 mb-1 overflow-hidden">
                        <div className="h-full bg-white animate-progress"></div>
                    </div>
                </div>
            )}

            {showRestrictionDashboard && timeRemaining ? (
                /* Restriction Dashboard View */
                <div className="max-w-xl mx-auto p-4 animate-fade-in">
                    <div className="relative group overflow-hidden">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600/40 via-purple-900/40 to-blue-600/40 rounded-[3rem] blur-2xl opacity-75 animate-pulse-slow"></div>
                        <div className="relative bg-[#0F172A] rounded-[3rem] p-10 border border-white/10 shadow-3xl flex flex-col items-center text-center gap-8">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-transparent border border-red-500/30 flex items-center justify-center animate-float">
                                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-white tracking-tight">Withdrawal Restricted</h2>
                                <p className="text-gray-400 font-bold max-w-[280px] leading-relaxed mx-auto italic">
                                    "Your success deserves patience. Only one withdrawal per day to ensure system stability."
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-4 w-full">
                                <div className="w-full bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 shadow-inner">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Next available in</p>
                                    <span className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                        {timeRemaining}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-500 to-purple-500 animate-progress" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRestrictionDashboard(false)}
                                className="w-full h-16 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 transition-all active:scale-95"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Normal Withdrawal View */
                <div className="max-w-xl mx-auto p-4 space-y-4">
                    {/* Main Withdrawal Card */}
                    <div className="bg-gradient-to-br from-[#5D26C1] to-[#a17fe0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-white/80 font-bold mb-4 flex items-center gap-2">
                                {t.dashboard.withdrawalAmount}:
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black opacity-90 tracking-tighter">{t.currencyBr}</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-transparent text-5xl font-black outline-none w-full placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calculation Stats Card */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-bold">{t.dashboard.availableBalance}</span>
                            <span className="bg-purple-100/50 text-purple-600 px-4 py-1.5 rounded-full font-black text-sm">
                                {user?.balanceWallet?.toLocaleString() || 0} {t.currencyBr}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-bold">{t.dashboard.singleFee}</span>
                            <span className="bg-blue-100/50 text-blue-600 px-4 py-1.5 rounded-full font-black text-sm">6%</span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-gray-800 font-black text-lg">{t.dashboard.actualReceiptLabel}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white shadow-sm font-black">$</div>
                                <span className="text-3xl font-black text-[#5D26C1] tracking-tighter">{actualReceipt} {t.currencyBr}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bank Selection Section */}
                    <div>
                        <h2 className="text-lg font-black text-gray-800 mb-4 px-2">{t.dashboard.selectAccount}</h2>

                        {!selectedBank ? (
                            <button
                                onClick={() => setShowBankList(true)}
                                className="w-full bg-white rounded-3xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 group hover:border-[#5D26C1]/30 hover:bg-[#5D26C1]/5 transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <span className="font-black text-gray-500 uppercase tracking-widest text-xs">{t.dashboard.chooseBank}</span>
                            </button>
                        ) : (
                            <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex items-center justify-between animate-fade-in group hover:border-[#5D26C1]/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[#5D26C1] flex items-center justify-center text-white shadow-lg overflow-hidden relative border border-white/10">
                                        {selectedBank.logoUrl ? (
                                            <img src={selectedBank.logoUrl} alt={selectedBank.name} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-gray-900 tracking-tight">{accountNumber || "****"} {t.dashboard.accountLabel}</h3>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{accountHolderName || t.dashboard.holderNameLabel}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBankList(true)} className="p-3 text-gray-300 hover:text-[#5D26C1] transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}

                        {/* Hidden inputs triggered when bank selected but no details */}
                        {selectedBank && (
                            <div className="mt-4 space-y-3 animate-slide-up">
                                <input
                                    type="text"
                                    placeholder={t.dashboard.enterHolderName}
                                    value={accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                    className="w-full bg-white rounded-2xl p-4 font-bold border border-gray-200 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-300"
                                />
                                <input
                                    type="text"
                                    placeholder={t.dashboard.enterAccountNumber}
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full bg-white rounded-2xl p-4 font-bold border border-gray-200 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-300 font-mono"
                                />
                            </div>
                        )}
                    </div>

                    {/* Tips Section */}
                    <div className="bg-white/40 rounded-[2rem] p-6 border border-gray-200/50">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-black">!</div>
                            <h3 className="font-black text-gray-700 tracking-tight text-lg">{t.dashboard.tipsLabel}:</h3>
                        </div>
                        <ul className="space-y-3">
                            {[
                                t.dashboard.tip1,
                                t.dashboard.tip2,
                                t.dashboard.tip3,
                                t.dashboard.tip4
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <span className="text-gray-800 font-black text-sm">{i + 1}.</span>
                                    <p className="text-sm font-bold text-gray-600 leading-snug">{tip}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Withdraw Button */}
                    <div className="relative group">
                        <button
                            onClick={handleWithdrawClick}
                            className="relative w-full h-20 bg-[#5D26C1] hover:bg-[#4a1fa1] text-white rounded-3xl font-black text-xl shadow-2xl transition-all duration-500 flex flex-col items-center justify-center gap-1 overflow-hidden group active:scale-[0.98] shadow-purple-500/30"
                        >
                            <span className="tracking-tight text-white">
                                {t.dashboard.withdrawBtn}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                </div>
            )}

            {/* Bank List Modal */}
            {showBankList && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 max-h-[80vh] flex flex-col overflow-hidden shadow-3xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h2 className="text-xl font-black">{t.dashboard.chooseBankTitle}</h2>
                            <button onClick={() => setShowBankList(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {availableBanks.map((bank: any) => (
                                <button
                                    key={bank.id}
                                    onClick={() => {
                                        setSelectedBank(bank);
                                        setShowBankList(false);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-purple-500/20"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-gray-100 p-2 shadow-sm overflow-hidden relative">
                                        <img src={bank.logoUrl} alt={bank.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-gray-900">{bank.name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.dashboard.supportedPartner}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xl animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-3xl animate-slide-up relative overflow-hidden border border-gray-100">
                        {/* Decorative Background Elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50"></div>

                        <div className="relative z-10 text-center space-y-8">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 bg-purple-100 rounded-3xl rotate-6 animate-pulse-slow"></div>
                                <div className="absolute inset-0 bg-white shadow-lg rounded-3xl flex items-center justify-center">
                                    <svg className="w-10 h-10 text-[#5D26C1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {hasSetPassword ? t.dashboard.securityCheck : t.dashboard.setSecureCode}
                                </h1>
                                <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] px-4 leading-loose">
                                    {hasSetPassword ? t.dashboard.enterCodeDesc : t.dashboard.setCodeDesc}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <input
                                        type="password"
                                        maxLength={8}
                                        placeholder="••••"
                                        value={withdrawalPassword}
                                        onChange={(e) => setWithdrawalPassword(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500/20 rounded-[2rem] px-8 py-6 text-3xl font-black tracking-[0.6em] text-center focus:ring-8 focus:ring-purple-500/5 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-200 placeholder:font-bold"
                                        autoFocus
                                    />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent rounded-full transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500"></div>
                                </div>

                                {!hasSetPassword && (
                                    <div className="relative group animate-slide-up">
                                        <input
                                            type="password"
                                            maxLength={8}
                                            placeholder="Confirm ••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500/20 rounded-[2rem] px-8 py-6 text-3xl font-black tracking-[0.6em] text-center focus:ring-8 focus:ring-purple-500/5 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-200 placeholder:font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <button
                                    onClick={handlePasswordSubmit}
                                    disabled={isSubmitting}
                                    className="relative w-full h-16 bg-[#5D26C1] hover:bg-[#4a1fa1] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-[0.98] transition-all overflow-hidden group/btn"
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isSubmitting ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                        ) : (
                                            <>
                                                {t.dashboard.unlockWithdraw}
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                                                </svg>
                                            </>
                                        )}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    disabled={isSubmitting}
                                    className="w-full h-14 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    {t.dashboard.cancel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .animate-progress {
                    animation: progress 4s linear;
                }
                .animate-shimmer {
                    animation: shimmer 2.5s infinite linear;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #5D26C120;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
