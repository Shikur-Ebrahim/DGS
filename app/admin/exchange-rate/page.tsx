"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminExchangeRatePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [transferRate, setTransferRate] = useState(95); // Default 95% (5% fee)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    router.push("/welcome");
                } else {
                    // Fetch current rate
                    const rateDoc = await getDoc(doc(db, "Settings", "exchangeRate"));
                    if (rateDoc.exists()) {
                        setTransferRate(rateDoc.data().rate || 95);
                    }
                    setIsLoading(false);
                }
            } else {
                router.push("/admin");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, "Settings", "exchangeRate"), {
                rate: transferRate,
                updatedAt: new Date().toISOString()
            });
            alert("Exchange rate updated successfully!");
        } catch (error) {
            console.error("Error saving exchange rate:", error);
            alert("Failed to save exchange rate");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center lg:pl-80">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:pl-80 relative">
            <AdminSidebar />
            <div className="max-w-xl mx-auto pt-10">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/admin/welcome')}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Exchange Rate</h1>
                        <p className="text-gray-500 font-medium">Manage user coin-to-wallet transfer rates</p>
                    </div>
                </div>

                <div className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>

                    <div className="space-y-8 relative z-10">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
                                Transfer Rate (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={transferRate}
                                    onChange={(e) => setTransferRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-full bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-5 text-4xl font-black text-white focus:outline-none focus:border-blue-500 transition-all text-center pr-16"
                                    min="0"
                                    max="100"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-600">%</span>
                            </div>
                            <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <p className="text-sm text-blue-400 font-bold flex justify-between">
                                    <span>Current Fee:</span>
                                    <span>{100 - transferRate}%</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    If you set 95%, users will receive 950 Br for every 1000 Stars exchanged (5% fee).
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:from-gray-800 disabled:to-gray-900 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isSaving ? (
                                <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <>
                                    <span>Save Settings</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0 text-yellow-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-1">Security Note</p>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                Changing the exchange rate affects all pending and future exchange requests instantly. Please ensure users are notified of significant changes to avoid confusion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
