"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useLanguage } from "@/lib/LanguageContext";

export default function ExchangePage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<any | null>(null);
    const [exchangeAmount, setExchangeAmount] = useState<number | "">("");
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({ message: '', type: 'success', show: false });

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

    const showToast = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type, show: true });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    const handleExchange = async () => {
        if (!userData || !exchangeAmount) return;

        const amount = Number(exchangeAmount);
        if (amount <= 0 || amount > (userData.inviteWallet || 0)) {
            showToast(t.dashboard.invalidAmountError, 'error');
            return;
        }

        setIsLoading(true);
        try {
            // Calculate 95% of the exchange amount
            const transferAmount = amount * 0.95;

            const newInviteBalance = (userData.inviteWallet || 0) - amount;
            const newMainBalance = (userData.balanceWallet || 0) + transferAmount;

            // Reference to the user's document
            const userRef = doc(db, "Customers", userData.uid);

            // Atomic update
            await updateDoc(userRef, {
                balanceWallet: newMainBalance,
                inviteWallet: newInviteBalance
            });

            setShowConfirmation(false);
            setExchangeAmount("");
            showToast(`${t.dashboard.exchangeSuccessMessage} ${amount} ${t.dashboard.coinsLabel || "Coins"}`, 'success');

            // Delay redirection slightly so user can see success message
            setTimeout(() => {
                router.push('/welcome');
            }, 2000);
        } catch (error) {
            console.error("Exchange failed", error);
            showToast(t.dashboard.exchangeFailedError, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Notification Toast */}
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${notification.show ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'}`}>
                <div className={`px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-wider">{notification.type === 'success' ? t.dashboard.successTitle : t.dashboard.errorTitle}</h4>
                        <p className="text-xs font-bold opacity-80">{notification.message}</p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/wallet')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-wide">{t.dashboard.exchangeTitle}</h2>
            </div>

            <div className="p-6 space-y-8 max-w-lg mx-auto pt-10">
                {/* Source: Invite Income (Coins) */}
                <div className="p-8 rounded-[2.5rem] bg-[#131313] border border-white/5 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-fullblur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">{t.dashboard.availableCoinsLabel}</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="text-5xl font-black text-white tracking-tighter">
                                {userData?.inviteWallet?.toFixed(0) || "0"}
                            </h3>
                            <span className="text-purple-400 font-bold text-sm uppercase tracking-wider mt-1 block">{t.dashboard.coinsFromInvites}</span>
                        </div>
                        <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 mb-2">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Input Field */}
                <div className="relative">
                    <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 pl-2">{t.dashboard.amountToExchangeLabel}</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={exchangeAmount}
                            onChange={(e) => setExchangeAmount(Number(e.target.value))}
                            placeholder={t.dashboard.enterAmountPlaceholder}
                            className="w-full bg-[#131313] border border-white/10 rounded-2xl py-5 pl-6 pr-20 text-white font-bold text-xl focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-700"
                        />
                        <button
                            onClick={() => setExchangeAmount(userData?.inviteWallet || 0)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                            {t.dashboard.maxBtn}
                        </button>
                    </div>
                    {/* Preview Calculation */}
                    {exchangeAmount && Number(exchangeAmount) > 0 && (
                        <div className="mt-3 pl-2 flex items-center gap-2 text-sm text-gray-400">
                            <span>{t.dashboard.youGetLabel}</span>
                            <span className="text-green-400 font-bold">{(Number(exchangeAmount) * 0.95).toFixed(2)} ETB</span>
                            <span className="text-xs text-gray-600">{t.dashboard.rateLabel}</span>
                        </div>
                    )}
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center py-2">
                    <div className="p-3 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-bounce relative z-10">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                </div>

                {/* Destination: Main Wallet */}
                <div className="p-8 rounded-[2.5rem] bg-[#131313] border border-white/5 relative overflow-hidden">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">{t.dashboard.currentMainBalanceLabel}</p>
                    <div className="flex justify-between items-center">
                        <h3 className="text-4xl font-black text-white">{userData?.balanceWallet?.toFixed(2) || "0.00"} ETB</h3>
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Exchange Button */}
                <button
                    onClick={() => setShowConfirmation(true)}
                    disabled={!exchangeAmount || Number(exchangeAmount) <= 0 || Number(exchangeAmount) > (userData?.inviteWallet || 0)}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                >
                    {t.dashboard.reviewExchangeBtn}
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-[#1a1a1a] rounded-[2rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>

                        <h3 className="text-2xl font-black text-white mb-2 text-center">{t.dashboard.confirmExchangeTitle}</h3>
                        <p className="text-gray-400 text-center text-sm mb-8">{t.dashboard.proceedConfirmation}</p>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                                <span className="text-gray-400 text-sm">{t.dashboard.exchangeAmountLabel}</span>
                                <span className="text-white font-bold">{exchangeAmount} {t.dashboard.coinsLabel || "Coins"}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                                <span className="text-gray-400 text-sm">{t.dashboard.youReceiveLabel}</span>
                                <span className="text-green-400 font-bold">{(Number(exchangeAmount) * 0.95).toFixed(2)} ETB</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
                            >
                                {t.dashboard.cancel}
                            </button>
                            <button
                                onClick={handleExchange}
                                disabled={isLoading}
                                className="py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-600/20"
                            >
                                {isLoading ? t.dashboard.processing : t.dashboard.confirmBtn}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
