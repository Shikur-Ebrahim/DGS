"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, onSnapshot } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

interface TransactionData {
    amount: any; // Can be string or number
    status: string;
    createdAt: any; // Can be ISO string or Firestore Timestamp
    approvedAt?: string; // ISO string
}

export default function AdminProfitPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Today's Stats (Calendar Day)
    const [statsToday, setStatsToday] = useState({ recharge: 0, withdrawal: 0, net: 0 });
    // All Time Stats
    const [statsAllTime, setStatsAllTime] = useState({ recharge: 0, withdrawal: 0, net: 0 });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    router.push("/welcome");
                } else {
                    setIsChecking(false);
                }
            } else {
                router.push("/admin");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (isChecking) return;

        // Fetch RechargeReview (Keep Approved Only logic)
        const unsubscribeRecharge = onSnapshot(collection(db, "RechargeReview"), (snapshot) => {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const recharges = snapshot.docs.map(doc => doc.data() as TransactionData);

            // All Time Approved
            const approvedRecharges = recharges.filter(r => r.status === "approved");
            const totalRechargeAll = approvedRecharges.reduce((sum, r) => sum + parseFloat(r.amount?.toString().replace(/,/g, '') || "0"), 0);

            // Today's Approved (Based on approvedAt if available, else createdAt)
            const rechargeToday = approvedRecharges.filter(r => {
                const dateToTrack = r.approvedAt ? new Date(r.approvedAt) : (r.createdAt ? new Date(r.createdAt) : new Date(0));
                return dateToTrack >= startOfToday;
            }).reduce((sum, r) => sum + parseFloat(r.amount?.toString().replace(/,/g, '') || "0"), 0);

            setStatsAllTime(prev => ({ ...prev, recharge: totalRechargeAll, net: totalRechargeAll - prev.withdrawal }));
            setStatsToday(prev => ({ ...prev, recharge: rechargeToday, net: rechargeToday - prev.withdrawal }));
        });

        // Fetch Withdraw (All statuses counted)
        const unsubscribeWithdraw = onSnapshot(collection(db, "withdraw"), (snapshot) => {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const withdrawals = snapshot.docs.map(doc => doc.data() as TransactionData);

            // All Time (All statuses)
            const totalWithdrawalAll = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

            // Today's (All statuses, based on createdAt)
            const withdrawalToday = withdrawals.filter(w => {
                const createdDate = w.createdAt?.toDate ? w.createdAt.toDate() : (w.createdAt ? new Date(w.createdAt) : new Date(0));
                return createdDate >= startOfToday;
            }).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

            setStatsAllTime(prev => ({ ...prev, withdrawal: totalWithdrawalAll, net: prev.recharge - totalWithdrawalAll }));
            setStatsToday(prev => ({ ...prev, withdrawal: withdrawalToday, net: prev.recharge - withdrawalToday }));

            setIsLoading(false);
        });

        return () => {
            unsubscribeRecharge();
            unsubscribeWithdraw();
        };
    }, [isChecking]);

    if (isChecking || isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString() + " Br";
    };

    return (
        <div className="min-h-screen bg-[#0a0f12] text-white">
            <AdminSidebar />

            <div className="lg:pl-72 pt-24 lg:pt-8 p-6">
                <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">

                    {/* Header */}
                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-48 h-48 text-blue-400 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2m4 6h3a2 2 0 002-2v-3a2 2 0 00-2-2h-3m-1 1v-1a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                            Financial Revenue
                        </h1>
                        <p className="text-gray-400 text-lg font-medium">Tracking Approved Income vs Total Withdrawal Requests</p>
                    </div>

                    {/* Today's Dashboard */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black px-4 flex items-center gap-3">
                            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                            Today's Track Summary (Jan 4)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <StatCard title="Today's Approved Recharge" value={formatCurrency(statsToday.recharge)} color="blue" subtitle="Verified Income" />
                            <StatCard title="Today's Total Withdrawal" value={formatCurrency(statsToday.withdrawal)} color="rose" subtitle="All Requests Today" />
                            <NetStatsCard title="Today's Net Profit" amount={statsToday.net} formatCurrency={formatCurrency} />
                        </div>
                    </div>

                    {/* Total Dashboard */}
                    <div className="space-y-6 pt-12 border-t border-white/5">
                        <h2 className="text-2xl font-black px-4 flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                            All-Time Approved Performance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <StatCard title="Total Approved Recharge" value={formatCurrency(statsAllTime.recharge)} color="emerald" subtitle="All-Time Income" />
                            <StatCard title="Total Withdrawal Expense" value={formatCurrency(statsAllTime.withdrawal)} color="orange" subtitle="All Withdrawal Requests" />
                            <NetStatsCard title="Lifetime Net Profit" amount={statsAllTime.net} formatCurrency={formatCurrency} isAllTime />
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
            `}</style>
        </div>
    );
}

function StatCard({ title, value, color, subtitle }: any) {
    const colorClasses: any = {
        blue: "text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
        rose: "text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
        orange: "text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10"
    };

    return (
        <div className={`p-10 rounded-[2.5rem] border ${colorClasses[color]} backdrop-blur-md relative overflow-hidden transition-all duration-300`}>
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">{title}</p>
                <h3 className="text-4xl font-black tracking-tight mb-2">{value}</h3>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
    );
}

function NetStatsCard({ title, amount, formatCurrency, isAllTime }: any) {
    const gain = amount >= 0;
    return (
        <div className={`p-10 rounded-[2.5rem] border ${gain ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'} backdrop-blur-md relative overflow-hidden transition-all duration-300`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">{title}</p>
            <div className="flex items-center gap-4">
                <h3 className={`text-5xl font-black tracking-tighter ${gain ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(Math.abs(amount))}</h3>
                <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${gain ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${gain ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
                    {gain ? 'GAIN' : 'LOST'}
                </div>
            </div>
        </div>
    );
}
