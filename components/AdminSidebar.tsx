"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Helper for Icons (using generic placeholders for reconstructed items)
const Icons = {
    Dashboard: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    Users: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Money: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    List: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    ),
    Search: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Menu: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    Close: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    )
};

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
    const [pendingRecharges, setPendingRecharges] = useState(0);

    // Real-time listener for pending withdrawals
    useEffect(() => {
        const q = query(collection(db, "withdraw"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingWithdrawals(snapshot.size);
        });
        return () => unsubscribe();
    }, []);

    // Real-time listener for pending recharges
    useEffect(() => {
        const q = query(collection(db, "RechargeReview"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingRecharges(snapshot.size);
        });
        return () => unsubscribe();
    }, []);

    // Reconstructed Menu Items based on file structure + Team Search
    const menuItems = [
        // Main Dashboard / Exchange Rate often serves as home
        { name: "Exchange Rates", path: "/admin/exchange-rate", icon: Icons.Dashboard },

        // The Requested ADDITION
        { name: "Team Search & Track", path: "/admin/team-search", icon: Icons.Search },
        { name: "Product Tracked", path: "/admin/product-tracker", icon: Icons.List },

        // User Management
        { name: "Customers", path: "/admin/customers", icon: Icons.Users },

        // Financials
        { name: "Withdrawals", path: "/admin/withdrawals", icon: Icons.Money, badge: pendingWithdrawals },
        { name: "Withdrawal Banks", path: "/admin/withdrawal-banks", icon: Icons.Money },
        { name: "Withdrawal Rules", path: "/admin/withdrawal-rules", icon: Icons.List },
        { name: "Recharge Review", path: "/admin/recharge", icon: Icons.Money, badge: pendingRecharges },
        { name: "Payment Methods", path: "/admin/payment-methods", icon: Icons.Money },
        { name: "Banks", path: "/admin/banks", icon: Icons.Money },
        { name: "Profit Management", path: "/admin/profit", icon: Icons.Money },

        // Content / Rules
        { name: "Products", path: "/admin/products", icon: Icons.List },
        { name: "Task Rules", path: "/admin/task-rules", icon: Icons.List },
        { name: "Daily Tasks", path: "/admin/daily-tasks", icon: Icons.List },
        { name: "Notifications", path: "/admin/notifications", icon: Icons.List },
        { name: "Platform Notifs", path: "/admin/platform-notifications", icon: Icons.List },

        // Settings / Info
        { name: "Customer Service", path: "/admin/cust-service", icon: Icons.Users },
        { name: "Telegram", path: "/admin/telegram", icon: Icons.List },
        { name: "About Info", path: "/admin/about", icon: Icons.List },
    ];

    // Don't show sidebar on login page
    if (pathname === "/admin") return null;

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 left-4 z-[70] p-3 bg-blue-600 rounded-xl shadow-lg text-white"
            >
                {isMobileOpen ? Icons.Close : Icons.Menu}
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 z-[60]"
                />
            )}

            {/* Desktop Sidebar + Mobile Vertical Sidebar */}
            <div className={`flex flex-col h-screen bg-[#0f0f0f] border-r border-white/5 transition-all duration-300 fixed left-0 top-0 z-[65] ${isCollapsed ? 'w-20' : 'w-64'
                } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    {!isCollapsed && (
                        <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                            ADMIN PANEL
                        </h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:block p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3 no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                title={isCollapsed ? item.name : ""}
                            >
                                <div className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} shrink-0`}>
                                    {item.icon}
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">{item.name}</span>
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => router.push('/welcome')}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {!isCollapsed && <span className="font-bold text-sm">Exit Admin</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
