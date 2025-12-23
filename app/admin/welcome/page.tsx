"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

export default function AdminWelcomePage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    // Redirect non-admins to the standard welcome page
                    router.push("/welcome");
                } else {
                    setIsChecking(false);
                }
            } else {
                // Not logged in at all
                router.push("/admin");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            router.push("/admin");
        } catch (error) {
            console.error("Logout failed:", error);
            setIsLoggingOut(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 space-y-8 animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 p-[2px] shadow-2xl shadow-blue-500/20">
                        <div className="w-full h-full rounded-[22px] bg-[#0a0a0a] flex items-center justify-center">
                            <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-widest">
                        Administrator
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                        Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Master</span>
                    </h1>
                    <p className="text-gray-400 text-xl max-w-lg mx-auto leading-relaxed">
                        Lumio System Control Panel is now active. You have full administrative privileges.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                    <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-bold flex items-center justify-center gap-3 group">
                        <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        System Logs
                    </button>
                    <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-bold flex items-center justify-center gap-3 group">
                        <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        User Manager
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="group relative px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 active:scale-95 disabled:opacity-50 overflow-hidden"
                >
                    <div className="relative z-10 flex items-center gap-3 justify-center">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-black uppercase tracking-widest text-sm">{isLoggingOut ? "Leaving..." : "Exit Portal"}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
