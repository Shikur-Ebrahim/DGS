"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { checkAndUpgradeVIP } from "@/lib/vipService";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";

export default function TeamPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [teamStats, setTeamStats] = useState({
        B: { count: 0, assets: 0 },
        C: { count: 0, assets: 0 },
        D: { count: 0, assets: 0 },
        E: { count: 0, assets: 0 },

    });

    const [userData, setUserData] = useState<any | null>(null);
    const [teamSize, setTeamSize] = useState(0);
    const [teamIncreasedToday, setTeamIncreasedToday] = useState(0);
    const [teamTotalAssets, setTeamTotalAssets] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);

    // New State for Details/Tabs
    const [showDetails, setShowDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<"B" | "C" | "D" | "E">("B");
    const [activeTabMembers, setActiveTabMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);


    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                // 1. User Data Listener
                const userRef = doc(db, "Customers", user.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap: any) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: user.uid, ...docSnap.data() });
                    }
                });

                // 2. Team Metrics Listeners (A-E)
                const customersRef = collection(db, "Customers");
                const levels = ["inviterA", "inviterB", "inviterC", "inviterD"];

                const unsubs = levels.map((field, idx) => {
                    const levelKey = String.fromCharCode(66 + idx); // B, C, D, E
                    const q = query(customersRef, where(field, "==", user.uid));

                    return onSnapshot(q, (snapshot: any) => {
                        const validDocs = snapshot.docs.filter((d: any) => d.data().isValidMember);
                        const count = validDocs.length;
                        const assets = validDocs.reduce((acc: any, d: any) => acc + (d.data().balanceWallet || 0), 0);

                        setTeamStats(prev => ({
                            ...prev,
                            [levelKey]: { count, assets }
                        }));

                        // For Level A, also update the main headers
                        if (levelKey === "B") {
                            setTeamSize(count);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const todayTimestamp = Timestamp.fromDate(today);
                            const increasedToday = validDocs.filter((d: any) => {
                                const createdAt = d.data().createdAt;
                                return createdAt && createdAt.toMillis() >= todayTimestamp.toMillis();
                            }).length;
                            setTeamIncreasedToday(increasedToday);
                        }
                    });
                });

                return () => {
                    unsubDoc();
                    unsubs.forEach(unsub => unsub());
                };
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        const total = Object.values(teamStats).reduce((acc, curr) => acc + curr.assets, 0);
        setTeamTotalAssets(total);

        // Check for VIP Upgrade
        if (userData?.uid && teamSize > 0) {
            checkAndUpgradeVIP(userData.uid, teamSize, total);
        }
    }, [teamStats, teamSize, userData?.uid]);

    // Fetch members for active tab (Only when showDetails is true to save reads)
    useEffect(() => {
        if (!userData?.uid || !showDetails) return;

        setLoadingMembers(true);
        const customersRef = collection(db, "Customers");
        const tabToField: Record<string, string> = { "B": "inviterA", "C": "inviterB", "D": "inviterC", "E": "inviterD" };
        const inviterField = tabToField[activeTab];
        const q = query(customersRef, where(inviterField, "==", userData.uid));

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const members = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            setActiveTabMembers(members);
            setLoadingMembers(false);
        });

        return () => unsubscribe();
    }, [activeTab, userData?.uid, showDetails]);

    const handleCopyLink = () => {
        if (!userData?.uid) return;
        const referralLink = `${window.location.origin}/?ref=${userData.referralCode}`;
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const teamIncome = userData?.inviteWallet || 0;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/welcome')}
                        className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all transform active:scale-90 border border-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase italic">{t.dashboard.myTeam}</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.dashboard.liveInfo}</span>
                </div>
            </div>

            <div className="p-6 space-y-8 animate-fade-in relative z-10 max-w-lg mx-auto">
                {/* Main Stats Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-600/20 rounded-[3rem] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-[#111111]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden">
                        <div className="flex flex-col items-center">
                            {/* Circular Team Income Indicator */}
                            <div className="relative w-48 h-48 mb-6">
                                {/* Base Circle */}
                                <div className="absolute inset-0 rounded-full border-4 border-white/5 shadow-inner"></div>
                                {/* Gradient Progress Ring */}
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-indigo-500 animate-spin-slow"></div>
                                <div className="absolute inset-2 rounded-full border-2 border-white/5 border-dashed"></div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 shadow-lg shadow-blue-500/20 border border-blue-500/20">
                                        <Image src="/jewelry_icon.png" alt="Trophy" width={24} height={24} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t.dashboard.teamIncome}</p>
                                    <p className="text-2xl font-black text-white leading-tight mt-1">{teamIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[10px] font-bold text-blue-400 mt-0.5">{t.dashboard.coinsEarned}</p>
                                </div>
                            </div>

                            {/* Stats List */}
                            <div className="w-full space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{t.dashboard.teamIncomeToday}</span>
                                    <span className="text-white font-black text-lg">0.00 <span className="text-xs text-gray-500">{t.dashboard.coinsLabel}</span></span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{t.dashboard.teamIncreasedToday}</span>
                                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm">+{teamIncreasedToday} {t.dashboard.memberLabel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{t.dashboard.teamTotalAssets}</span>
                                    <span className="text-white font-black text-lg">{teamTotalAssets.toLocaleString()} <span className="text-xs text-blue-400">ETB</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referral Invitation Card */}
                <div
                    onClick={() => router.push('/invite')}
                    className="relative group cursor-pointer active:scale-[0.98] transition-transform"
                >
                    <div className="absolute inset-0 bg-indigo-600/10 rounded-[2.5rem] blur-2xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-[#1b1b1b] to-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden flex items-center gap-6">
                        <div className="flex-1 space-y-4">
                            <h3 className="text-xl font-black text-white leading-tight">{t.dashboard.referFriendsRewards}</h3>
                            <div className="inline-flex px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all flex items-center gap-2">
                                {t.dashboard.invite}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                        </div>
                        <div className="w-24 h-24 relative shrink-0 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700">
                            {/* Using jewelry_icon as a replacement for the gift box to stay themed, 
                                but the user's screenshot had a gift box. I'll use a generic gift svg placeholder if I don't have a good image.
                                Actually I have dgs_app_icon or jewelry_icon. Let's use jewelry_icon for a premium feel. */}
                            <Image src="/jewelry_icon.png" alt="Rewards" width={96} height={96} className="drop-shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
                        </div>
                    </div>
                </div>

                {/* Content Switching: Summary vs Details */}
                {!loadingMembers && !showDetails ? (
                    /* Summary View (Existing) */
                    <div className="space-y-6 animate-fade-in">
                        {/* Team Registration */}
                        <div className="bg-[#111111]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-xl transition-all hover:border-white/20">
                            <div
                                onClick={() => setShowDetails(true)}
                                className="flex items-center justify-between mb-6 px-2 cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-tight">{t.dashboard.teamRegistration}</h3>
                                </div>
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {/* Total Column */}
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mb-2 shadow-lg border border-white/5">
                                        <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-black text-white leading-none">
                                        {(Object.values(teamStats).reduce((acc, curr) => acc + curr.count, 0) || 0)}
                                    </p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">{t.dashboard.totalLabel}</p>
                                </div>

                                {/* B, C, D, E Columns */}
                                {["B", "C", "D", "E"].map((level, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-2 shadow-lg border border-white/5">
                                            <span className="text-xl font-black text-gray-400">{level}</span>
                                        </div>
                                        <p className="text-sm font-black text-white leading-none">{(teamStats as any)[level]?.count || 0}</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1">{t.dashboard.personLabel}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="h-[1px] w-full bg-white/5 mt-6"></div>
                        </div>

                        {/* Team Assets */}
                        <div className="bg-[#111111]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-xl transition-all hover:border-white/20">
                            <div
                                onClick={() => setShowDetails(true)}
                                className="flex items-center justify-between mb-6 px-2 cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-tight">{t.dashboard.teamTotalAssets}</h3>
                                </div>
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2">
                                {/* Total Column */}
                                <div className="flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center mb-2 shadow-lg border border-white/5">
                                        <span className="text-xl font-black text-white">ETB</span>
                                    </div>
                                    <p className="text-sm font-black text-white leading-none">
                                        {(Object.values(teamStats).reduce((acc, curr) => acc + curr.assets, 0)).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1 text-center">{t.dashboard.totalLabel}</p>
                                </div>

                                {/* B, C, D, E Columns */}
                                {["B", "C", "D", "E"].map((level, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-2 shadow-lg border border-white/5">
                                            <span className="text-xl font-black text-gray-400">{level}</span>
                                        </div>
                                        <p className="text-sm font-black text-white leading-none">{(teamStats as any)[level]?.assets.toLocaleString() || 0}</p>
                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter mt-1 text-center">{t.dashboard.assetLabel}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Detailed Tab View */
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Back Header */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <h3 className="text-lg font-black text-white">{t.dashboard.memberDetails}</h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center justify-between bg-[#111111]/80 backdrop-blur-md rounded-2xl p-1.5 border border-white/5">
                            {(["B", "C", "D", "E"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        flex-1 py-3 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden
                                        ${activeTab === tab
                                            ? 'text-white bg-blue-600 shadow-lg shadow-blue-600/20'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="min-h-[300px]">
                            {loadingMembers ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : activeTabMembers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-bold tracking-widest text-sm uppercase">{t.dashboard.noDataLabel}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeTabMembers.map((member) => (
                                        <div key={member.id} className="bg-[#161616] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-black text-white border border-white/10">
                                                    {member.email?.substring(0, 2).toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{member.phoneNumber || member.email || "Unknown"}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {t.dashboard.joinedLabel}: {member.createdAt?.toDate().toLocaleDateString() || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-emerald-400">
                                                    {member.balanceWallet?.toLocaleString() || 0} ETB
                                                </p>
                                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{t.dashboard.assetLabel}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Team Commission Rules Section */}
                <div className="pt-4">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#111111]/80 backdrop-blur-3xl border border-white/10 p-8 shadow-2xl">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600/10 to-transparent rounded-bl-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-600/10 to-transparent rounded-tr-full pointer-events-none"></div>

                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-white tracking-tight mb-6 flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                {t.dashboard.teamCommissionRules}
                            </h3>

                            <div className="space-y-6 text-sm text-gray-400 leading-relaxed font-medium">
                                <p>
                                    {t.dashboard.teamCommissionDesc}
                                </p>

                                <div className="space-y-4">
                                    {[
                                        { level: "B", rate: "10%", desc: t.dashboard.teamCommissionB },
                                        { level: "C", rate: "5%", desc: t.dashboard.teamCommissionC },
                                        { level: "D", rate: "3%", desc: t.dashboard.teamCommissionD },
                                        { level: "E", rate: "2%", desc: t.dashboard.teamCommissionE },

                                    ].map((rule, idx) => (
                                        <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                                                <span className="text-lg font-black text-white">{rule.level}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-emerald-400 font-black text-lg">{rule.rate}</span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{t.dashboard.commissionLabel}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">{rule.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-amber-200/80">
                                        <span className="block font-bold text-amber-400 mb-1 uppercase tracking-wider text-[10px]">{t.dashboard.importantNote}</span>
                                        {t.dashboard.teamNoteDesc}
                                    </p>
                                </div>

                                {/* Monthly Salary Rules Section */}
                                <div className="pt-8 border-t border-white/10 mt-8">
                                    <h3 className="text-xl font-black text-white tracking-tight mb-6 flex items-center gap-3">
                                        <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </span>
                                        {t.dashboard.monthlySalaryRules}
                                    </h3>

                                    <div className="space-y-4">
                                        {[
                                            { v: "V1", size: 15, assets: "70,000", salary: "1,500", income: "72,000" },
                                            { v: "V2", size: 40, assets: "300,000", salary: "4,000", income: "192,000" },
                                            { v: "V3", size: 80, assets: "800,000", salary: "15,000", income: "720,000" },
                                            { v: "V4", size: 150, assets: "1,500,000", salary: "30,000", income: "1,440,000" },
                                            { v: "V5", size: 270, assets: "3,500,000", salary: "70,000", income: "3,360,000" },
                                            { v: "V6", size: 400, assets: "8,000,000", salary: "350,000", income: "16,800,000" },
                                            { v: "V7", size: 800, assets: "20,000,000", salary: "1,500,000", income: "72,000,000" },
                                        ].map((item, idx) => (
                                            <div key={idx} className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 p-5">
                                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                <div className="relative flex items-center justify-between gap-4">
                                                    {/* Badge */}
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#0a0a0a] border border-white/10 shadow-inner shrink-0">
                                                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-500">
                                                            {item.v}
                                                        </span>
                                                    </div>

                                                    {/* Details Grid */}
                                                    <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t.dashboard.teamSize}</p>
                                                            <p className="text-sm font-bold text-white">{item.size} {t.dashboard.peoplesLabel}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t.dashboard.assetLabel}</p>
                                                            <p className="text-sm font-bold text-white">{item.assets} Br</p>
                                                        </div>
                                                        <div className="col-span-2 h-[1px] bg-white/5 my-0.5"></div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t.dashboard.monthlySalaryLabel}</p>
                                                            <p className="text-sm font-black text-emerald-400">{item.salary} Br</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t.dashboard.fourYearIncomeLabel}</p>
                                                            <p className="text-sm font-black text-blue-400">{item.income} Br</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                                            <p className="text-xs text-amber-200/90 leading-relaxed relative z-10 font-medium">
                                                {t.dashboard.v7ApplyDesc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>

            <BottomNav />
        </div>
    );
}
