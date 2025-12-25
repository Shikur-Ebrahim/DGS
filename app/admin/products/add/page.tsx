"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Cloudinary Config
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "djpf3qevd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOVA-PROJECT";



export default function AddProductPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        dailyIncome: "",
        contractPeriod: "",
        dailyRate: "",
        totalProfit: "",
        principalIncome: "",
        purchaseLimit: "",
        description: ""
    });

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

    // Automatic Calculations
    useEffect(() => {
        const price = parseFloat(formData.price) || 0;
        const dailyIncome = parseFloat(formData.dailyIncome) || 0;
        const contractPeriod = parseInt(formData.contractPeriod) || 0;

        if (price > 0 && dailyIncome > 0) {
            const dailyRate = ((dailyIncome / price) * 100).toFixed(2);
            const totalProfit = (dailyIncome * contractPeriod).toFixed(2);
            const principalIncome = (parseFloat(totalProfit) + price).toFixed(2);

            setFormData(prev => ({
                ...prev,
                dailyRate,
                totalProfit,
                principalIncome
            }));
        }
    }, [formData.price, formData.dailyIncome, formData.contractPeriod]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Revoke old URL if it exists
            if (imagePreview) URL.revokeObjectURL(imagePreview);

            setImage(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    // Cleanup preview URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Upload failed");
            }

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Cloudinary upload error:", error);
            throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showNotification("Please enter a product name", "error");
            return;
        }

        if (!image) {
            showNotification("Please upload a product image", "error");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Upload Image to Cloudinary
            const imageUrl = await uploadToCloudinary(image);

            // 2. Save to Firestore
            const productData = {
                name: formData.name,
                imageUrl,
                price: parseFloat(formData.price) || 0,
                dailyIncome: parseFloat(formData.dailyIncome) || 0,
                contractPeriod: parseInt(formData.contractPeriod) || 0,
                dailyRate: parseFloat(formData.dailyRate) || 0,
                totalProfit: parseFloat(formData.totalProfit) || 0,
                principalIncome: parseFloat(formData.principalIncome) || 0,
                purchaseLimit: parseInt(formData.purchaseLimit) || 0,
                description: formData.description,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "Products"), productData);

            showNotification("Product registered successfully!", "success");
            setTimeout(() => router.push("/admin/welcome"), 1500);
        } catch (error: any) {
            console.error("Error registering product:", error);
            showNotification(`Failed to register: ${error.message || 'Error'}`, "error");
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
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
            </div>

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

            <div className="relative z-10 max-w-4xl mx-auto">
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
                        <h1 className="text-3xl font-black tracking-tight">Product Registration</h1>
                        <p className="text-gray-500 font-medium">Add a new premium product to the list</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Upload Card */}
                    <div className="md:col-span-2 bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Product Image</label>
                        <div className="flex flex-col items-center">
                            {imagePreview ? (
                                <div className="relative w-full max-w-md aspect-video rounded-3xl overflow-hidden mb-4 group ring-1 ring-white/10 shadow-2xl bg-black/40">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setImage(null); setImagePreview(null); }}
                                        className="absolute top-4 right-4 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="w-full max-w-md aspect-video rounded-3xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer flex flex-col items-center justify-center group">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-bold">Click to upload image</p>
                                    <p className="text-xs text-gray-500 mt-2">Recommended: 16:9 Aspect Ratio</p>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Product Name (Full Width) */}
                    <div className="md:col-span-2">
                        <div className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Product Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold text-xl"
                                placeholder="e.g. VIP Investment Plan"
                            />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Product Price (ETB)</label>
                            <input
                                type="number"
                                required
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold text-lg"
                                placeholder="e.g. 7500"
                            />
                        </div>

                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Daily Income (ETB)</label>
                            <input
                                type="number"
                                required
                                value={formData.dailyIncome}
                                onChange={(e) => setFormData({ ...formData, dailyIncome: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold text-lg"
                                placeholder="e.g. 250"
                            />
                        </div>

                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Contract Period (Days)</label>
                            <input
                                type="number"
                                required
                                value={formData.contractPeriod}
                                onChange={(e) => setFormData({ ...formData, contractPeriod: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold text-lg"
                                placeholder="e.g. 30"
                            />
                        </div>

                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md">Auto</span>
                            </div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Daily Rate (%)</label>
                            <input
                                type="text"
                                readOnly
                                value={formData.dailyRate}
                                className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-blue-400 focus:outline-none transition-all font-bold text-lg cursor-not-allowed"
                                placeholder="Calculated..."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md">Auto</span>
                            </div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Total Profit (ETB)</label>
                            <input
                                type="text"
                                readOnly
                                value={formData.totalProfit}
                                className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-blue-400 focus:outline-none transition-all font-bold text-lg cursor-not-allowed"
                                placeholder="Calculated..."
                            />
                        </div>

                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3">
                                <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-md">Auto</span>
                            </div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Principal Income (ETB)</label>
                            <input
                                type="text"
                                readOnly
                                value={formData.principalIncome}
                                className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-blue-400 focus:outline-none transition-all font-bold text-lg cursor-not-allowed"
                                placeholder="Calculated..."
                            />
                        </div>

                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Purchase Quantity Limit</label>
                            <input
                                type="number"
                                required
                                value={formData.purchaseLimit}
                                onChange={(e) => setFormData({ ...formData, purchaseLimit: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-bold text-lg"
                                placeholder="e.g. 5"
                            />
                        </div>

                        <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 shadow-xl">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Product Description</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium h-[116px] resize-none"
                                placeholder="Enter product details..."
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-20 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-2xl rounded-[2rem] shadow-[0_20px_40px_rgba(59,130,246,0.3)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-4 group"
                        >
                            {isLoading ? (
                                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                            ) : (
                                <>
                                    <span>Register Product</span>
                                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
