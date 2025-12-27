"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "@/lib/LanguageContext";

export default function ServicePage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const [telegramSettings, setTelegramSettings] = useState<any>({
        channelUser: "",
        channelDesc: t.dashboard.telegramChannelDesc,
        supportUser: "",
        supportDesc: t.dashboard.telegramSupportDesc
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "Settings", "telegram");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTelegramSettings((prev: any) => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error fetching telegram settings:", error);
            }
        };
        fetchSettings();
    }, []);

    // We need to add imports to the top of the file first.
    // Let me rewrite the component with imports included to be safe.

    // Actually, I can just use the existing supportChannels structure but update it with state.

    const supportChannels = [
        {
            name: t.dashboard.telegramChannelName,
            description: telegramSettings.channelDesc,
            icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12a.4.4 0 01.12.28c0 .08-.01.17-.03.26z",
            color: "from-blue-400 to-blue-600",
            link: telegramSettings.channelUser?.startsWith('http') ? telegramSettings.channelUser : `https://t.me/${telegramSettings.channelUser}`
        },
        {
            name: t.dashboard.telegramSupportName,
            description: telegramSettings.supportDesc,
            icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12a.4.4 0 01.12.28c0 .08-.01.17-.03.26z",
            link: telegramSettings.supportUser?.startsWith('http') ? telegramSettings.supportUser : `https://t.me/${telegramSettings.supportUser}`
        }
    ];

    const faqs = [
        {
            q: t.dashboard.faq1Q,
            a: t.dashboard.faq1A,
            id: 1
        },
        {
            q: t.dashboard.faq2Q,
            a: t.dashboard.faq2A,
            id: 2
        },
        {
            q: t.dashboard.faq3Q,
            a: t.dashboard.faq3A,
            id: 3
        },
        {
            q: t.dashboard.faq4Q,
            a: t.dashboard.faq4A,
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
                <h2 className="text-xl font-black text-white tracking-wide uppercase">{t.dashboard.serviceHubTitle}</h2>
            </div>

            <div className="p-6 pb-32 max-w-2xl mx-auto space-y-10 pt-10">
                {/* Hero Section */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-32 h-32">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <Image src="/service_icon.png" alt="Service" width={128} height={128} className="relative z-10 drop-shadow-2xl" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tighter">{t.dashboard.supportSafety}</h1>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] px-4">{t.dashboard.available247Desc}</p>
                    </div>
                </div>

                {/* Support Indicators */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t.dashboard.networkOnline}</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center">{t.dashboard.avgResponse2min}</p>
                    </div>
                    <div className="bg-[#111111] border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t.dashboard.encryptionActive}</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center">{t.dashboard.dgsSecureVersion}</p>
                    </div>
                </div>

                {/* Communicate Official Company */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] ml-2">{t.dashboard.officialSupportLabel}</label>
                    <a
                        href="/chat"
                        className="group relative bg-gradient-to-r from-[#111111] to-[#1a1a1a] border border-white/5 hover:border-blue-500/30 p-6 rounded-[2.5rem] flex items-center justify-between transition-all hover:-translate-y-1 shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-blue-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center shadow-lg p-2 group-hover:scale-105 transition-transform">
                                <Image src="/dgs_app_icon.png" alt="Official" width={48} height={48} className="object-contain" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">{t.dashboard.communicateOfficial}</h3>
                                <p className="text-[11px] font-bold text-blue-400">{t.dashboard.premiumLiveSupport}</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 text-blue-500 group-hover:text-white transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                    </a>
                </div>

                {/* Social Channels */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] ml-2">{t.dashboard.directChannelsLabel}</label>
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
                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] ml-2">{t.dashboard.frequentQuestionsLabel}</label>
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
                    <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.4em]">{t.dashboard.designedSecuredBy}</p>
                </div>
            </div>
        </div>
    );
}
