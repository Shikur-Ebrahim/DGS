"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState("/1.jpg");
    const [uploadedWithdrawalImage, setUploadedWithdrawalImage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // New Product Notification State
    const [notificationType, setNotificationType] = useState<'withdrawal' | 'product'>('withdrawal');
    const [productName, setProductName] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [dailyIncome, setDailyIncome] = useState("");
    const [selectedProductImage, setSelectedProductImage] = useState("/jewelry_icon.png");
    const [uploadedImageUrl, setUploadedImageUrl] = useState("");

    const avatars = [
        "/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg",
        "/6.jpg", "/7.jpg", "/8.jpg", "/9.jpg", "/10.jpg"
    ];

    const productImages = [
        "/jewelry_icon.png", "/wallet 2.jpg", "/invite.jpg", "/withdraw.jpg"
    ];

    // Fetch notifications
    useEffect(() => {
        const q = query(collection(db, "Notifications"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            setNotifications(snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "Notifications"), {
                type: notificationType,
                userId: userId || `*${Math.floor(1000 + Math.random() * 9000)}`, // Default random ID if empty
                amount: amount,
                productName: productName,
                productPrice: productPrice,
                dailyIncome: dailyIncome,
                img: notificationType === 'withdrawal' ? selectedAvatar : selectedProductImage,
                createdAt: serverTimestamp()
            });
            // Reset Form
            setUserId("");
            setAmount("");
            setProductName("");
            setProductPrice("");
            setDailyIncome("");
            setUploadedWithdrawalImage("");
            setUploadedImageUrl("");

            // Show success toast
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            console.error("Error adding notification: ", error);
            alert("Failed to add notification");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this notification?")) {
            try {
                await deleteDoc(doc(db, "Notifications", id));
            } catch (error) {
                console.error("Error deleting notification:", error);
                alert("Failed to delete notification");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <AdminSidebar />

            <div className="lg:pl-80 pt-20 lg:pt-6 p-6 transition-all duration-300">
                {/* Success Toast */}
                {showSuccessToast && (
                    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm">Success!</p>
                                <p className="text-xs text-emerald-100">Notification added to live feed</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Manage Notifications (Withdrawal Feed)</h1>

                    {/* Notification Type Toggles */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => setNotificationType('withdrawal')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${notificationType === 'withdrawal'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            New Withdrawal
                        </button>
                        <button
                            onClick={() => setNotificationType('product')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${notificationType === 'product'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            New Product Purchase
                        </button>
                    </div>

                    {/* Add Notification Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">
                            {notificationType === 'withdrawal' ? 'Add Withdrawal Alert' : 'Add Product Purchase Alert'}
                        </h2>

                        <form onSubmit={handleAddNotification} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID (e.g. *8829)</label>
                                    <input
                                        type="text"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        placeholder="*1234 (Optional)"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                    />
                                </div>

                                {notificationType === 'withdrawal' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount (ETB)</label>
                                        <input
                                            type="text"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="10,000.00"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                                            <input
                                                type="text"
                                                value={productName}
                                                onChange={(e) => setProductName(e.target.value)}
                                                placeholder="Gold Bracelet"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                                            <input
                                                type="text"
                                                value={productPrice}
                                                onChange={(e) => setProductPrice(e.target.value)}
                                                placeholder="5000"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Daily Income</label>
                                            <input
                                                type="text"
                                                value={dailyIncome}
                                                onChange={(e) => setDailyIncome(e.target.value)}
                                                placeholder="200"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {notificationType === 'withdrawal' ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Avatar</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
                                        {avatars.map((img) => (
                                            <button
                                                key={img}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAvatar(img);
                                                    setUploadedWithdrawalImage("");
                                                }}
                                                className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 ${selectedAvatar === img && !uploadedWithdrawalImage ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-200 hover:border-blue-300'}`}
                                            >
                                                <Image src={img} alt="Avatar" fill className="object-cover" />
                                            </button>
                                        ))}

                                        {/* Custom Upload for Withdrawal */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const base64 = reader.result as string;
                                                            setUploadedWithdrawalImage(base64);
                                                            setSelectedAvatar(base64);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="withdrawalImageUpload"
                                            />
                                            <label
                                                htmlFor="withdrawalImageUpload"
                                                className={`w-12 h-12 rounded-full border-2 border-dashed transition-all shrink-0 flex items-center justify-center cursor-pointer ${uploadedWithdrawalImage ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}
                                            >
                                                {uploadedWithdrawalImage ? (
                                                    <div className="relative w-full h-full rounded-full overflow-hidden">
                                                        <img src={uploadedWithdrawalImage} alt="Uploaded" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Click + to upload custom avatar</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Product Icon</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center">
                                        {productImages.map((img) => (
                                            <button
                                                key={img}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProductImage(img);
                                                    setUploadedImageUrl("");
                                                }}
                                                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedProductImage === img && !uploadedImageUrl ? 'border-emerald-500 scale-110 shadow-lg' : 'border-gray-200 hover:border-emerald-300'}`}
                                            >
                                                <Image src={img} alt="Product" fill className="object-cover" />
                                            </button>
                                        ))}

                                        {/* Custom Upload Option */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const base64 = reader.result as string;
                                                            setUploadedImageUrl(base64);
                                                            setSelectedProductImage(base64);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="productImageUpload"
                                            />
                                            <label
                                                htmlFor="productImageUpload"
                                                className={`w-12 h-12 rounded-xl border-2 border-dashed transition-all shrink-0 flex items-center justify-center cursor-pointer ${uploadedImageUrl ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'}`}
                                            >
                                                {uploadedImageUrl ? (
                                                    <div className="relative w-full h-full">
                                                        <Image src={uploadedImageUrl} alt="Uploaded" fill className="object-cover rounded-lg" />
                                                    </div>
                                                ) : (
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Click + to upload custom image</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${notificationType === 'withdrawal' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-emerald-600 shadow-emerald-600/20'
                                    }`}
                            >
                                {isSubmitting ? (notificationType === 'withdrawal' ? "Broadcasting..." : "Broadcasting...") : (notificationType === 'withdrawal' ? 'Broadcast Withdrawal Alert' : 'Broadcast Product Purchase Alert')}
                            </button>
                        </form>
                    </div>

                    {/* Notifications List */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Current Live Feed
                        </h2>

                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No notifications active. Add one to start the feed.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                                                {item.img?.startsWith('data:') ? (
                                                    <img src={item.img} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Image src={item.img || '/1.jpg'} alt="Avatar" fill className="object-cover" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900">User {item.userId}</p>
                                                {item.type === 'product' ? (
                                                    <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-100">
                                                        Bought {item.productName} ({item.productPrice})
                                                    </p>
                                                ) : (
                                                    <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block border border-blue-100">
                                                        Withdrew {item.amount} ETB
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
