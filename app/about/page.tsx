"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface AboutItem {
    id: string;
    title: string;
    description: string;
    image: string;
    order: number;
}

export default function AboutPage() {
    const router = useRouter();
    const [items, setItems] = useState<AboutItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAboutData();
    }, []);

    const fetchAboutData = async () => {
        try {
            const q = query(collection(db, "about"), orderBy("order", "asc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AboutItem[];
            setItems(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 pb-12 rounded-b-[3rem] shadow-2xl sticky top-0 z-10">
                <button onClick={() => router.back()} className="mb-4 text-white/90 hover:text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                {/* DGS Logo */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-4">
                        <Image src="/dgs_app_icon.png" alt="DGS Logo" width={80} height={80} className="rounded-full" />
                    </div>
                    <h1 className="text-5xl font-black mb-2 text-center">About DGS</h1>
                    <p className="text-blue-100 text-center text-lg">Luxury Jewelry & Excellence</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-white/80">Loading...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="px-5 mt-8">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border-2 border-white/20">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-white/80 text-lg">Content coming soon...</p>
                    </div>
                </div>
            ) : (
                <div className="px-5 mt-8 space-y-8">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={`bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl ${index % 2 === 0 ? 'animate-fade-in-left' : 'animate-fade-in-right'
                                }`}
                        >
                            {/* Image */}
                            <div className="relative h-64 md:h-80 overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h2 className="text-3xl font-black text-white drop-shadow-2xl">{item.title}</h2>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="p-6">
                                <p className="text-white/90 leading-relaxed text-lg">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Company Info Footer */}
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-8 text-gray-900 shadow-2xl">
                        <h3 className="text-3xl font-black mb-4 text-center">✨ DGS Luxury ✨</h3>
                        <p className="text-center text-lg font-bold leading-relaxed">
                            Your trusted partner in premium jewelry and luxury products.
                            Experience excellence, quality, and timeless elegance with every piece.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-4xl font-black">💎</p>
                                <p className="text-xs font-bold mt-1">Premium Quality</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-black">🏆</p>
                                <p className="text-xs font-bold mt-1">Trusted Brand</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-black">⭐</p>
                                <p className="text-xs font-bold mt-1">Excellence</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
