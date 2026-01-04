"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DownloadPage() {
    const router = useRouter();
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("PWA Install Prompt stashed");
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsComplete(true);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Android / Chrome: Show native "Richer Install UI" immediately
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setIsComplete(true);
                }
            } catch (err) {
                console.error("Install prompt failed:", err);
            }
            setDeferredPrompt(null);
            return;
        }

        if (isIOS) {
            // iOS: Direct instructions since programmatic prompt isn't supported
            alert("To install DGS Pro on iOS:\n1. Tap the 'Share' icon (square with arrow up)\n2. Scroll down and tap 'Add to Home Screen'");
            return;
        }

        // Fallback: Show feedback if the prompt is not yet stashed
        setIsDownloading(true);
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 20;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setIsComplete(true);
                setIsDownloading(false);
            }
            setProgress(currentProgress);
        }, 150);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/20 to-transparent blur-3xl opacity-50"></div>

            {/* Header */}
            <div className="w-full max-w-xl flex items-center justify-between mb-8 relative z-10 pt-4">
                <button
                    onClick={() => router.back()}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Verified Store</span>
                </div>
            </div>

            {/* App Profile Section */}
            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500/30 rounded-[3rem] blur-2xl animate-pulse"></div>
                    <div className="relative w-40 h-40 rounded-[3rem] bg-black border border-white/10 overflow-hidden shadow-2xl">
                        <Image
                            src="/dgs_app_icon.png"
                            alt="DGS App Icon"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

                <h2 className="text-4xl font-black tracking-tighter mb-2 italic">DGS PRO</h2>
                <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Official Native PWA Application</p>

                {/* Play Store-style Stats */}
                <div className="grid grid-cols-3 w-full gap-4 mb-12 border-y border-white/5 py-6">
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black">4.9 ★</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">72K Reviews</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-white/5">
                        <span className="text-xl font-black">28 MB</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">File Size</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-xl font-black">5M+</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Downloads</span>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="w-full space-y-6">
                    {!isComplete ? (
                        <>
                            {isDownloading && (
                                <div className="space-y-3 animate-fade-in mb-4">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_#3b82f6]"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 text-center">Syncing Assets: {Math.round(progress)}%</p>
                                </div>
                            )}

                            <button
                                onClick={handleInstall}
                                disabled={isDownloading}
                                className={`w-full h-18 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-4 ${isDownloading
                                    ? "bg-white/5 text-gray-500 border border-white/5"
                                    : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                                    }`}
                            >
                                {isDownloading ? "Processing..." : "Install Now"}
                                {!isDownloading && (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Supports all major platforms</p>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-slide-up">
                            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic">Installation Success!</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-4">The DGS Pro App has been placed on your home screen.</p>
                            </div>
                            <button
                                onClick={() => router.push('/welcome')}
                                className="w-full h-16 rounded-[2rem] border border-white/10 bg-white/5 font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/10 transition-colors"
                            >
                                Enter Platform
                            </button>
                        </div>
                    )}
                </div>

                {/* App Description (Play Store feel) */}
                <div className="mt-16 text-left w-full space-y-4 opacity-70">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">What's New</h4>
                    <p className="text-[11px] font-medium leading-relaxed">
                        • Enhanced security for daily income tracking.<br />
                        • Native PWA integration for faster load times.<br />
                        • Verified gold investment interface improvements.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pb-8 text-center opacity-20 select-none">
                <p className="text-[8px] font-black uppercase tracking-[0.5em]">Native Store v4.5.0 • Powered by DGS Cloud</p>
            </div>

            <style jsx>{`
                .animate-slide-up {
                    animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
