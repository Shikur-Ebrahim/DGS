"use client";

import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { countries } from "@/lib/countries";
import Image from "next/image";
import { syncUserIncome } from "@/lib/incomeService";
import { useLanguage } from "@/lib/LanguageContext";
import { languageNames, Language } from "@/lib/translations";

export default function WelcomePage() {
    const router = useRouter();


    const { language, setLanguage, t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const langDropdownRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0); // Start with jolery 1 (index 0)
    const [userData, setUserData] = useState<any | null>(null);
    const [hasPendingRecharge, setHasPendingRecharge] = useState(false);
    const [pendingAmount, setPendingAmount] = useState('');
    const sliderRef = useRef<HTMLDivElement>(null);
    const feedRef = useRef<HTMLDivElement>(null);



    const images = [
        { src: "/1.jpg", alt: "Image 1" },
        { src: "/2.jpg", alt: "Image 2" },
        { src: "/3.jpg", alt: "Image 3" },
        { src: "/4.jpg", alt: "Image 4" },
        { src: "/5.jpg", alt: "Image 5" },
        { src: "/6.jpg", alt: "Image 6" },
        { src: "/7.jpg", alt: "Image 7" },
        { src: "/8.jpg", alt: "Image 8" },
        { src: "/9.jpg", alt: "Image 9" },
        { src: "/10.jpg", alt: "Image 10" },
    ];

    // Live Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);

    // Platform Notification Popup State
    const [platformNotification, setPlatformNotification] = useState<any>(null);
    const [showPlatformPopup, setShowPlatformPopup] = useState(false);

    // Fetch Notifications
    useEffect(() => {
        const q = query(collection(db, "Notifications"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            setNotifications(snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })));
        });

        return () => unsubscribe();
    }, []);

    // Fetch Platform Notification
    useEffect(() => {
        const fetchPlatformNotification = async () => {
            try {
                // Fetch all and filter in memory to avoid composite index requirement
                const q = query(
                    collection(db, "platformNotifications"),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                const latestActive = snapshot.docs
                    .map((d: any) => ({ id: d.id, ...d.data() } as any))
                    .find((n: any) => n.isActive);

                if (latestActive) {
                    setPlatformNotification(latestActive);
                    setShowPlatformPopup(true);
                }
            } catch (error) {
                console.error("Error fetching platform notification:", error);
            }
        };
        fetchPlatformNotification();
    }, []);

    // Auto-scroll notification feed
    useEffect(() => {
        const scrollContainer = feedRef.current;
        if (!scrollContainer) return;

        let scrollInterval: NodeJS.Timeout;

        const startScrolling = () => {
            scrollInterval = setInterval(() => {
                if (scrollContainer) {
                    if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth) {
                        scrollContainer.scrollLeft = 0; // Reset to start
                    } else {
                        scrollContainer.scrollLeft += 1; // Move 1px
                    }
                }
            }, 30); // Speed: 30ms per pixel
        };

        startScrolling();

        return () => clearInterval(scrollInterval);
    }, [notifications.length]);

    // Live data listener with auth state awareness
    useEffect(() => {
        let unsubscribeDoc: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
            if (user) {
                unsubscribeDoc = onSnapshot(doc(db, "Customers", user.uid), (doc: any) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        setUserData({
                            ...data,
                            uid: data.uid || user.uid, // Fallback to auth UID if not in doc
                            phoneNumber: data.phoneNumber || ""
                        });
                        // Sync income on every data refresh/login
                        syncUserIncome(user.uid);
                    }
                });
            } else {
                if (unsubscribeDoc) unsubscribeDoc();
                setUserData(null);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    // Check for pending recharge requests
    useEffect(() => {
        const checkPendingRecharge = async () => {
            const user = auth.currentUser;
            if (user) {
                const q = query(
                    collection(db, "RechargeReview"),
                    where("userId", "==", user.uid),
                    where("status", "==", "pending")
                );

                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const pendingRequest = snapshot.docs[0].data();
                    setHasPendingRecharge(true);
                    setPendingAmount(pendingRequest.amount || '0');
                } else {
                    setHasPendingRecharge(false);
                    setPendingAmount('');
                }
            }
        };

        // Check immediately
        checkPendingRecharge();

        // Check every 5 seconds for updates
        const interval = setInterval(checkPendingRecharge, 5000);

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll effect
    useEffect(() => {


        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [images.length]);

    // Handle slide change
    useEffect(() => {
        if (sliderRef.current) {
            const slideWidth = sliderRef.current.offsetWidth;
            sliderRef.current.scrollTo({
                left: currentSlide * slideWidth,
                behavior: "smooth"
            });
        }
    }, [currentSlide]);



    // Unified Nav logic moved to BottomNav component

    const renderHeader = () => (
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/10 ring-1 ring-white/10">
                    <Image src="/dgs_app_icon.png" alt="Logo" fill className="object-cover scale-110" />
                </div>
            </div>

            {/* Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
                <button
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
                >
                    <span className="text-xl leading-none">{languageNames[language].flag}</span>
                    <span className="text-sm font-bold text-gray-300">{languageNames[language].name}</span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showLangDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[60] py-2 overflow-hidden animate-fade-in no-scrollbar">
                        <div className="max-h-64 overflow-y-auto no-scrollbar">
                            {(Object.keys(languageNames) as Language[]).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setLanguage(lang);
                                        setShowLangDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left ${language === lang ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400'}`}
                                >
                                    <span className="text-xl leading-none">{languageNames[lang].flag}</span>
                                    <span className="text-sm font-bold">{languageNames[lang].name}</span>
                                    {language === lang && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );

    const renderContent = () => (
        <div className="animate-fade-in -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 space-y-0 relative">
            {/* Persistent Sticky Header */}
            <div className="sticky top-0 z-50 w-full px-6 pt-6 pb-12 pointer-events-none bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="mt-2 pointer-events-auto">
                    {renderHeader()}
                </div>
            </div>

            {/* Sticky Hero Section */}
            <div className="sticky top-0 -mt-[88px] z-0 w-full h-[340px] bg-[#0a0a0a]">
                <div
                    ref={sliderRef}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                >
                    {images.map((img, idx) => (
                        <div key={idx} className="relative flex-none w-full h-full snap-center">
                            <Image
                                src={img.src}
                                alt={img.alt}
                                fill
                                className="object-cover"
                                priority={idx === 0}
                            />
                        </div>
                    ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none"></div>

                <div className="absolute bottom-12 left-8 pointer-events-none transition-all flex justify-between items-end w-[calc(100%-64px)]">
                    <div>
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-2xl uppercase">
                            {t.dashboard.premiumCollection}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="h-[2px] w-8 bg-blue-500"></div>
                            <p className="text-xs text-blue-300 font-bold tracking-[0.2em] uppercase drop-shadow-md">{t.dashboard.dgsLuxury}</p>
                        </div>
                        <div className="mt-2 pointer-events-auto">
                            <div className="w-8 h-8 rounded-full border border-blue-500/20 bg-blue-500/10 flex items-center justify-center backdrop-blur-md shadow-lg shadow-blue-500/10">
                                <svg className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="text-right pb-1">
                        <div className="flex flex-col items-end gap-0.5 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                            <p className="text-[10px] text-blue-400/90 font-black tracking-widest uppercase drop-shadow-md">{t.dashboard.currentBalance}</p>
                            <div className="flex items-baseline gap-1">
                                <h4 className="text-4xl font-black text-white leading-none tracking-tighter drop-shadow-[0_2px_12px_rgba(37,99,235,0.4)]">
                                    {userData?.balanceWallet !== undefined ? userData.balanceWallet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </h4>
                                <span className="text-4xl font-bold text-blue-300 leading-none">ETB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrolling Content Layer */}
            <div className="relative z-10 bg-[#0a0a0a] pb-24 rounded-t-[3rem] shadow-[0_-30px_60px_rgba(0,0,0,0.8)] -mt-12 overflow-hidden animate-slide-up-fade">
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-2 pointer-events-none"></div>

                {/* Notification Ticker - Moved Here */}
                <div className="px-5 pb-4 relative z-40">
                    <div className="w-full bg-white p-1.5 rounded-full shadow-lg flex items-center gap-3 relative overflow-hidden ring-4 ring-black/20">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 shadow-sm border border-blue-100 z-10">
                            <svg className="w-4 h-4 text-blue-600 animate-bell-swing" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div
                            ref={feedRef}
                            className="flex-1 overflow-x-hidden whitespace-nowrap relative mask-linear-fade"
                        >
                            <div className="inline-flex items-center gap-8 animate-marquee">
                                {notifications.length > 0 ? (
                                    [...notifications, ...notifications].map((user, idx) => (
                                        <span key={`${user.id}-${idx}`} className="text-xs font-bold text-gray-800 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 shrink-0 relative">
                                                <Image src={user.img} alt="User" fill className="object-cover" />
                                            </div>
                                            {user.type === 'product' ? (
                                                <span>User <span className="text-blue-600">{user.userId}</span> bought <span className="text-purple-600 font-black">{user.productName}</span> for <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{user.productPrice} ETB</span></span>
                                            ) : (
                                                <span>User <span className="text-blue-600">{user.userId}</span> just withdrew <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{user.amount} ETB</span></span>
                                            )}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs font-bold text-gray-400">{t.dashboard.waitingUpdates}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-5 pt-2 relative z-30">
                    <div className="p-4 rounded-3xl bg-[#1a1a1a] border border-white/5 shadow-xl">
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            {/* Recharge Action */}
                            <button
                                onClick={() => hasPendingRecharge ? router.push(`/recharge-review?amount=${pendingAmount}`) : router.push('/recharge')}
                                className="relative rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 relative overflow-hidden">
                                    <Image src="/wallet 2.jpg" alt="Recharge" fill className="object-cover opacity-40" />
                                    <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{t.dashboard.recharge}</span>
                            </button>

                            {/* Buy Product Action */}
                            <button
                                onClick={() => router.push('/product')}
                                className="relative rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 p-5 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 relative overflow-hidden">
                                    <Image src="/jewelry_icon.png" alt="Jewelry" fill className="object-cover opacity-70 p-2" />
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{t.dashboard.buyLux}</span>
                            </button>

                            {/* Invite Action */}
                            <button
                                onClick={() => router.push('/invite')}
                                className="relative rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 p-5 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 relative overflow-hidden">
                                    <Image src="/invite.jpg" alt="Invite" fill className="object-cover opacity-40" />
                                    <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{t.dashboard.invite}</span>
                            </button>

                            {/* Withdraw Action */}
                            <button
                                onClick={() => router.push('/withdrawal')}
                                className="relative rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 relative overflow-hidden">
                                    <Image src="/withdraw.jpg" alt="Withdraw" fill className="object-cover opacity-40" />
                                    <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{t.dashboard.withdraw}</span>
                            </button>
                        </div>

                        {/* Daily Task & About Cards */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {/* Daily Task Card */}
                            <button
                                onClick={() => router.push('/tasks')}
                                className="relative rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 p-5 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{t.dashboard.dailyTask}</span>
                            </button>

                            {/* About Card */}
                            <button
                                onClick={() => router.push('/about')}
                                className="relative rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-white uppercase tracking-wide">{t.dashboard.about}</span>
                            </button>
                        </div>

                        {/* Security Footer in Grid */}
                        <div className="mt-4 pt-6 border-t border-white/5 flex items-center justify-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{t.dashboard.securedBy}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );







    return (
        <div className={`min-h-screen bg-[#0a0a0a] text-white pb-28`}>
            {/* Platform Notification Popup */}
            {showPlatformPopup && platformNotification && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl overflow-hidden">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPlatformPopup(false)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all active:scale-90"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Header */}
                        <div className="bg-white/10 backdrop-blur-sm p-6 text-center border-b border-white/20">
                            <h2 className="text-3xl font-black text-white drop-shadow-lg">
                                {platformNotification.title}
                            </h2>
                        </div>

                        {/* Image */}
                        <div className="relative h-80 bg-white">
                            <img
                                src={platformNotification.image}
                                alt={platformNotification.title}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Description */}
                        <div className="p-6 bg-white/10 backdrop-blur-sm">
                            <p className="text-white text-center leading-relaxed text-lg">
                                {platformNotification.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]"></div>
            </div>

            <main className="relative z-10 max-w-2xl mx-auto">
                {renderContent()}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
