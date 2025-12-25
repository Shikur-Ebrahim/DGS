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
    addDoc
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

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const FEE_PERCENT = 0.06; // 6% fee

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch User Data
                const userRef = doc(db, "Customers", firebaseUser.uid);
                const userUnsub = onSnapshot(userRef, (docSnap) => {
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
        const banksUnsub = onSnapshot(banksRef, (snapshot) => {
            const banksData = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            setAvailableBanks(banksData);
        });

        return () => {
            unsubscribe();
            banksUnsub();
        };
    }, [router]);

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
        if (!amount || parseFloat(amount) <= 0) {
            showNotification("Please enter a valid amount", "error");
            return;
        }
        if (parseFloat(amount) > (user?.balanceWallet || 0)) {
            showNotification("Insufficient balance!", "error");
            return;
        }
        if (parseFloat(amount) < 300 || parseFloat(amount) > 40000) {
            showNotification("Withdrawal range is 300 - 40000 Br", "error");
            return;
        }
        if (!selectedBank || !accountNumber || !accountHolderName) {
            showNotification("Please select/fill bank details", "error");
            return;
        }

        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async () => {
        if (!withdrawalPassword || withdrawalPassword.length < 4) {
            showNotification("Invalid password", "error");
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
                    showNotification("Passwords do not match", "error");
                    setIsSubmitting(false);
                    return;
                }
                await setDoc(pwdRef, { password: withdrawalPassword, createdAt: serverTimestamp() });
                setHasSetPassword(true);
            } else {
                // Verify
                const pwdSnap = await getDoc(pwdRef);
                if (pwdSnap.data()?.password !== withdrawalPassword) {
                    showNotification("withdrawal code is incorrect", "error");
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

            showNotification("Withdrawal request submitted! ✅", "success");
            setShowPasswordModal(false);
            setAmount("");
            setWithdrawalPassword("");
            setConfirmPassword("");
            setTimeout(() => router.push("/wallet"), 2000);
        } catch (error: any) {
            console.error("Withdrawal error:", error);
            if (error.message === "INSUFFICIENT_FUNDS") {
                showNotification("Insufficient balance!", "error");
            } else {
                showNotification("Transaction failed. Try again.", "error");
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

            <div className="max-w-xl mx-auto p-4 space-y-4">
                {/* Main Withdrawal Card */}
                <div className="bg-gradient-to-br from-[#5D26C1] to-[#a17fe0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-white/80 font-bold mb-4 flex items-center gap-2">
                            {t.dashboard.withdrawalAmount}:
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black opacity-90 tracking-tighter">Br</span>
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
                            {user?.balanceWallet?.toLocaleString() || 0} Br
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
                            <span className="text-3xl font-black text-[#5D26C1] tracking-tighter">{actualReceipt} Br</span>
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
                <button
                    onClick={handleWithdrawClick}
                    className="w-full h-16 bg-[#5D26C1] hover:bg-[#4a1fa1] text-white rounded-3xl font-black text-xl shadow-xl shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                    {t.dashboard.withdrawBtn}
                </button>
            </div>

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
                            {availableBanks.map(bank => (
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
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#5D26C1]/30 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-3xl animate-slide-up relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <svg className="w-24 h-24 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" /></svg>
                        </div>

                        <div className="relative z-10 text-center space-y-6">
                            <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-2">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>

                            <div>
                                <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">
                                    {hasSetPassword ? "Security Check" : "Set Secure Code"}
                                </h1>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 px-1">
                                    {hasSetPassword ? "Enter your 4-digit code to authorize withdrawal" : "Create a 4-digit numeric code for future withdrawals"}
                                </p>
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-2">{t.dashboard.securePasscode}</label>
                                <input
                                    type="password"
                                    maxLength={8}
                                    placeholder="••••"
                                    value={withdrawalPassword}
                                    onChange={(e) => setWithdrawalPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-2xl font-black tracking-[0.5em] text-center focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-200"
                                />

                                {!hasSetPassword && (
                                    <>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-2 mt-4">{t.dashboard.confirmPasscode}</label>
                                        <input
                                            type="password"
                                            maxLength={8}
                                            placeholder="••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-2xl font-black tracking-[0.5em] text-center focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-200"
                                        />
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={handlePasswordSubmit}
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-[#5D26C1] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    {isSubmitting ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div> : t.dashboard.unlockWithdraw}
                                </button>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
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
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
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
