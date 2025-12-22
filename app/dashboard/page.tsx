"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("home");
    const [headerText, setHeaderText] = useState("Home");

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const tabs = [
        {
            id: "home", label: "Home", icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            id: "wallet", label: "Wallet", icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )
        },
        {
            id: "products", label: "Products", icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            id: "tasks", label: "Tasks", icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            id: "profile", label: "Profile", icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
    ];

    const renderContent = () => {
        // Tab colors for gradient effects
        const tabColors: Record<string, string> = {
            home: "from-blue-500 to-purple-600",
            wallet: "from-emerald-400 to-teal-600",
            products: "from-pink-500 to-rose-600",
            tasks: "from-amber-400 to-orange-600",
            profile: "from-cyan-400 to-blue-600"
        };

        const gradient = tabColors[activeTab] || "from-gray-500 to-gray-700";

        // ALL TABS are now "Coming Soon" style for consistency
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6 relative">
                {/* Background Glow */}
                <div className={`w-64 h-64 rounded-full bg-gradient-to-br ${gradient} blur-[100px] opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none`}></div>

                <div className="relative text-center space-y-6 z-10 p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg shadow-purple-500/20 mb-2`}>
                        {tabs.find(t => t.id === activeTab)?.icon}
                    </div>

                    <h2 className={`text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent uppercase tracking-wider`}>
                        {activeTab}
                    </h2>

                    <div className="space-y-2">
                        <p className="text-xl font-bold text-white tracking-widest uppercase">Coming Soon</p>
                        <p className="text-gray-400 text-sm max-w-[200px] mx-auto leading-relaxed">
                            We are working hard to bring you the best {activeTab} experience.
                        </p>
                    </div>

                    <div className="pt-4">
                        <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-xs font-mono text-gray-300 border border-white/5">
                            v1.0.0
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-[#0a0a0a]">

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-lg shadow-blue-500/20">
                        <div className="w-full h-full rounded-[10px] bg-[#0a0a0a] flex items-center justify-center">
                            <span className="text-sm font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">L</span>
                        </div>
                    </div>
                    <h1 className="text-xl font-bold capitalize bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {activeTab}
                    </h1>
                </div>

                {/* Logout Button - Advanced Style */}
                {/* Logout Button - Advanced Style */}
                <button
                    onClick={handleLogout}
                    className="group relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 overflow-hidden transition-all duration-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-md active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>

                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-pink-600/20 group-hover:from-red-500 group-hover:to-pink-600 transition-all duration-300">
                        <svg className="w-4 h-4 text-red-400 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>

                    <span className="text-xs font-bold text-gray-400 group-hover:text-red-400 uppercase tracking-widest transition-colors duration-300 pr-1">
                        Log Out
                    </span>
                </button>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden pb-32">
                {renderContent()}
            </main>

            {/* Bottom Navigation - Advanced Style */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
                <div className="flex justify-between items-center px-6 py-4">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        // Unique colors per tab for the "advanced" feel
                        const colors: Record<string, string> = {
                            home: "from-blue-600 to-violet-600 shadow-blue-500/40",
                            wallet: "from-emerald-400 to-teal-500 shadow-emerald-500/40", // Matches the green card image
                            products: "from-rose-500 to-pink-600 shadow-rose-500/40",
                            tasks: "from-amber-400 to-orange-500 shadow-orange-500/40",
                            profile: "from-cyan-400 to-blue-500 shadow-cyan-500/40"
                        };
                        // @ts-ignore
                        const activeClass = colors[tab.id];

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="relative group flex flex-col items-center justify-center w-12 h-12"
                            >
                                {/* Active Glow Background */}
                                {isActive && (
                                    <div className={`absolute inset-0 bg-gradient-to-r ${activeClass} rounded-[18px] blur-md opacity-60 transition-all duration-500`}></div>
                                )}

                                {/* Button Container */}
                                <div className={`
                                    relative z-10 flex items-center justify-center w-12 h-12 rounded-[18px] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                                    ${isActive
                                        ? `bg-gradient-to-br ${activeClass} -translate-y-6 scale-125 shadow-2xl text-white ring-[3px] ring-[#0a0a0a]`
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white backdrop-blur-lg border border-white/5'
                                    }
                                `}>
                                    <div className={`transition-transform duration-300 ${isActive ? 'scale-90' : 'group-hover:scale-110'}`}>
                                        {tab.icon}
                                    </div>
                                </div>

                                {/* Active Dot Indicator (replaced label for stronger visual) */}
                                {isActive && (
                                    <div className="absolute -bottom-4 w-1.5 h-1.5 rounded-full bg-white shadow-lg animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
