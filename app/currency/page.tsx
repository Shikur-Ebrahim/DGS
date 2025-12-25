"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";

export default function CurrencyPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<any | null>(null);

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

    const currencies = [
        { code: "ETB", name: "Ethiopian Birr", rate: 155, symbol: "ETB", flag: "/Ethiopia.png" },
        { code: "USD", name: "US Dollar", rate: 1, symbol: "$", flag: "/Flag_of_the_United_States.png" },
        { code: "EUR", name: "Euro", rate: 0.92, symbol: "€", flag: "/France.png" },
        { code: "GBP", name: "British Pound", rate: 0.79, symbol: "£", flag: "/United Kingdom.webp" },
        { code: "CNY", name: "Chinese Yuan", rate: 7.15, symbol: "¥", flag: "/China.png" },
        { code: "AUD", name: "Australian Dollar", rate: 1.52, symbol: "A$", flag: "/Australia.webp" },
        { code: "CAD", name: "Canadian Dollar", rate: 1.36, symbol: "C$", flag: "/Canada.png" },
        { code: "SAR", name: "Saudi Riyal", rate: 3.75, symbol: "﷼", flag: "/Saudi Arabia.png" },
        { code: "AED", name: "UAE Dirham", rate: 3.67, symbol: "dh", flag: "/United Arab Emirates.png" },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/wallet')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-wide">Currency Rates</h2>
            </div>

            <div className="p-6 space-y-4 max-w-lg mx-auto pt-6 relative z-10">
                {currencies.map((currency) => (
                    <div key={currency.code} className="p-4 rounded-2xl bg-[#131313]/80 backdrop-blur-md border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] duration-300 cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-9 rounded-lg overflow-hidden shadow-md ring-1 ring-white/10 group-hover:ring-blue-500/50 transition-all">
                                <Image
                                    src={currency.flag}
                                    alt={currency.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-white font-bold tracking-wide">{currency.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono text-gray-400 border border-white/5">{currency.code}</span>
                                    <p className="text-xs text-blue-400 font-medium">1 USD = {currency.rate} {currency.code}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Balance</p>
                            <p className="text-white font-black tracking-tight text-lg drop-shadow-md">
                                {currency.symbol} {((userData?.balanceWallet || 0) / 155 * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
