"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function UserBankPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const banksRef = collection(db, "UserLinkedBanks");
                const q = query(banksRef, where("userId", "==", user.uid));

                const unsubBanks = onSnapshot(q, (snapshot: any) => {
                    const banksData = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...(doc.data() as any)
                    })).sort((a: any, b: any) => {
                        const dateA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0;
                        const dateB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0;
                        return dateB - dateA;
                    });
                    setBanks(banksData);
                    setLoading(false);
                });

                return () => unsubBanks();
            } else {
                router.push("/welcome");
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

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
                <h2 className="text-xl font-black text-white tracking-wide uppercase">{t.dashboard.myBankAccounts}</h2>
            </div>

            <div className="p-5 pb-32 max-w-2xl mx-auto space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{t.dashboard.syncingSecureVault}</p>
                    </div>
                ) : banks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
                        <div className="relative w-40 h-40">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                            <Image src="/bank_icon.png" alt="Bank" width={160} height={160} className="relative z-10 drop-shadow-2xl" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-white">{t.dashboard.noLinkedBanks}</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">{t.dashboard.addBankWithdrawFunds}</p>
                        </div>
                        <button
                            onClick={() => router.push('/add-bank')}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-white border border-white/10"
                        >
                            {t.dashboard.connectAccount}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{t.dashboard.verifiedAccounts} ({banks.length})</span>
                            <button
                                onClick={() => router.push('/add-bank')}
                                className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                            >
                                {t.dashboard.addBankBtn}
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {banks.map((bank) => (
                                <div key={bank.id} className="relative group animate-slide-up-fade">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="relative bg-[#111111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-300 hover:border-blue-500/30">
                                        {/* Card Header */}
                                        <div className="p-8 pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center p-3 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                        {bank.bankLogo ? (
                                                            <Image src={bank.bankLogo} alt={bank.bankName} width={40} height={40} className="object-contain" />
                                                        ) : (
                                                            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10zm3 3v5m4-5v5m4-5v5" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-white leading-tight tracking-tight">{bank.bankName}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t.dashboard.activeConnection}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white/5 border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="px-8 py-6 bg-white/[0.02] border-y border-white/5 flex items-center justify-between group-hover:bg-white/[0.04] transition-colors">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5">{t.dashboard.accountNumberLabel}</p>
                                                <p className="text-xl font-black text-white tracking-[0.1em] font-mono">
                                                    **** **** {bank.accountNumber?.slice(-4)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5">{t.dashboard.accountTypeLabel}</p>
                                                <p className="text-xs font-black text-white uppercase tracking-widest">{t.dashboard.personalLabel}</p>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="p-8 pt-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{t.dashboard.holderNameLabel}</p>
                                                    <p className="text-sm font-black text-white uppercase truncate">{bank.accountHolderName}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Status</p>
                                                    <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.15em] italic">{t.dashboard.verifiedStatus}</p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex gap-3">
                                                <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all">
                                                    {t.dashboard.securityLog}
                                                </button>
                                                <button className="flex-1 py-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest transition-all border border-orange-500/20">
                                                    {t.dashboard.unlinkBank}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Security Overlay */}
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582a1 1 0 01.586.928v4.741a1 1 0 01-.26.67l-4.14 4.14a1 1 0 01-1.28.148l-4.14-2.76A1 1 0 016 14.162V9.421a1 1 0 01.586-.928L10 6.91V3a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
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
