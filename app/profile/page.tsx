"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import { countries } from "@/lib/countries";
import { useLanguage } from "@/lib/LanguageContext";

export default function ProfilePage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [userData, setUserData] = useState<any | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [stats, setStats] = useState({ recharge: 0, withdraw: 0, activeDailyIncome: 0, totalGeneratedIncome: 0 });
    const [teamCounts, setTeamCounts] = useState({ B: 0, C: 0, D: 0, E: 0 });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            if (user) {
                const userRef = doc(db, "Customers", user.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap: any) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    }
                });
                return () => unsubDoc();
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!userData?.uid) return;

        // 1. Recharge & Withdraw
        const qRecharge = query(collection(db, "RechargeReview"), where("userId", "==", userData.uid), where("status", "==", "approved"));
        const unsubRecharge = onSnapshot(qRecharge, snap => {
            const total = snap.docs.reduce((acc, d) => acc + (Number(d.data().amount) || 0), 0);
            setStats(prev => ({ ...prev, recharge: total }));
        });

        const qWithdraw = query(collection(db, "withdraw"), where("userId", "==", userData.uid), where("status", "==", "approved"));
        const unsubWithdraw = onSnapshot(qWithdraw, snap => {
            const total = snap.docs.reduce((acc, d) => acc + (Number(d.data().amount) || 0), 0);
            setStats(prev => ({ ...prev, withdraw: total }));
        });

        // 3. Active Daily Income & Total Income from UserOrders
        const qOrders = query(collection(db, "UserOrders"), where("userId", "==", userData.uid));
        const unsubOrders = onSnapshot(qOrders, snap => {
            let todayInc = 0;
            let totalInc = 0;

            snap.docs.forEach(doc => {
                const data = doc.data();
                const daily = Number(data.dailyIncome) || 0;

                // Today Income (Active orders only)
                if (data.status === 'active') {
                    todayInc += daily;
                }

                // Total Income (Accumulated from all orders)
                const period = Number(data.contractPeriod) || 0;
                const remaining = Number(data.remainingDays); // can be 0
                const daysPaid = Math.max(0, period - (isNaN(remaining) ? period : remaining));
                totalInc += daysPaid * daily;
            });

            setStats(prev => ({ ...prev, activeDailyIncome: todayInc, totalGeneratedIncome: totalInc }));
        });

        // 2. Team Size
        const levels = ["inviterA", "inviterB", "inviterC", "inviterD"];
        const teamUnsubs = levels.map((field, idx) => {
            const key = ["B", "C", "D", "E"][idx];
            return onSnapshot(query(collection(db, "Customers"), where(field, "==", userData.uid)), snap => {
                const validCount = snap.docs.filter(d => d.data().isValidMember).length;
                setTeamCounts(prev => ({ ...prev, [key]: validCount }));
            });
        });

        return () => {
            unsubRecharge();
            unsubWithdraw();
            unsubOrders();
            teamUnsubs.forEach(u => u());
        };
    }, [userData?.uid]);

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
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/welcome')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-wide">{t.dashboard.myProfile}</h2>
            </div>

            <div className="animate-fade-in flex flex-col flex-grow pt-4 h-full pb-32">
                {/* Unified Profile Container - Single Large Card */}
                <div className="bg-white rounded-t-[2.5rem] shadow-2xl border-x-0 border-b-0 border-t border-gray-100/50 w-full flex-grow flex flex-col overflow-visible relative min-h-[calc(100vh-100px)]">
                    {/* Accent Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

                    {/* 1. Identity Header Section */}
                    <div className="p-6 pb-2 relative z-10 w-full">
                        <div className="flex items-start justify-between relative w-full gap-2">
                            <div className="flex items-center gap-4 text-left min-w-0">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 p-0.5 shadow-md relative shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white relative ring-2 ring-white">
                                        <Image src="/profile.avif" alt="Profile" fill className="object-cover" />
                                    </div>
                                    <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none truncate">{t.dashboard.memberLabel}</h3>
                                    <div className="flex flex-col gap-0.5 mt-1.5 font-bold">
                                        <p className="text-[11px] text-gray-400 uppercase tracking-widest leading-none">
                                            UID: <span className="text-gray-500 font-black">{userData?.uid ? userData.uid.slice(0, 6) : "..."}</span>
                                        </p>
                                        <p className="text-[15px] text-gray-500 tracking-wider">
                                            {userData?.phoneNumber ? `251***${userData.phoneNumber.slice(-5)}` : "..."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2.5 mt-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-100/40 w-fit shadow-inner">
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] leading-none">{t.dashboard.balanceLabel}</span>
                                        <span className="text-[16px] font-black text-gray-900 tracking-tight flex items-baseline gap-0.5">
                                            {userData?.balanceWallet?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            <span className="text-indigo-400 font-bold ml-1">ETB</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end justify-between min-h-[85px] shrink-0">
                                {/* Country Indicator */}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100/30 shadow-sm min-w-[110px] justify-center text-left">
                                    <div className="w-5 h-3.5 rounded-[2px] overflow-hidden shadow-sm ring-1 ring-gray-100 flex-shrink-0">
                                        <Image
                                            src={countries.find(c => c.name.toLowerCase() === (userData?.country || "").toLowerCase())?.flag || "/Ethiopia.png"}
                                            alt={userData?.country || "Country"}
                                            width={20}
                                            height={14}
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                        {userData?.country || "Ethiopia"}
                                    </span>
                                </div>

                                {/* VIP Badge */}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff8ef] border border-[#ffecd1] shadow-sm transform translate-y-0.5">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#ff9a02] to-[#ffcb05] flex items-center justify-center shadow-sm">
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black text-[#ff9a02] uppercase tracking-widest">VIP {userData?.VIP || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-3 gap-y-6 gap-x-2 p-6 pb-2">
                        {[
                            { label: t.dashboard.totalRecharge, value: stats.recharge, color: "bg-purple-500" },
                            { label: t.dashboard.totalIncome, value: stats.totalGeneratedIncome, color: "bg-blue-500" },
                            { label: t.dashboard.totalWithdraw, value: stats.withdraw, color: "bg-orange-500" },
                            { label: t.dashboard.teamIncome, value: userData?.totalTeamIncome || 0, color: "bg-purple-500" },
                            { label: t.dashboard.teamSize, value: Object.values(teamCounts).reduce((a: number, b: number) => a + b, 0), color: "bg-blue-500", isCount: true },
                            { label: t.dashboard.todayIncome, value: stats.activeDailyIncome, color: "bg-orange-500" }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1 h-3 rounded-full ${stat.color}`}></div>
                                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{stat.label}</span>
                                </div>
                                <span className="text-lg font-black text-gray-900 leading-none">
                                    {stat.isCount
                                        ? stat.value
                                        : (typeof stat.value === 'number' ? stat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00")}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="mx-6 border-b border-gray-50/80"></div>

                    {/* 2. Content Section (Actions, Settings, Logout) */}
                    <div className="flex-1">
                        {/* Action Grid */}
                        <div className="grid grid-cols-4 gap-2 p-7 pb-4">
                            {[
                                {
                                    label: t.dashboard.myJewelry,
                                    iconUrl: "/jewelry_icon.png",
                                    color: "from-blue-500 to-indigo-600",
                                    action: () => router.push('/subsidy')
                                },
                                {
                                    label: t.dashboard.download,
                                    iconUrl: "/dgs_app_icon.png",
                                    color: "from-emerald-500 to-teal-600",
                                    action: () => router.push('/download')
                                },
                                {
                                    label: t.dashboard.bankLabel,
                                    iconUrl: "/bank_icon.png",
                                    color: "from-amber-500 to-orange-600",
                                    action: () => router.push('/bank')
                                },
                                {
                                    label: t.dashboard.serviceLabel,
                                    iconUrl: "/service_icon.png",
                                    color: "from-purple-500 to-pink-600",
                                    action: () => router.push('/service')
                                }
                            ].map((item: any, idx) => (
                                <button
                                    key={idx}
                                    onClick={item.action}
                                    className="flex flex-col items-center gap-2.5 group relative"
                                >
                                    <div className="w-15 h-15 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100 transition-all group-active:scale-90 group-hover:shadow-xl group-hover:-translate-y-1 relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                                        {item.iconUrl ? (
                                            <div className="relative w-full h-full p-2.5">
                                                <Image src={item.iconUrl} alt={item.label || "Menu icon"} fill className="object-contain" />
                                            </div>
                                        ) : (
                                            <svg className="w-6.5 h-6.5 text-gray-800 relative z-10 transition-all duration-300 group-hover:text-indigo-600 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-black text-gray-500 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Settings List */}
                        <div className="divide-y divide-gray-50/50">
                            {[
                                { label: t.dashboard.fundingDetails, icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", bg: "bg-blue-50/50", text: "text-blue-600", href: '/funding' },
                                { label: t.dashboard.withdrawalRecord, icon: "M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0V12m-3-1.5a3 3 0 00-6 0v1a3 3 0 006 0m-6 0h6m-6 0a3 3 0 016 0v1.5m6 3.5v-3.5m0 3.5a1.5 1.5 0 01-3 0V10a1.5 1.5 0 013 0v4.5z", bg: "bg-emerald-50/50", text: "text-emerald-600", href: '/withdrawal-record' },
                                { label: t.dashboard.loginPassword, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", bg: "bg-purple-50/50", text: "text-purple-600", href: '/change-password' },
                                { label: t.dashboard.rechargeRecord, icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", bg: "bg-amber-50/50", text: "text-amber-600", href: '/recharge-record' },
                                { label: t.dashboard.withdrawalPasswordLabel, icon: "M15 7a2 2 0 012 2m-2 4a2 2 0 012 2m-4-7a3 3 0 013 3v8a3 3 0 01-3 3H9a3 3 0 01-3-3V9a3 3 0 013-3h3z", bg: "bg-indigo-50/50", text: "text-indigo-600", href: '/withdrawal-password' }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => item.href && router.push(item.href)}
                                    className="w-full flex items-center justify-between px-8 py-5 hover:bg-gray-50/80 transition-all group text-left cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-[1.25rem] ${item.bg} backdrop-blur-md border border-white shadow-sm flex items-center justify-center ${item.text} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md`}>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[15px] font-black text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{item.label}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 group-hover:text-indigo-300 transition-colors">{t.dashboard.accessProfileData}</span>
                                        </div>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-indigo-50 transition-all group-hover:translate-x-1 outline outline-1 outline-gray-100 group-hover:outline-indigo-100">
                                        <svg className="w-4.5 h-4.5 text-gray-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Logout Button */}
                        <div className="p-8 pt-4 pb-32">
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full py-5 rounded-[2rem] bg-gray-50 text-[#ff3a30] hover:bg-red-50 hover:text-red-600 transition-all duration-300 font-black uppercase tracking-[0.15em] text-[15px] shadow-sm flex items-center justify-center gap-4 active:scale-[0.97] group border border-gray-100 hover:border-red-100"
                            >
                                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm transition-all duration-300 group-hover:bg-red-100 group-hover:rotate-12">
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                {isLoggingOut ? t.dashboard.processing : t.dashboard.logoutAccount}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
