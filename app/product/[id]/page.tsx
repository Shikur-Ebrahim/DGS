"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, runTransaction, collection, serverTimestamp, setDoc, query, where, getDocs } from "firebase/firestore";

export default function ProductDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) setUserId(user.uid);
            else setUserId(null);
        });
        return () => unsubscribe();
    }, []);

    const handleConfirmPurchase = async () => {
        if (!userId || !product) {
            showNotification("Please login to purchase", "error");
            return;
        }

        setIsBuying(true);

        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "Customers", userId);
                const userSnap = await transaction.get(userRef);

                if (!userSnap.exists()) throw new Error("User profile not found");

                // 1. Check purchase limit
                const ordersRef = collection(db, "UserOrders");
                const q = query(ordersRef, where("userId", "==", userId), where("productId", "==", product.id));
                const existingOrdersSnap = await getDocs(q);

                if (existingOrdersSnap.size >= (product.purchaseLimit || 1)) {
                    throw new Error("LIMIT_REACHED");
                }

                const currentBalance = userSnap.data().balanceWallet || 0;

                if (currentBalance < product.price) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                // --- 2. Commission Logic Preparation (Read Phase) ---
                const userData = userSnap.data();
                const inviterRefs = [];
                const inviterIds = [userData.inviterA, userData.inviterB, userData.inviterC, userData.inviterD];

                // Collect non-null inviter references
                for (const invId of inviterIds) {
                    if (invId) {
                        inviterRefs.push(doc(db, "Customers", invId));
                    } else {
                        inviterRefs.push(null); // Keep index alignment
                    }
                }

                // Read all inviters
                const inviterSnaps = await Promise.all(
                    inviterRefs.map(ref => ref ? transaction.get(ref) : Promise.resolve(null))
                );

                // --- 3. Deduct balance and add FIRST day's income immediately ---
                const firstDayIncome = product.dailyIncome || 0;
                transaction.update(userRef, {
                    balanceWallet: currentBalance - product.price + firstDayIncome
                });

                // --- 4. Create Active Investment Order with 1 day already paid ---
                const orderRef = doc(collection(db, "UserOrders"));
                transaction.set(orderRef, {
                    userId,
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    dailyIncome: product.dailyIncome,
                    contractPeriod: product.contractPeriod,
                    remainingDays: product.contractPeriod - 1, // First day already paid now
                    totalProfit: product.totalProfit,
                    principalIncome: product.principalIncome,
                    status: (product.contractPeriod - 1) <= 0 ? "completed" : "active",
                    purchaseDate: serverTimestamp(),
                    lastIncomeSync: serverTimestamp()
                });

                // --- 5. Distribute Commissions (Write Phase) ---
                const rates = [0.10, 0.05, 0.03, 0.02]; // Levels A, B, C, D

                inviterSnaps.forEach((invSnap, index) => {
                    if (invSnap && invSnap.exists()) {
                        const inviterData = invSnap.data();
                        const reward = product.price * rates[index];

                        // Update Inviter Wallet
                        transaction.update(inviterRefs[index]!, {
                            inviteWallet: (inviterData.inviteWallet || 0) + reward
                        });

                        // Optional: Record the commission transaction record if you have a 'Transactions' collection
                        // We skip this for now as per instructions, but wallets are updated.
                    }
                });
            });

            showNotification("Investment Successful! ✅", "success");
            setTimeout(() => {
                setShowConfirm(false);
                router.push('/welcome');
            }, 1500);

        } catch (error: any) {
            // Silence business logic errors from the console to keep it clean
            if (error.message !== "INSUFFICIENT_FUNDS" && error.message !== "LIMIT_REACHED") {
                console.error("Purchase error:", error);
            }

            if (error.message === "INSUFFICIENT_FUNDS") {
                showNotification("Insufficient balance! Please recharge. 💳", "error");
                setTimeout(() => router.push('/recharge'), 2000);
            } else if (error.message === "LIMIT_REACHED") {
                showNotification(`Limit reached! You can only buy this ${product.purchaseLimit} times.`, "error");
            } else {
                showNotification("Failed to process order. Try again.", "error");
            }
        } finally {
            setIsBuying(false);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "Products", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-[#4c1cbd] border-t-transparent rounded-full shadow-[0_0_15px_rgba(76,28,189,0.2)]"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400 font-bold text-xl mb-4">Product Not Found</p>
                    <button onClick={() => router.push('/product')} className="text-[#4c1cbd] font-bold underline">Go Back to Market</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-24 font-sans no-scrollbar overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center border-b border-gray-100">
                <button onClick={() => router.back()} className="p-2 active:scale-90 transition-transform">
                    <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="flex-1 text-center text-[19px] font-bold text-gray-900 pr-10">Detail</h1>
            </header>

            <div className="px-5 py-4 max-w-2xl mx-auto">
                {/* Product Image Card */}
                <div className="w-full aspect-[16/10] rounded-[2rem] overflow-hidden bg-gray-50 mb-7 flex items-center justify-center shadow-inner border border-gray-100/50">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-300 gap-2">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-bold text-xs tracking-widest uppercase">No Visual</span>
                        </div>
                    )}
                </div>

                {/* Basic Header Info */}
                <div className="mb-8 pl-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-tight">{product.name}</h2>
                    <div className="text-[34px] font-black text-[#5822b3] leading-none mb-1">
                        {product.price.toLocaleString()} <span className="text-[20px] font-black ml-0.5 tracking-tighter">Br</span>
                    </div>
                </div>

                {/* Stats Grid - MATCHES IMAGE EXACTLY */}
                <div className="bg-[#fcfdff]/80 backdrop-blur-sm border border-gray-100 rounded-[1.5rem] p-6 shadow-sm mb-7">
                    <div className="grid grid-cols-3 gap-y-10">
                        {/* Col 1: Price */}
                        <div className="text-center border-r border-gray-100/80 px-1">
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight mb-2.5">Product price</p>
                            <p className="text-[17px] font-black text-gray-800">{product.price.toLocaleString()} Br</p>
                        </div>
                        {/* Col 2: Daily Rate */}
                        <div className="text-center border-r border-gray-100/80 px-1">
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight mb-2.5">Daily rate</p>
                            <p className="text-[17px] font-black text-gray-800">{product.dailyRate}%</p>
                        </div>
                        {/* Col 3: Daily Income */}
                        <div className="text-center px-1">
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight mb-2.5 whitespace-nowrap">Daily income</p>
                            <p className="text-[17px] font-black text-gray-800">{product.dailyIncome.toLocaleString()} Br</p>
                        </div>

                        {/* Row 2: Period */}
                        <div className="text-center border-r border-gray-100/80 px-1">
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight mb-2.5">Contract Period</p>
                            <p className="text-[17px] font-black text-gray-800">{product.contractPeriod} Day</p>
                        </div>
                        {/* Row 2: Total Profit */}
                        <div className="text-center border-r border-gray-100/80 px-1">
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight mb-2.5 whitespace-nowrap">Total Profit</p>
                            <p className="text-[17px] font-black text-gray-800">{product.totalProfit.toLocaleString()} Br</p>
                        </div>
                        {/* Row 2: Total income */}
                        <div className="text-center px-1">
                            <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight mb-2.5 whitespace-nowrap">Principal+income</p>
                            <p className="text-[17px] font-black text-gray-800">{product.principalIncome.toLocaleString()} Br</p>
                        </div>
                    </div>
                </div>

                {/* Purchase Limit Indicator */}
                <div className="bg-[#f2f7ff] rounded-[1.2rem] p-5 flex justify-between items-center mb-10 border border-blue-50">
                    <span className="text-[14px] font-bold text-gray-700 tracking-tight">Purchase quantity limit</span>
                    <span className="text-[14px] font-bold text-[#4491f6] bg-white px-3 py-1 rounded-lg border border-blue-100">{product.purchaseLimit} times</span>
                </div>

                {/* High-End Details Section */}
                <div className="space-y-10 mb-20 animate-fade-up">
                    <div>
                        <h3 className="text-[19px] font-black text-gray-800 mb-5 relative inline-block">
                            Details:
                            <div className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#4c1cbd]/20 rounded-full"></div>
                        </h3>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-semibold">
                            {product.description || "The product series is a core strategic engine for the group's expansion in the Ethiopian home appliance market... this creates an exceptional investment model that delivers consistently high returns for each partner. Investors can receive daily returns, withdraw them at any time, and recover their principal at the end of the cycle."}
                        </p>
                    </div>

                    <div className="space-y-6 text-[13px] text-gray-600 font-bold bg-[#f9fafc] p-7 rounded-[2.5rem] border border-gray-50 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-full bg-[#4c1cbd] opacity-10"></div>

                        <p className="text-gray-900 text-[15px] font-black flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#4c1cbd] rounded-full"></span>
                            【{product.name}】 Detailed Statistics:
                        </p>

                        <div className="space-y-4 pl-4 border-l-2 border-gray-100 ml-0.5">
                            <p className="flex justify-between items-center">
                                <span className="text-gray-400 uppercase tracking-widest text-[11px]">Price</span>
                                <span className="text-gray-900">{product.price.toLocaleString()} Br</span>
                            </p>
                            <p className="flex justify-between items-center">
                                <span className="text-gray-400 uppercase tracking-widest text-[11px]">Daily Income</span>
                                <span className="text-gray-900">{product.dailyIncome.toLocaleString()} Br</span>
                            </p>
                            <p className="flex justify-between items-center">
                                <span className="text-gray-400 uppercase tracking-widest text-[11px]">Contract Period</span>
                                <span className="text-gray-900">{product.contractPeriod} Days</span>
                            </p>
                            <p className="flex justify-between items-center">
                                <span className="text-gray-400 uppercase tracking-widest text-[11px]">Total Income</span>
                                <span className="text-gray-900">{product.totalProfit.toLocaleString()} Br</span>
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-200/50 flex flex-col gap-4">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
                                <p className="text-[13px] leading-relaxed">
                                    Total Withdrawal: Buy Principal {product.price.toLocaleString()} + Product Income {product.totalProfit.toLocaleString()} = <span className="text-[#5822b3] font-black text-base">{product.principalIncome.toLocaleString()} Br</span>.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <p className="flex items-center gap-2 text-gray-500">
                                    <svg className="w-4 h-4 text-[#4491f6]" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                    Invite friends to buy <span className="text-gray-900 px-1.5 py-0.5 bg-gray-100 rounded-md">【{product.name}】</span> and receive a 400 Br referral reward.
                                </p>
                                <p className="flex items-center gap-2 text-gray-500">
                                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                    Buy <span className="text-gray-900 px-1.5 py-0.5 bg-gray-100 rounded-md">【{product.name}】</span> yourself and receive a 400 Br buy bonus.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Notification Toast */}
            {notification && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[1000] min-w-[320px] p-1 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-slide-in backdrop-blur-xl border border-white/20 ${notification.type === 'success'
                    ? 'bg-gradient-to-r from-emerald-500/90 to-green-600/90 text-white'
                    : 'bg-gradient-to-r from-rose-500/90 to-red-600/90 text-white'
                    }`}>
                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                            {notification.type === 'success' ? (
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-[15px] font-black tracking-tight leading-tight">
                                {notification.type === 'success' ? 'SUCCESS!' : 'ATTENTION'}
                            </p>
                            <p className="text-[13px] font-bold opacity-90">{notification.message}</p>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-1 right-1 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white animate-[progress_3s_linear_forwards]"></div>
                    </div>
                </div>
            )}

            {/* Confirm Order Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-slide-up relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#4c1cbd] to-purple-500"></div>

                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Confirm Order</h3>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Product name</span>
                                <span className="text-gray-900 font-black">{product.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Product price</span>
                                <span className="text-gray-900 font-black">{product.price.toLocaleString()} Br</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Daily income</span>
                                <span className="text-gray-900 font-black text-green-600">{product.dailyIncome.toLocaleString()} Br</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Contract Period</span>
                                <span className="text-gray-900 font-black">{product.contractPeriod} Day</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Total Profit</span>
                                <span className="text-gray-900 font-black">{product.totalProfit.toLocaleString()} Br</span>
                            </div>

                            <div className="h-[1px] bg-gray-100 my-6"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Discount</span>
                                <span className="text-gray-900 font-black">-0.00 Br</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-900 font-black">Pay Amount</span>
                                <span className="text-[#5822b3] font-black">{product.price.toLocaleString()} Br</span>
                            </div>

                            <p className="text-[#4491f6] text-[13px] font-bold mt-4">The upper limit is {product.purchaseLimit} times</p>

                            <button
                                onClick={handleConfirmPurchase}
                                disabled={isBuying}
                                className="w-full h-16 bg-[#4c1cbd] hover:bg-[#3d169e] disabled:bg-gray-400 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-3 mt-8 active:scale-[0.98] uppercase tracking-widest"
                            >
                                {isBuying ? (
                                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    "Confirm"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Buy Area - MATCHES IMAGE EXACTLY */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex items-center justify-center z-[100]">
                <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full max-w-lg h-16 bg-[#4c1cbd] hover:bg-[#3d169e] text-white font-black text-[17px] rounded-[1.2rem] shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-all uppercase tracking-[2px]"
                >
                    Buy
                </button>
            </div>
        </div>
    );
}
