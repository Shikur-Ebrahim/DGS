"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";

export default function ProductTrackerPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<number>(0);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    router.push("/welcome");
                } else {
                    setIsChecking(false);
                }
            } else {
                router.push("/admin");
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!isChecking) {
            const q = query(collection(db, "Products"), orderBy("createdAt", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot: any) => {
                const productsData = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(productsData);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [isChecking]);

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setEditValue(product.soldPercentage || 0);
    }

    const handleSave = async (productId: string) => {
        setUpdating(true);
        try {
            const productRef = doc(db, "Products", productId);
            await updateDoc(productRef, {
                soldPercentage: Number(editValue)
            });
            setEditingId(null);
        } catch (error) {
            console.error("Error updating product tracker:", error);
            alert("Failed to update.");
        } finally {
            setUpdating(false);
        }
    }

    if (isChecking || loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
            <h1 className="text-3xl font-black mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Product Sales Tracker
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                    <div key={product.id} className="bg-[#1a1a1a]/80 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">N/A</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{product.price.toLocaleString()} ETB</p>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold border ${product.soldPercentage >= 100 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {product.soldPercentage || 0}% Sold
                                </div>
                            </div>

                            {/* Progress Bar Visual */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                                    <span>Progress</span>
                                    <span>{product.soldPercentage || 0}%</span>
                                </div>
                                <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-500 ease-out"
                                        style={{ width: `${Math.min(product.soldPercentage || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/5">
                                {editingId === product.id ? (
                                    <div className="space-y-3 animate-fade-in">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-400">Set %:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editValue}
                                                onChange={(e) => setEditValue(Number(e.target.value))}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSave(product.id)}
                                                disabled={updating}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-50"
                                            >
                                                {updating ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                                    >
                                        <svg className="w-4 h-4 text-gray-500 group-hover/btn:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Update Percentage
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
