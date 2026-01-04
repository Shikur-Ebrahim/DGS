"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";

export default function WalletPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [userData, setUserData] = useState<any | null>(null);
    const [hasPendingRecharge, setHasPendingRecharge] = useState(false);
    const [pendingAmount, setPendingAmount] = useState('');

    useEffect(() => {
        let unsubDoc: (() => void) | null = null;
        let unsubRecharge: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                // User Data Listener
                const userRef = doc(db, "Customers", user.uid);
                unsubDoc = onSnapshot(userRef, (docSnap: any) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    }
                });

                // Pending Recharge Listener (Real-time)
                const q = query(
                    collection(db, "RechargeReview"),
                    where("userId", "==", user.uid),
                    where("status", "==", "pending")
                );

                unsubRecharge = onSnapshot(q, (snapshot: any) => {
                    if (!snapshot.empty) {
                        const pendingRequest = snapshot.docs[0].data();
                        setHasPendingRecharge(true);
                        setPendingAmount(pendingRequest.amount || '0');
                    } else {
                        setHasPendingRecharge(false);
                        setPendingAmount('');
                    }
                });
            } else {
                router.push("/welcome");
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubDoc) unsubDoc();
            if (unsubRecharge) unsubRecharge();
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/welcome')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-wide">{t.dashboard.myWallet}</h2>
            </div>

            <div className="animate-fade-in pb-32">
                {/* Full Width Top Balance Card */}
                <div className="relative w-full aspect-[2.1/1] rounded-b-[3rem] p-6 overflow-hidden shadow-[0_20px_50px_-10px_rgba(59,130,246,0.5)] group relative z-10">
                    {/* Dynamic Background with Mesh Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] z-0"></div>
                    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    {/* Content Layer */}
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-start pt-4">

                        {/* Centered Balance Info - Clean Text */}
                        <div className="flex flex-col items-center text-center mt-2 pb-8 z-10 relative">
                            <p className="text-blue-200/70 font-black tracking-[0.3em] text-[10px] uppercase mb-1 drop-shadow-lg">{t.dashboard.totalBalanceLabel}</p>
                            <h3 className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-start justify-center gap-1">
                                {userData?.balanceWallet !== undefined ? userData.balanceWallet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                <span className="text-5xl font-bold text-blue-400">ETB</span>
                            </h3>
                        </div>


                    </div>
                </div>

                <div className="px-5 space-y-3 mt-4">

                    {/* Income Stats Row */}
                    <div className="grid grid-cols-2 gap-2">
                        {/* Task Income */}
                        <div
                            onClick={() => router.push('/task-rules')}
                            className="p-4 rounded-2xl bg-[#131313] border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-lg cursor-pointer active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                            <div className="relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 text-blue-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{t.dashboard.taskIncome}</p>
                                    <svg className="w-3 h-3 text-blue-500/40 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
                                <p className="text-lg font-black text-white flex items-baseline gap-1">
                                    <span className="text-lg text-blue-400 font-bold">$</span>
                                    {userData?.taskWallet !== undefined ? userData.taskWallet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </p>
                            </div>
                        </div>
                        {/* Invite Income - CHANGED to Coins */}
                        <div
                            onClick={() => router.push('/invitation-rules')}
                            className="p-4 rounded-2xl bg-[#131313] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-lg cursor-pointer active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
                            <div className="relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2 text-purple-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{t.dashboard.inviteIncome}</p>
                                    <svg className="w-3 h-3 text-purple-500/40 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
                                <p className="text-lg font-black text-white flex items-center gap-1">
                                    {userData?.inviteWallet !== undefined ? userData.inviteWallet.toFixed(0) : "0"}
                                    <span className="text-xs text-purple-400 font-bold uppercase">{t.dashboard.coinsLabel}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Actions */}
                    <div className="space-y-2 pt-2">
                        <button
                            onClick={() => router.push('/withdrawal')}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_15px_40px_-15px_rgba(37,99,235,0.6)] hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 transform skew-x-12"></div>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <span>{t.dashboard.withdrawNow}</span>
                        </button>

                        <button
                            onClick={() => router.push('/currency')}
                            className="w-full py-3.5 rounded-2xl bg-[#151515] border border-white/5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg"
                        >
                            <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{t.dashboard.currencyRates}</span>
                        </button>

                        <button
                            onClick={() => router.push('/exchange')}
                            className="w-full py-3.5 rounded-2xl bg-[#151515] border border-white/5 text-gray-400 hover:text-white hover:bg-[#1a1a1a] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg"
                        >
                            <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            <span>{t.dashboard.exchange}</span>
                        </button>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
