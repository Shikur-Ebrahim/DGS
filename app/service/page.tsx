"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ServicePage() {
    const router = useRouter();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const supportChannels = [
        {
            name: "Telegram Support",
            description: "Instant help from our global team",
            icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12a.4.4 0 01.12.28c0 .08-.01.17-.03.26z",
            color: "from-blue-400 to-blue-600",
            link: "https://t.me/your_telegram"
        },
        {
            name: "WhatsApp Hub",
            description: "Direct chat with regional agents",
            icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.441 5.631 1.442h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
            color: "from-emerald-400 to-emerald-600",
            link: "https://wa.me/your_number"
        }
    ];

    const faqs = [
        {
            q: "How long do withdrawals take?",
            a: "Withdrawals typically arrive in 2-72 hours. Processing happens Monday-Friday during business hours (8 AM - 5 PM).",
            id: 1
        },
        {
            q: "What is the minimum recharge?",
            a: "The minimum recharge amount is 300 ETB. Funds are credited instantly to your Balance Wallet upon manual verification of your transfer.",
            id: 2
        },
        {
            q: "Is my bank data secure?",
            a: "Yes, we use 256-bit AES encryption for all banking data. Your personal details are only used for transaction processing and are never shared.",
            id: 3
        },
        {
            q: "How do I earn daily income?",
            a: "Simply purchase a product from the home screen. Your income will be automatically generated and can be synced daily through the Funding Details page.",
            id: 4
        }
    ];

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
                <h2 className="text-xl font-black text-white tracking-wide uppercase">Service Hub</h2>
            </div>

            <div className="p-6 pb-32 max-w-2xl mx-auto space-y-10 pt-10">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-32 h-32">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <Image src="/service_icon.png" alt="Service" width={128} height={128} className="relative z-10 drop-shadow-2xl" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tighter">Support & Safety</h1>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] px-4">Available 24/7 to secure your digital assets</p>
                    </div>
                </div>

                {/* Support Indicators */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Network Online</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center">Avg Response: 2 mins</p>
                    </div>
                    <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Encryption Active</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center">DGS-SECURE v4.2</p>
                    </div>
                </div>

                {/* Social Channels */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] ml-2">Direct Channels</label>
                    <div className="grid gap-4">
                        {supportChannels.map((channel, i) => (
                            <a
                                key={i}
                                href={channel.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative bg-[#111111] border border-white/5 hover:border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between transition-all hover:-translate-y-1 shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center text-white shadow-xl shadow-blue-500/10 group-hover:rotate-6 transition-transform`}>
                                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                            <path d={channel.icon} />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white">{channel.name}</h3>
                                        <p className="text-[11px] font-bold text-gray-400">{channel.description}</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] ml-2">Frequent Questions</label>
                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <div
                                key={faq.id}
                                onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                                className={`bg-[#111111] border border-white/5 rounded-[2rem] p-6 transition-all cursor-pointer ${activeFaq === faq.id ? 'bg-white/[0.03]' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-black text-gray-200 tracking-tight pr-4">{faq.q}</h4>
                                    <svg
                                        className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${activeFaq === faq.id ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {activeFaq === faq.id && (
                                    <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                                        <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-wider">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Security */}
                <div className="mt-10 py-10 border-t border-white/5 text-center space-y-6">
                    <div className="flex items-center justify-center gap-10 opacity-30">
                        <div className="grayscale contrast-200">
                            <span className="text-lg font-black tracking-tighter">PCI-DSS</span>
                        </div>
                        <div className="grayscale contrast-200">
                            <span className="text-lg font-black tracking-tighter">SLL-EV</span>
                        </div>
                        <div className="grayscale contrast-200">
                            <span className="text-lg font-black tracking-tighter">AES-256</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.4em]">Designed & Secured by Lumio Global Dynamics</p>
                </div>
            </div>
        </div>
    );
}
