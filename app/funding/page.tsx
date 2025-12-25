"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";

export default function FundingPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const ordersRef = collection(db, "UserOrders");
                const q = query(ordersRef, where("userId", "==", user.uid));

                const unsubOrders = onSnapshot(q, (snapshot) => {
                    const ordersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...(doc.data() as any)
                    })).sort((a: any, b: any) => {
                        const dateA = a.purchaseDate instanceof Timestamp ? a.purchaseDate.toMillis() : 0;
                        const dateB = b.purchaseDate instanceof Timestamp ? b.purchaseDate.toMillis() : 0;
                        return dateB - dateA;
                    });
                    setOrders(ordersData);
                    setLoading(false);
                });

                return () => unsubOrders();
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/profile')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-wide uppercase">Funding Tracker</h2>
            </div>

            <div className="p-5 pb-32 max-w-2xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing accounts...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-gray-700">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-gray-400">No Active Funding</h3>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Start investing to track your assets</p>
                        </div>
                        <button
                            onClick={() => router.push('/product')}
                            className="px-8 py-3 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            Explore Products
                        </button>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="relative group animate-fade-in group">
                            {/* Card Background with Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="relative bg-[#151515] border border-white/5 rounded-[2.5rem] p-6 overflow-hidden shadow-2xl transition-all duration-300 hover:border-blue-500/30">
                                {/* Status Badge */}
                                <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{order.status}</span>
                                </div>

                                {/* Product Info Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">{order.productName}</h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{order.productId.slice(0, 8)}</p>
                                    </div>
                                </div>

                                {/* Key Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 group-hover:bg-white/[0.05] transition-colors">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Total Profit</p>
                                        <p className="text-xl font-black text-emerald-400">+{order.totalProfit.toLocaleString()} ETB</p>
                                    </div>
                                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 group-hover:bg-white/[0.05] transition-colors">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Principal Income</p>
                                        <p className="text-xl font-black text-blue-400">{order.principalIncome.toLocaleString()} ETB</p>
                                    </div>
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Timeline Progress</p>
                                            <p className="text-sm font-black text-white">{order.contractPeriod - order.remainingDays} / {order.contractPeriod} Days Collected</p>
                                        </div>
                                        <p className="text-xl font-black text-white/40">{Math.round(((order.contractPeriod - order.remainingDays) / order.contractPeriod) * 100)}%</p>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                            style={{ width: `${((order.contractPeriod - order.remainingDays) / order.contractPeriod) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Footer Data Grid */}
                                <div className="grid grid-cols-2 gap-y-6 pt-6 border-t border-white/5 px-2">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Daily Yield</p>
                                        <p className="text-sm font-black text-emerald-400/90 tracking-tight">{order.dailyIncome.toLocaleString()} ETB / Day</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Initial Stake</p>
                                        <p className="text-sm font-black text-white/90 tracking-tight">{order.price.toLocaleString()} ETB</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Purchase Date</p>
                                        <p className="text-[11px] font-bold text-gray-400">{formatDate(order.purchaseDate)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Latest Sync</p>
                                        <p className="text-[11px] font-bold text-blue-400/60">{formatDate(order.lastIncomeSync)}</p>
                                    </div>
                                </div>

                                {/* Abstract Design Elements */}
                                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
