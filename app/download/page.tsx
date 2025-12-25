"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DownloadPage() {
    const router = useRouter();
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const handleDownload = () => {
        setIsDownloading(true);
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setIsComplete(true);
                setIsDownloading(false);
            }
            setProgress(currentProgress);
        }, 300);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="w-full max-w-xl flex items-center mb-12 relative z-10">
                <button
                    onClick={() => router.back()}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="flex-1 text-center text-xl font-black tracking-widest uppercase opacity-60">Installation</h1>
            </div>

            {/* App Icon Container */}
            <div className="relative z-10 flex flex-col items-center text-center mt-10">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-[3.5rem] blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
                    <div className="relative w-48 h-48 rounded-[3.5rem] bg-gradient-to-br from-[#121212] to-[#050505] p-0 border border-white/10 shadow-3xl overflow-hidden active:scale-95 transition-transform duration-500">
                        <Image
                            src="/dgs_app_icon.png"
                            alt="DGS App Icon"
                            fill
                            className="object-cover scale-110"
                        />
                    </div>
                </div>

                <h2 className="text-5xl font-black mt-10 tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">DGS PRO</h2>
                <p className="text-blue-400 font-bold uppercase tracking-[0.3em] text-xs mt-3 opacity-80">Next-Gen Investment Platform</p>

                <div className="flex items-center gap-6 mt-10 opacity-60">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black tracking-tight">4.9 ★</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Rating</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black tracking-tight">28 MB</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Size</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-black tracking-tight">500K+</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Downloads</span>
                    </div>
                </div>
            </div>

            {/* Download Button Section */}
            <div className="w-full max-w-sm mt-16 relative z-10 px-6">
                {!isComplete ? (
                    <div className="space-y-6">
                        {isDownloading && (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-blue-400">
                                    <span>Downloading...</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`w-full h-18 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${isDownloading
                                ? "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-500/20 hover:shadow-blue-500/40"
                                }`}
                        >
                            {isDownloading ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Download App</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4-4v12" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 border border-emerald-500/20">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black tracking-tight">Downloaded!</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Installation complete</p>
                        </div>
                        <button
                            onClick={() => router.push('/welcome')}
                            className="text-blue-400 font-black uppercase tracking-widest text-[11px] hover:underline mt-2"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Text */}
            <div className="mt-auto pb-10 text-center opacity-30 select-none">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Official DGS Distribution Hub</p>
                <p className="text-[9px] font-bold mt-2">v2.4.1 • Secure & Encrypted</p>
            </div>
        </div>
    );
}
