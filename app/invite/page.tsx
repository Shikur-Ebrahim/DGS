"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function InvitePage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [userData, setUserData] = useState<any | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        setBaseUrl(window.location.origin);
        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const userRef = doc(db, "Customers", user.uid);
                const unsub = onSnapshot(userRef, (docSnap: any) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    }
                });
                return () => unsub();
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    const referralLink = `${baseUrl}/?ref=${userData?.referralCode || ""}`;

    const handleCopy = () => {
        if (!userData?.uid) return;
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            {/* Top Bar */}
            <div className="px-6 py-5 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors group"
                >
                    <svg className="w-6 h-6 text-gray-900 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{t.dashboard.inviteLabel}</h1>
                <div className="w-10"></div> {/* Spacer for symmetry */}
            </div>

            <div className="flex-1 flex flex-col px-8 pt-10 pb-32 animate-fade-in text-center max-w-md mx-auto w-full">
                {/* Text Section */}
                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
                    {t.dashboard.inviteFriends}
                </h2>

                {/* Illustration Section */}
                <div className="relative mt-16 mb-16 flex items-center justify-center">
                    {/* Dashed Circle */}
                    <div className="absolute w-64 h-64 rounded-full border-2 border-dashed border-indigo-200 animate-spin-slow"></div>

                    {/* Floating Dot logic from screenshot */}
                    <div className="absolute w-64 h-64 rounded-full border-2 border-transparent">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                    </div>

                    {/* Central Image Placeholder - Shaking Hands */}
                    <div className="relative w-48 h-48 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center shadow-inner overflow-hidden border border-indigo-50/50">
                        {/* Replace with your 3D handshake image if available */}
                        <div className="w-32 h-32 relative">
                            <Image
                                src="/jewelry_icon.png"
                                alt="Invitation"
                                fill
                                className="object-contain drop-shadow-2xl animate-float"
                            />
                        </div>
                    </div>
                </div>

                {/* Invite Button Section */}
                <div className="mt-auto space-y-4">
                    <button
                        onClick={handleCopy}
                        className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                        {copySuccess ? t.dashboard.linkCopied : t.dashboard.inviteBtn}
                    </button>
                    {/* Tiny helpful text instead of the big box */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        {t.dashboard.referralLinkLabel}
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
