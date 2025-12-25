"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import Image from "next/image";

// Cloudinary Config
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "djpf3qevd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOVA-PROJECT";

export default function ProductManagementPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editImage, setEditImage] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Admin Auth Check
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

    // Fetch Products Real-time
    useEffect(() => {
        if (isChecking) return;

        const q = query(collection(db, "Products"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            const productList = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productList);
            setLoading(false);
        }, (error: any) => {
            console.error("Error fetching products:", error);
            showNotification("Failed to load products", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isChecking]);

    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "Products", productId));
            showNotification("Product deleted successfully", "success");
        } catch (error) {
            console.error("Error deleting product:", error);
            showNotification("Failed to delete product", "error");
        }
    };

    const handleEditClick = (product: any) => {
        setEditingProduct({ ...product });
        setEditImagePreview(product.imageUrl);
        setEditImage(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (editImagePreview && !editImagePreview.startsWith('http')) URL.revokeObjectURL(editImagePreview);
            setEditImage(file);
            setEditImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) throw new Error("Image upload failed");
        const data = await response.json();
        return data.secure_url;
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        setIsUpdating(true);
        try {
            let imageUrl = editingProduct.imageUrl;

            if (editImage) {
                imageUrl = await uploadToCloudinary(editImage);
            }

            const updatedData = {
                ...editingProduct,
                imageUrl,
                price: parseFloat(editingProduct.price) || 0,
                dailyIncome: parseFloat(editingProduct.dailyIncome) || 0,
                contractPeriod: parseInt(editingProduct.contractPeriod) || 0,
                purchaseLimit: parseInt(editingProduct.purchaseLimit) || 0,
                dailyRate: parseFloat(((parseFloat(editingProduct.dailyIncome) / parseFloat(editingProduct.price)) * 100).toFixed(2)) || 0,
                totalProfit: parseFloat((parseFloat(editingProduct.dailyIncome) * parseInt(editingProduct.contractPeriod)).toFixed(2)) || 0,
                principalIncome: parseFloat((parseFloat(editingProduct.dailyIncome) * parseInt(editingProduct.contractPeriod) + parseFloat(editingProduct.price)).toFixed(2)) || 0,
                updatedAt: new Date().toISOString()
            };

            const productRef = doc(db, "Products", editingProduct.id);
            const { id, ...dataToUpdate } = updatedData;
            await updateDoc(productRef, dataToUpdate);

            showNotification("Product updated successfully", "success");
            setEditingProduct(null);
        } catch (error) {
            console.error("Error updating product:", error);
            showNotification("Update failed", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isChecking) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-20">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[1000] min-w-[320px] p-1 rounded-2xl shadow-2xl animate-slide-in backdrop-blur-xl border border-white/20 ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} text-white`}>
                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {notification.type === 'success' ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <p className="text-[13px] font-bold">{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin/welcome')} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Product Management</h1>
                            <p className="text-gray-500 font-medium">Edit or delete existing investment plans</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/admin/products/add')} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                        Add New Product
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i: number) => <div key={i} className="h-64 bg-white/5 rounded-[2rem] animate-pulse"></div>)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <p className="text-gray-400 font-bold text-xl mb-4">No products found</p>
                        <button onClick={() => router.push('/admin/products/add')} className="text-blue-500 font-black hover:underline">Create your first product</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="group bg-[#141414] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl hover:border-blue-500/30 transition-all duration-500">
                                <div className="aspect-video relative overflow-hidden">
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button onClick={() => handleEditClick(product)} className="p-3 rounded-xl bg-blue-500 text-white shadow-xl hover:bg-blue-600 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="p-3 rounded-xl bg-red-500 text-white shadow-xl hover:bg-red-600 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-xl font-black mb-1 truncate">{product.name}</h3>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-2xl font-black text-blue-400">{product.price.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">ETB</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Daily Income</p>
                                            <p className="text-sm font-black">{product.dailyIncome} Br</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Period</p>
                                            <p className="text-sm font-black">{product.contractPeriod} Days</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#141414] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 border border-white/10 shadow-2xl animate-slide-up no-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black tracking-tight">Edit Product</h2>
                            <button onClick={() => setEditingProduct(null)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-full aspect-video rounded-3xl overflow-hidden relative group bg-black/40 ring-1 ring-white/10">
                                    <img src={editImagePreview || ""} alt="Edit Preview" className="w-full h-full object-cover" />
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <svg className="w-10 h-10 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        <span className="text-white font-bold text-sm">Change Image</span>
                                        <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Product Name</label>
                                    <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500/40" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Price (ETB)</label>
                                    <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Daily Income (ETB)</label>
                                    <input type="number" value={editingProduct.dailyIncome} onChange={e => setEditingProduct({ ...editingProduct, dailyIncome: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Period (Days)</label>
                                    <input type="number" value={editingProduct.contractPeriod} onChange={e => setEditingProduct({ ...editingProduct, contractPeriod: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Purchase Limit</label>
                                    <input type="number" value={editingProduct.purchaseLimit} onChange={e => setEditingProduct({ ...editingProduct, purchaseLimit: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest pl-2">Description</label>
                                    <textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white min-h-[100px] resize-none" />
                                </div>
                            </div>

                            <button type="submit" disabled={isUpdating} className="w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-lg rounded-2xl mt-4 flex items-center justify-center gap-3">
                                {isUpdating ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div> : "Update Product"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
