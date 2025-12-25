"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";

export default function SubsidyPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const ordersRef = collection(db, "UserOrders");
                const q = query(ordersRef, where("userId", "==", user.uid));

                const unsubOrders = onSnapshot(q, (snapshot: any) => {
                    const ordersData = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...(doc.data() as any)
                    }));
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

    const totalInvestment = orders.reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0);
    const totalDailyIncome = orders.reduce((acc: number, curr: any) => acc + (Number(curr.dailyIncome) || 0), 0);
    const totalProfitEarned = orders.reduce((acc: number, curr: any) => acc + (Number(curr.totalProfit) || 0), 0);

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
                <h2 className="text-xl font-black text-white tracking-wide uppercase">My Jewelry Portfolio</h2>
            </div>

            <div className="p-6 pb-32 max-w-2xl mx-auto space-y-8 pt-8">
                {/* Visual Identity & Summary Card */}
                <div className="relative group animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-blue-600/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Holdings Value</p>
                                <h1 className="text-4xl font-black text-white tracking-tighter">
                                    {totalInvestment.toLocaleString()}
                                    <span className="text-sm ml-2 text-amber-500/80 font-black">ETB</span>
                                </h1>
                            </div>
                            <div className="w-20 h-20 relative group-hover:scale-110 transition-transform duration-700">
                                <Image src="/jewelry_icon.png" alt="Jewelry" width={80} height={80} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Daily Yield</p>
                                <p className="text-xl font-black text-emerald-400 tracking-tight">+{totalDailyIncome.toLocaleString()} Br</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Earnings</p>
                                <p className="text-xl font-black text-blue-400 tracking-tight">{totalProfitEarned.toLocaleString()} Br</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Jewelry items ({orders.length})</span>
                    <button
                        onClick={() => router.push('/')}
                        className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
                    >
                        Browse Shop →
                    </button>
                </div>

                {/* Investment List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full"></div>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Syncing Assets...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center opacity-20">
                                <Image src="/jewelry_icon.png" alt="Icon" width={40} height={40} className="grayscale" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-400">No Jewelry Items</h3>
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-10 mt-1">Start your luxury collection to see your items here</p>
                            </div>
                        </div>
                    ) : (
                        orders.map((order: any, idx: number) => (
                            <div key={order.id} className="relative group animate-slide-up-fade" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative bg-[#111111] border border-white/5 rounded-[2.5rem] p-7 transition-all duration-500 hover:border-amber-500/30">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-white/5 flex items-center justify-center p-3 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                                <Image src="/jewelry_icon.png" alt="Icon" width={32} height={32} className="opacity-80" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white leading-tight">{order.productName || "Investment Plan"}</h3>
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">Term: {order.contractPeriod || 60} Days</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl mb-4 group-hover:bg-white/[0.04] transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Price Paid</p>
                                            <p className="text-lg font-black text-white tracking-tight">{order.price?.toLocaleString()} Br</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Daily Income</p>
                                            <p className="text-lg font-black text-amber-500 tracking-tight">{order.dailyIncome?.toLocaleString()} Br</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between px-2 pt-2 text-[10px] font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="text-gray-500 uppercase tracking-widest">Cycle Progress</span>
                                        </div>
                                        <span className="text-blue-400 tracking-[0.2em] uppercase">Secured by DGS</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
