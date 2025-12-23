"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WelcomePage() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 space-y-8 animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-2xl shadow-blue-500/20">
                        <div className="w-full h-full rounded-[14px] bg-[#0a0a0a] flex items-center justify-center">
                            <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">L</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                        Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Back!</span>
                    </h1>
                    <p className="text-gray-400 text-xl max-w-md mx-auto">
                        You've successfully signed in to your account.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="group relative px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                    <div className="relative z-10 flex items-center gap-2">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-semibold">{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
