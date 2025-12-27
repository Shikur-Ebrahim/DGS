"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const RECHARGE_AMOUNTS = [
    7500, 17000, 29000, 45000, 75000,
    130000, 210000, 280000, 350000, 460000
];

export default function RechargePage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [amount, setAmount] = useState(7500); // Default requirement

    const handleAmountSelect = (val: number) => {
        setAmount(val);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col">
            {/* Background Ambience */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header / Top Bar */}
            <div className="relative z-10 p-4 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">{t.dashboard.rechargeLabel}</h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Main Content - Scrollable */}
            <div className="relative z-10 flex-1 overflow-y-auto pb-24 px-4 space-y-6">

                {/* Amount Display (Purple Card) */}
                <div className="bg-[#4a00b3] rounded-2xl p-6 shadow-xl shadow-purple-900/20">
                    <p className="text-purple-200 text-sm font-medium mb-2">{t.dashboard.rechargeAmountLabel}:</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{t.currencyBr}</span>
                        <span className="text-5xl font-black text-white tracking-tight">{amount.toLocaleString()}</span>
                    </div>
                    <div className="h-0.5 w-full bg-white/20 mt-4"></div>
                </div>

                {/* Preset Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {RECHARGE_AMOUNTS.map((val) => (
                        <button
                            key={val}
                            onClick={() => handleAmountSelect(val)}
                            className={`
                                py-4 rounded-xl font-bold text-sm transition-all
                                ${amount === val
                                    ? 'bg-white text-[#4a00b3] shadow-lg scale-[1.02]'
                                    : 'bg-[#1a1a1a] text-gray-300 border border-white/5 hover:bg-[#252525]'
                                }
                            `}
                        >
                            {val} {t.currencyBr}
                        </button>
                    ))}
                </div>

                {/* Tips Section */}
                <div className="bg-[#1a1a1a]/50 p-5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-yellow-500 mb-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        <h3 className="font-bold text-lg">{t.dashboard.tipsLabel}:</h3>
                    </div>
                    <ul className="space-y-4 text-xs text-gray-400 leading-relaxed">
                        <li>
                            1. {t.dashboard.rechargeTip1}
                        </li>
                        <li>
                            2. {t.dashboard.rechargeTip2}
                        </li>
                        <li>
                            3. {t.dashboard.rechargeTip3}
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20">
                <button
                    onClick={() => router.push(`/payment-method?amount=${amount}`)}
                    className="w-full h-14 bg-[#4a00b3] hover:bg-[#3d0099] text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {t.dashboard.selectPaymentMethod}
                </button>
            </div>
        </div>
    );
}
