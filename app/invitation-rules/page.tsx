"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function InvitationRulesPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const levels = [
        { level: `${t.dashboard.levelLabel} 1`, who: t.dashboard.directInvites, reward: "10%" },
        { level: `${t.dashboard.levelLabel} 2`, who: t.dashboard.invitedByLevel1, reward: "5%" },
        { level: `${t.dashboard.levelLabel} 3`, who: t.dashboard.invitedByLevel2, reward: "3%" },
        { level: `${t.dashboard.levelLabel} 4`, who: t.dashboard.invitedByLevel3, reward: "2%" },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-widest uppercase italic">{t.dashboard.invitationRules}</h2>
            </div>

            <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32 animate-fade-in">

                {/* Section 1: Levels & Rewards */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                            <span className="text-xl">🔗</span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-white/90">{t.dashboard.invitationLevelsRewards}</h3>
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed font-medium px-1">
                        {t.dashboard.invitationDesc}
                    </p>

                    <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{t.dashboard.levelLabel}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{t.dashboard.beneficiaryLabel}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">{t.dashboard.rewardLabel}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {levels.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-5 font-black text-purple-400 tracking-tighter">{item.level}</td>
                                        <td className="px-6 py-5 text-sm font-bold text-gray-400 group-hover:text-white transition-colors">{item.who}</td>
                                        <td className="px-6 py-5 text-right font-black text-xl text-white italic">{item.reward}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                        <span className="text-xl mt-0.5">🚫</span>
                        <p className="text-xs font-bold text-amber-500/80 leading-relaxed uppercase tracking-wide">
                            {t.dashboard.noRewardsBeyond4th}
                        </p>
                    </div>
                </section>

                {/* Section 2: Coin-Based Rewards */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                            <span className="text-xl">🪙</span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-white/90">{t.dashboard.coinRewardsOnly}</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-5 rounded-[2rem] bg-[#111111] border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm font-bold text-gray-400">{t.dashboard.paidInAppCoins}</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-[2rem] bg-[#111111] border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </div>
                                <p className="text-sm font-bold text-gray-400">{t.dashboard.storedInWallet}</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 shadow-xl relative overflow-hidden group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">❌</span>
                                </div>
                                <p className="text-sm font-bold text-rose-500/80 uppercase tracking-tight">{t.dashboard.cannotWithdrawDirectly}</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] text-center pt-2">
                        {t.dashboard.platformStability}
                    </p>
                </section>

                {/* Section 3: Coin Exchange */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <span className="text-xl">🔄</span>
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-white/90">{t.dashboard.coinExchangeBirr}</h3>
                    </div>

                    <div className="relative group p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-white/5 overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </div>

                        <div className="relative z-10 space-y-6">
                            <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                {t.dashboard.exchangeFeatureIntro}
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <p className="text-sm font-bold text-white">{t.dashboard.mustExchangeBeforeWithdraw}</p>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <p className="text-sm font-bold text-white">{t.dashboard.exchangeFeeApplied}</p>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <p className="text-sm font-bold text-white italic">{t.dashboard.remainingBalanceWithdrawn}</p>
                                </li>
                            </ul>

                            {/* Exchange Action Button */}
                            <button
                                onClick={() => router.push('/exchange')}
                                className="w-full mt-4 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 transition-all text-white flex items-center justify-center gap-3 group/btn"
                            >
                                <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                {t.dashboard.goToExchange}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer Security */}
                <div className="flex flex-col items-center gap-3 pt-8 opacity-40">
                    <div className="w-12 h-[1px] bg-white/20"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] font-black text-gray-500 tracking-[0.4em] uppercase">{t.dashboard.verifiedRulebook}</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
