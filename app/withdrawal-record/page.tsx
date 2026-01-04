"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";

interface WithdrawalRecord {
    id: string;
    userId: string;
    phoneNumber: string;
    amount: number;
    fee: number;
    actualReceipt: number;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    status: string;
    createdAt: Timestamp;
}

export default function WithdrawalRecordPage() {
    const router = useRouter();
    const [records, setRecords] = useState<WithdrawalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const { language } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const withdrawRef = collection(db, "withdraw");
                const q = query(withdrawRef, where("userId", "==", user.uid));

                const unsubRecords = onSnapshot(q, (snapshot: any) => {
                    const recordsData = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    } as WithdrawalRecord)).sort((a: any, b: any) => {
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
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'rejected': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
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
                <h2 className="text-xl font-black text-white tracking-wide uppercase">{t.dashboard.withdrawalRecords}</h2>
            </div>

            <div className="p-5 pb-32 max-w-2xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{t.dashboard.retrievingHistory}</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center text-gray-700">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-gray-400">{t.dashboard.noPayoutRequests}</h3>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">{t.dashboard.withdrawalHistoryDesc}</p>
                        </div>
                        <button
                            onClick={() => router.push('/withdrawal')}
                            className="px-8 py-3 bg-amber-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-white"
                        >
                            {t.dashboard.makeWithdrawal}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Summary Dashboard */}
                        <div className="grid grid-cols-2 gap-4 animate-slide-up-fade">
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 rounded-[2rem] p-5 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest mb-1">{t.dashboard.pendingSync}</p>
                                <h4 className="text-2xl font-black text-white leading-none tracking-tighter">
                                    {records.filter((r: any) => r.status === 'pending').reduce((acc: any, curr: any) => acc + curr.amount, 0).toLocaleString()}
                                    <span className="text-[10px] ml-1 opacity-40">{t.dashboard.currencyEtb}</span>
                                </h4>
                            </div>
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/5 rounded-[2rem] p-5 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">{t.dashboard.finalized}</p>
                                <h4 className="text-2xl font-black text-white leading-none tracking-tighter">
                                    {records.filter((r: any) => r.status === 'approved').reduce((acc: any, curr: any) => acc + curr.amount, 0).toLocaleString()}
                                    <span className="text-[10px] ml-1 opacity-40">{t.dashboard.currencyEtb}</span>
                                </h4>
                            </div>
                        </div>

                        {/* Record Cards */}
                        <div className="space-y-6">
                            {records.map((record) => (
                                <div key={record.id} className="relative group animate-fade-in">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    <div className="relative bg-[#111111] border border-white/5 rounded-[2.5rem] p-7 overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/10 group-hover:-translate-y-1">
                                        {/* Abstract Glass Shape */}
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-amber-500/10"></div>

                                        {/* Top Section: Header & Status */}
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center p-2 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    <svg className="w-8 h-8 text-amber-500/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white leading-tight mb-0.5 tracking-tight">{record.bankName}</h3>
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{formatDate(record.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl border backdrop-blur-md shadow-lg ${getStatusColor(record.status)}`}>
                                                <span className="text-[9px] font-black uppercase tracking-widest">{record.status}</span>
                                            </div>
                                        </div>

                                        {/* Financial Summary Highlight */}
                                        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-6 mb-8 flex items-center justify-between group-hover:bg-white/[0.05] transition-all duration-500 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                                            <div className="text-left">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.dashboard.netToReceive}</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{record.actualReceipt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-[10px] font-black text-amber-500/80 uppercase">{t.dashboard.currencyEtb}</span>
                                                </div>
                                            </div>
                                            <div className="h-10 w-[2px] bg-gradient-to-b from-transparent via-white/10 to-transparent mx-4"></div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{t.dashboard.grossPayout}</p>
                                                <div className="flex items-baseline gap-1 justify-end">
                                                    <span className="text-xl font-bold text-gray-400 tracking-tighter">{record.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-[9px] font-black text-gray-600 uppercase">{t.dashboard.currencyEtb}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Data Matrix */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-2">
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.accountHolder}</p>
                                                <p className="text-sm font-black text-white/90 truncate pr-2 tracking-tight">{record.accountHolderName}</p>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.accountNumber}</p>
                                                <p className="text-sm font-black text-white/90 font-mono tracking-[0.1em]">{record.accountNumber}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.serviceFee}</p>
                                                <p className="text-sm font-black text-rose-500/90 tracking-tight">-{record.fee.toLocaleString()} {t.dashboard.currencyEtb}</p>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest opacity-60">{t.dashboard.customerPhone}</p>
                                                <p className="text-sm font-black text-blue-400/90 font-mono">+{record.phoneNumber}</p>
                                            </div>
                                        </div>

                                        {/* Security Footnote */}
                                        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                <span className="text-[8px] font-bold text-gray-500 tracking-[0.2em] uppercase">AuthID: {record.id.slice(0, 12).toUpperCase()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                <span className="text-[8px] font-black text-emerald-500 tracking-widest uppercase">{t.dashboard.verifiedPayout}</span>
                                                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.152a2 2 0 001.938 0l6.865-4.252A2 2 0 0015.966 2H4.034a2 2 0 00-1.868 2.9zM3 14.5V8l7 4.333L17 8v6.5a2.5 2.5 0 01-2.5 2.5h-9A2.5 2.5 0 013 14.5z" clipRule="evenodd" /></svg>
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
