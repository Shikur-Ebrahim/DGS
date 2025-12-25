"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminWelcomePage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [pendingRechargeCount, setPendingRechargeCount] = useState(0);
    const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);

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

    // Monitor pending recharge requests
    useEffect(() => {
        if (!isChecking) {
            // Monitor pending recharge requests
            const rechargeQuery = query(
                collection(db, "RechargeReview"),
                where("status", "==", "pending")
            );

            const unsubscribeRecharge = onSnapshot(rechargeQuery, (snapshot) => {
                setPendingRechargeCount(snapshot.docs.length);
            });

            // Monitor pending withdrawal requests
            const withdrawalQuery = query(
                collection(db, "withdraw"),
                where("status", "==", "pending")
            );

            const unsubscribeWithdrawal = onSnapshot(withdrawalQuery, (snapshot) => {
                setPendingWithdrawalCount(snapshot.docs.length);
            });

            return () => {
                unsubscribeRecharge();
                unsubscribeWithdrawal();
            };
        }
    }, [isChecking]);

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

            {/* Sidebar */}
            <AdminSidebar />

            <div className="relative z-10 space-y-8 animate-fade-in pt-20 lg:pl-72 lg:pt-0 w-full">
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
                        DGS System Control Panel is now active. You have full administrative privileges.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {/* Recharge Card */}
                    <button
                        onClick={() => router.push('/admin/recharge')}
                        className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-20 h-20 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Recharge Requests</h3>
                            <p className="text-gray-400 text-sm mb-4">Verify user deposits</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-blue-400">{pendingRechargeCount}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending</span>
                            </div>
                        </div>
                    </button>

                    {/* Withdrawal Card */}
                    <button
                        onClick={() => router.push('/admin/withdrawals')}
                        className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-20 h-20 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Withdrawal Wallet</h3>
                            <p className="text-gray-400 text-sm mb-4">Approve user cashouts</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-emerald-400">{pendingWithdrawalCount}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending</span>
                            </div>
                        </div>
                    </button>

                    <button className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-bold flex items-center justify-center gap-3 group">
                        <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        User Manager
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-3 group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
            </div>
        </div>
    );
}
