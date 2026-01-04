"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [pendingRechargeCount, setPendingRechargeCount] = useState(0);
    const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    useEffect(() => {
        // Monitor pending recharge requests
        const rechargeQuery = query(
            collection(db, "RechargeReview"),
            where("status", "==", "pending")
        );
        const unsubscribeRecharge = onSnapshot(rechargeQuery, (snapshot: any) => {
            setPendingRechargeCount(snapshot.docs.length);
        });

        // Monitor pending withdrawal requests
        const withdrawalQuery = query(
            collection(db, "withdraw"),
            where("status", "==", "pending")
        );
        const unsubscribeWithdrawal = onSnapshot(withdrawalQuery, (snapshot: any) => {
            setPendingWithdrawalCount(snapshot.docs.length);
        });

        // Monitor unread chat messages
        const chatsQuery = query(collection(db, "Chats"));
        const unsubscribeChats = onSnapshot(chatsQuery, (snapshot: any) => {
            const totalUnread = snapshot.docs.reduce((sum: number, doc: any) => {
                return sum + (doc.data().unreadAdmin || 0);
            }, 0);
            setUnreadChatCount(totalUnread);
        });

        return () => {
            unsubscribeRecharge();
            unsubscribeWithdrawal();
            unsubscribeChats();
        };
    }, []);

    const menuSections = [
        {
            title: "Main",
            items: [
                {
                    name: "Dashboard", path: "/admin/welcome", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    )
                },
            ]
        },
        {
            title: "Operations",
            items: [
                {
                    name: "Recharge", path: "/admin/recharge", count: pendingRechargeCount, icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )
                },
                {
                    name: "Withdrawal Wallet", path: "/admin/withdrawals", count: pendingWithdrawalCount, icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                },
                {
                    name: "Withdrawal Rules", path: "/admin/withdrawal-rules", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    )
                },
                {
                    name: "Withdrawals Map", path: "/admin/withdrawal-banks", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    name: "Exchange Rate", path: "/admin/exchange-rate", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                },
            ]
        },
        {
            title: "Engagement",
            items: [
                {
                    name: "Customer Service", path: "/admin/cust-service", count: unreadChatCount, icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    )
                },
                {
                    name: "Customers", path: "/admin/customers", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )
                },
                {
                    name: "Telegram", path: "/admin/telegram", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    )
                },
            ]
        },
        {
            title: "Products & Tasks",
            items: [
                {
                    name: "Products", path: "/admin/products", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    )
                },
                {
                    name: "Daily Tasks", path: "/admin/daily-tasks", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    )
                },
                {
                    name: "Task Rules", path: "/admin/task-rules", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                    )
                },
            ]
        },
        {
            title: "Infrastructure",
            items: [
                {
                    name: "Banks", path: "/admin/banks", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                    )
                },
                {
                    name: "Payments", path: "/admin/payment-methods", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    )
                },
                {
                    name: "Daily Profit", path: "/admin/profit", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    )
                },
            ]
        },
        {
            title: "System",
            items: [
                {
                    name: "Logs", path: "/admin/notifications", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    )
                },
                {
                    name: "Broadcast", path: "/admin/platform-notifications", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                    )
                },
                {
                    name: "About", path: "/admin/about", icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                },
            ]
        }
    ];

    const handleLogout = async () => {
        if (confirm("Sign out of Admin Panel?")) {
            setIsLoggingOut(true);
            try {
                await signOut(auth);
                router.push("/admin");
            } catch (error) {
                console.error("Logout failed", error);
                setIsLoggingOut(false);
            }
        }
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 right-4 z-[60] p-2.5 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-90 transition-all border border-blue-400/20 backdrop-blur-md"
            >
                {isMobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
            </button>

            {/* Sidebar (Desktop + Mobile Drawer) */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-[#0d0f12] border-r border-white/5 z-50
                flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                        <span className="font-black text-white text-xl tracking-tighter">D</span>
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="font-black text-white text-lg tracking-tight uppercase group-hover:text-blue-400 transition-colors">DGS Admin</h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black">Secure System v4.5</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto pt-8 pb-4 px-4 space-y-8 scrollbar-hide">
                    {menuSections.map((section, sIndex) => (
                        <div key={sIndex} className="space-y-2">
                            <h3 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-4 h-[1px] bg-gray-800"></span>
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.path;
                                    const isRecharge = item.name === "Recharge";
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`
                                                flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden
                                                ${isActive
                                                    ? (isRecharge
                                                        ? 'bg-emerald-500/10 text-emerald-400 font-black'
                                                        : 'bg-white/10 text-white font-black')
                                                    : 'text-gray-500 hover:bg-white/[0.03] hover:text-gray-200'
                                                }
                                            `}
                                        >
                                            {/* Selection Indicator */}
                                            {isActive && (
                                                <div className={`
                                                    absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full shadow-lg
                                                    ${isRecharge ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-blue-500 shadow-blue-500/50'}
                                                `}></div>
                                            )}

                                            <div className={`
                                                p-2 rounded-xl transition-all duration-300
                                                ${isActive
                                                    ? (isRecharge
                                                        ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
                                                        : 'text-blue-500 scale-110')
                                                    : 'bg-white/[0.03] text-gray-600 group-hover:text-gray-200 group-hover:scale-110'
                                                }
                                            `}>
                                                {item.icon}
                                            </div>

                                            <span className="text-sm tracking-tight">{item.name}</span>

                                            {item.count !== undefined && item.count > 0 && (
                                                <div className="ml-auto flex items-center">
                                                    <span className={`
                                                        px-2.5 py-1 text-[10px] font-black rounded-lg min-w-[22px] text-center shadow-lg
                                                        ${isActive
                                                            ? (isRecharge ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600')
                                                            : 'bg-indigo-600 text-white border border-indigo-500/20'
                                                        }
                                                    `}>
                                                        {item.count}
                                                    </span>
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-6 border-t border-white/5 bg-[#0a0c0f]">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-500/5 to-transparent border border-red-500/10 text-red-400 hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-500 font-black text-xs uppercase tracking-widest group shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10 group-hover:bg-white/20 transition-colors">
                                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <span>{isLoggingOut ? "Log-out..." : "Log-out"}</span>
                        </div>
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <div className="mt-6 flex items-center justify-between px-2">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-[#0a0c0f] bg-gray-800 flex items-center justify-center text-[8px] font-black text-gray-500">
                                    {i}
                                </div>
                            ))}
                        </div>
                        <p className="text-[8px] text-gray-700 font-black uppercase tracking-tighter">Powered by Lumio Global</p>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-fade-in transition-all duration-500"
                ></div>
            )}
        </>
    );
}

