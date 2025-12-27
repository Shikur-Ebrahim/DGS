"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";

export default function ProductPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("DGS");

    useEffect(() => {
        const q = query(collection(db, "Products"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const productsData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...(doc.data() as any)
            }));
            setProducts(productsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const tabs = ["DGS", "VIP", "Limited"];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                    <p className="text-gray-500 font-bold animate-pulse">{t.dashboard.syncingProducts}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Sticky Header Nav */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/welcome')}
                        className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all transform active:scale-90 border border-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase italic">{t.dashboard.market}</h2>
                </div>
                <button
                    onClick={() => router.push('/recharge')}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px] transform active:scale-90 transition-all border-0 focus:outline-none"
                >
                    <div className="w-full h-full rounded-[15px] bg-[#0a0a0a] flex items-center justify-center hover:bg-white/5 transition-colors">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0m-4 8l2-2m0 0l2 2m-2-2v4m-3.333-4.857A3 3 0 0115 15.143M3 13.5h.01M3 16h.01m3 1h.01M6 13h.01m3 2h.01m0-3h.01" />
                        </svg>
                    </div>
                </button>
            </div>

            <div className="relative z-10 p-5 space-y-8 animate-fade-in">
                {/* My Products Dashboard Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative bg-[#111111]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                        <div className="flex items-start justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342l4-2a1 1 0 01.553-.894V11a1 1 0 01-1.447.894l-4-2A1 1 0 014 9V8.236a1 1 0 01.447-.894z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black text-white/90 tracking-wide">{t.dashboard.myAssets}</h3>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t.dashboard.totalHolding}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">0</span>
                                        <span className="text-gray-500 font-bold">{t.dashboard.pieces}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm tracking-widest hover:bg-white/10 transition-all uppercase">
                                History
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories Tab */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3 rounded-2xl text-sm font-black tracking-widest transition-all whitespace-nowrap border ${activeTab === tab
                                ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-400/50 shadow-[0_10px_20px_rgba(59,130,246,0.2)] scale-105"
                                : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Products List */}
                <div className="grid grid-cols-1 gap-6 pb-12">
                    {products.filter(p => {
                        const cat = p.category || "DGS"; // Default to DGS if missing
                        return cat === activeTab;
                    }).length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 border-dashed border-2">
                                <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 4-8-4" />
                                </svg>
                            </div>
                            <p className="font-bold tracking-widest uppercase text-xs">{t.dashboard.noProducts}</p>
                        </div>
                    ) : (
                        products.filter(p => {
                            const cat = p.category || "DGS";
                            return cat === activeTab;
                        }).map((product) => (
                            <div key={product.id} className="relative group perspective">
                                <div className="absolute inset-0 bg-blue-600/5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                <div className="relative bg-[#141414]/90 backdrop-blur-xl border border-white/5 rounded-[2rem] p-5 hover:border-blue-500/30 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl">
                                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg backdrop-blur-md">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Premium</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-5">
                                        {/* Product Image Section */}
                                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10 group-hover:border-blue-500/30 transition-colors">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold text-xs uppercase">No Image</div>
                                            )}
                                        </div>

                                        {/* Product Info Section */}
                                        <div className="flex-1 flex flex-col justify-center py-1">
                                            <h3 className="text-xl font-black text-white/90 truncate uppercase tracking-tight mb-3">{product.name}</h3>

                                            <div className="grid grid-cols-1 gap-3 text-[10px] font-black uppercase tracking-widest">
                                                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                                    <p className="text-gray-500">{t.dashboard.price}</p>
                                                    <p className="text-white text-sm">{product.price.toLocaleString()} ETB</p>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                                    <p className="text-gray-500">{t.dashboard.dailyIncome}</p>
                                                    <p className="text-green-400 text-sm">{product.dailyIncome.toLocaleString()} ETB</p>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                                    <p className="text-gray-500">{t.dashboard.contractPeriod}</p>
                                                    <p className="text-blue-400 text-sm">{product.contractPeriod} {t.dashboard.days}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="mt-6">
                                        <button
                                            onClick={() => router.push(`/product/${product.id}`)}
                                            className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 hover:from-blue-500 hover:to-purple-700 text-white font-black text-sm rounded-2xl shadow-[0_10px_20px_rgba(59,130,246,0.3)] transform active:scale-95 transition-all uppercase tracking-widest border border-white/20"
                                        >
                                            {t.dashboard.buyPlan}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
