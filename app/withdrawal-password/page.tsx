"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function WithdrawalPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSetPassword, setHasSetPassword] = useState(false);

    // Form States
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const pwdRef = doc(db, "WithdrawalPasswords", user.uid);
                const pwdSnap = await getDoc(pwdRef);
                setHasSetPassword(pwdSnap.exists());
                setLoading(false);
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 4) {
            showNotification("Password must be at least 4 digits", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification("Passwords do not match", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error("Auth required");

            const pwdRef = doc(db, "WithdrawalPasswords", userId);
            let createdAt = serverTimestamp();

            if (hasSetPassword) {
                const pwdSnap = await getDoc(pwdRef);
                if (pwdSnap.data()?.password !== oldPassword) {
                    showNotification("Current withdrawal password is incorrect", "error");
                    setIsSubmitting(false);
                    return;
                }
                createdAt = pwdSnap.data()?.createdAt || serverTimestamp();
            }

            await setDoc(pwdRef, {
                password: newPassword,
                updatedAt: serverTimestamp(),
                createdAt: createdAt
            });

            showNotification("Withdrawal password updated! ✅", "success");
            setTimeout(() => router.push("/profile"), 2000);
        } catch (error: any) {
            showNotification("Failed to update password. Try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-gray-900">
            {/* Header */}
            <div className="bg-white px-4 py-5 flex items-center border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <button onClick={() => router.push('/profile')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="flex-1 text-center text-xl font-black text-gray-900 -ml-10">Security Password</h1>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] p-1 rounded-2xl shadow-2xl animate-fade-in backdrop-blur-xl border border-white/20 ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} text-white`}>
                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold font-black">
                            {notification.type === 'success' ? "✓" : "!"}
                        </div>
                        <p className="font-bold text-sm">{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="max-w-xl mx-auto p-6 space-y-8 pt-10">
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/20 mb-4">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Withdrawal Code</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Manage your secure transaction pin</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {hasSetPassword && (
                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">Current Code</label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full bg-white rounded-[2rem] p-5 font-bold border border-gray-100 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-300 tracking-[0.3em]"
                                placeholder="••••"
                                maxLength={8}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">New Secret Code</label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white rounded-[2rem] p-5 font-bold border border-gray-100 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-300 tracking-[0.3em]"
                            placeholder="••••"
                            maxLength={8}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-4">Confirm New Code</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-white rounded-[2rem] p-5 font-bold border border-gray-100 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-gray-300 tracking-[0.3em]"
                            placeholder="••••"
                            maxLength={8}
                        />
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin h-6 w-6 border-4 border-white/30 border-t-white rounded-full"></div>
                            ) : (
                                "Update Security Code"
                            )}
                        </button>
                    </div>
                </form>

                <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black italic">i</div>
                        <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight">Security Tip</h4>
                    </div>
                    <p className="text-xs font-bold text-indigo-600/70 leading-relaxed">
                        Your withdrawal code is required for every payout request. Keep it secret and avoid using obvious sequences like "1234" or your birth year.
                    </p>
                </div>
            </div>
        </div>
    );
}
