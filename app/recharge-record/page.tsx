"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";

export default function RechargeRecordPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const rechargeRef = collection(db, "RechargeReview");
                const q = query(rechargeRef, where("userId", "==", user.uid));

                const unsubRecords = onSnapshot(q, (snapshot: any) => {
                    const recordsData = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...(doc.data() as any)
                    })).sort((a: any, b: any) => {
                        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                        return dateB - dateA;
                    });
                    setRecords(recordsData);
                    setLoading(false);
                });

                return () => unsubRecords();
            } else {
                router.push("/welcome");
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return t.dashboard.notAvailable;
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(language === 'en' ? 'en-GB' : language, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'rejected': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return t.dashboard.statusPending;
            case 'approved': return t.dashboard.statusApproved;
            case 'rejected': return t.dashboard.statusRejected;
            default: return status;
        }
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
                <h2 className="text-xl font-black text-white tracking-wide uppercase">{t.dashboard.rechargeRecordTitle}</h2>
            </div>

            <div className="p-5 pb-32 max-w-2xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{t.dashboard.retrievingHistory}</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-gray-700 font-black italic text-4xl">
                            DGS
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-gray-400">{t.dashboard.noRechargeHistory}</h3>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">{t.dashboard.depositFundsDesc}</p>
                        </div>
                        <button
                            onClick={() => router.push('/recharge')}
                            className="px-8 py-3 bg-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-white"
                        >
                            {t.dashboard.rechargeNowBtn}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary Bar */}
                        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex items-center justify-between animate-slide-up-fade">
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">{t.dashboard.lifetimeTopUp}</p>
                                <h4 className="text-3xl font-black text-white tracking-tighter">
                                    {records.filter((r: any) => r.status === 'approved').reduce((acc: any, curr: any) => acc + (Number(curr.amount) || 0), 0).toLocaleString()}
                                    <span className="text-xs ml-1.5 text-blue-500/60 uppercase">{t.dashboard.currencyEtb}</span>
                                </h4>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                        </div>

                        {/* Record List */}
                        <div className="space-y-6">
                            {records.map((record) => (
                                <div key={record.id} className="relative group animate-fade-in">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    <div className="relative bg-[#111111] border border-white/5 rounded-[2.5rem] p-7 overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/10 group-hover:-translate-y-1">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center p-2 shadow-inner group-hover:rotate-6 transition-transform duration-500">
                                                    <svg className="w-8 h-8 text-blue-500/80 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white leading-tight mb-0.5 tracking-tight flex items-center gap-2">
                                                        {t.dashboard.rechargeAmountLabel}
                                                    </h3>
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{formatDate(record.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl border backdrop-blur-md shadow-lg ${getStatusColor(record.status)}`}>
                                                <span className="text-[9px] font-black uppercase tracking-widest">{getStatusText(record.status)}</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 mb-8 flex flex-col items-center justify-center gap-1 group-hover:bg-white/[0.05] transition-all duration-500">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.dashboard.transactionValue}</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                <span className="text-sm font-black text-blue-500">{t.dashboard.currencyEtb}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-2">
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.paymentMethodLabel}</p>
                                                <p className="text-sm font-black text-white/90 truncate pr-2 tracking-tight">{record.methodName || "Bank Transfer"}</p>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.refNumberLabel}</p>
                                                <p className="text-sm font-black text-white/90 font-mono tracking-[0.1em]">{record.id.slice(-8).toUpperCase()}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.currencyLabel}</p>
                                                <p className="text-sm font-black text-white/90">Ethiopian Birr ({t.dashboard.currencyEtb})</p>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.networkLabel}</p>
                                                <p className="text-sm font-black text-emerald-400/90 tracking-widest">DGS-SECURE</p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between opacity-50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span className="text-[8px] font-bold text-gray-500 tracking-[0.2em] uppercase">TXN: {record.id.toUpperCase()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-black text-blue-400 tracking-widest uppercase italic">{t.dashboard.safeDepositTag}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
