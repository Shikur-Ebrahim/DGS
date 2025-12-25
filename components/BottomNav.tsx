"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { id: "welcome", label: t.dashboard.homeLabel, image: "/nav/home.png", path: "/welcome" },
        { id: "wallet", label: t.dashboard.walletLabel, image: "/nav/wallet.png", path: "/wallet" },
        { id: "product", label: t.dashboard.productLabel, image: "/nav/product.png", path: "/product" },
        { id: "team", label: t.dashboard.teamLabel, image: "/nav/team.png", path: "/team" },
        { id: "profile", label: t.dashboard.profileLabel, image: "/nav/profile.png", path: "/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <nav className="max-w-md mx-auto h-20 bg-[#131313]/90 backdrop-blur-2xl border-t border-white/5 rounded-t-3xl flex items-center justify-around px-4 shadow-2xl pointer-events-auto ring-1 ring-white/5">
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.id === 'welcome' && pathname === '/welcome');
                    const isWallet = item.id === 'wallet';

                    return (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive ? 'scale-110' : 'text-gray-400 hover:text-white hover:scale-105'}`}
                        >
                            <div className={`w-12 h-12 p-1 rounded-xl transition-all duration-300 relative overflow-hidden group ${isActive ? 'bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-transparent'}`}>
                                {isWallet && !isActive && (
                                    <div className="absolute inset-0 bg-blue-500/5"></div>
                                )}
                                <div className="relative z-10 w-full h-full">
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className={`w-full h-full object-contain transform transition-all duration-300 ${isActive ? 'brightness-125 saturate-150 scale-110' : 'opacity-70 grayscale-[0.5] group-hover:opacity-100 group-hover:grayscale-0'}`}
                                    />
                                </div>
                            </div>
                            <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
