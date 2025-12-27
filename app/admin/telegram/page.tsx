"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function TelegramSettingsPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [settings, setSettings] = useState({
        channelUser: "",
        channelDesc: "Join our official channel for updates",
        supportUser: "",
        supportDesc: "Direct help from our team"
    });

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    router.push("/welcome");
                } else {
                    setIsChecking(false);
                    // Fetch existing settings
                    fetchSettings();
                }
            } else {
                router.push("/admin");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "Settings", "telegram");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(docSnap.data() as any);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            showNotification("Failed to load settings", "error");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const docRef = doc(db, "Settings", "telegram");
            await setDoc(docRef, settings);
            showNotification("Telegram settings updated successfully!", "success");
        } catch (error) {
            console.error("Error saving settings:", error);
            showNotification("Failed to save settings", "error");
        } finally {
            setIsLoading(false);
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
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-20 lg:pl-80 transition-all duration-300">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${notification.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                    </div>
                    <p className="font-bold">{notification.message}</p>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12a.4.4 0 01.12.28c0 .08-.01.17-.03.26z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Telegram Configuration</h1>
                        <p className="text-gray-500 font-bold">Manage official support channels</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Channel Settings */}
                    <div className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                Telegram Channel
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Channel Link</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.channelUser}
                                            onChange={(e) => setSettings({ ...settings, channelUser: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold"
                                            placeholder="https://t.me/..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-blue-400 pl-4 font-bold">Users will be redirected to: {settings.channelUser || 'link'}</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Description</label>
                                    <input
                                        type="text"
                                        value={settings.channelDesc}
                                        onChange={(e) => setSettings({ ...settings, channelDesc: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold"
                                        placeholder="Join our official channel..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Team Settings */}
                    <div className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                                Support Team
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Support Link</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={settings.supportUser}
                                            onChange={(e) => setSettings({ ...settings, supportUser: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-bold"
                                            placeholder="https://t.me/..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-indigo-400 pl-4 font-bold">Users will be redirected to: {settings.supportUser || 'link'}</p>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Description</label>
                                    <input
                                        type="text"
                                        value={settings.supportDesc}
                                        onChange={(e) => setSettings({ ...settings, supportDesc: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-bold"
                                        placeholder="Direct help from our team..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xl rounded-[2rem] shadow-xl shadow-blue-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <>
                                    <span>Update Telegram Links</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
