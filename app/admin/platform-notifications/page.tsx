"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";

interface PlatformNotification {
    id: string;
    title: string;
    description: string;
    image: string;
    isActive: boolean;
    createdAt: any;
}

export default function AdminPlatformNotificationPage() {
    const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const q = query(collection(db, "platformNotifications"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as PlatformNotification[];
            setNotifications(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imagePreview) {
            alert("Please select an image");
            return;
        }

        setSaving(true);
        try {
            await addDoc(collection(db, "platformNotifications"), {
                title,
                description,
                image: imagePreview,
                isActive: true,
                createdAt: new Date()
            });

            setTitle("");
            setDescription("");
            setImageFile(null);
            setImagePreview("");
            setShowForm(false);
            fetchNotifications();
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to add notification");
        } finally {
            setSaving(false);
        }
    };

    const deleteNotification = async (id: string) => {
        if (!confirm("Delete this notification?")) return;
        try {
            await deleteDoc(doc(db, "platformNotifications", id));
            fetchNotifications();
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />

            <div className="lg:pl-72 pt-20 lg:pt-6 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Platform Notifications</h1>
                            <p className="text-gray-600">Create popup notifications for new products & announcements</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg">
                            + New Notification
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-gray-200">
                            <h2 className="text-xl font-bold mb-4">Create Platform Notification</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notification Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., New Product Launch!"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the product or announcement..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Product Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    {imagePreview && (
                                        <div className="mt-4">
                                            <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                            <img src={imagePreview} alt="Preview" className="w-full max-w-md rounded-xl border-2 border-gray-200 shadow-lg" />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-sm font-bold text-blue-900 mb-2">📢 How it works:</p>
                                    <ul className="text-xs text-blue-800 space-y-1">
                                        <li>• Notification appears as popup on user's welcome page</li>
                                        <li>• Shows once per user session</li>
                                        <li>• Users can close it with X button</li>
                                        <li>• Perfect for new products, sales, or announcements</li>
                                    </ul>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                                        {saving ? "Creating..." : "Create Notification"}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                            <div className="text-6xl mb-4">📢</div>
                            <p className="text-gray-500">No platform notifications created yet</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {notifications.map((notification: any) => (
                                <div key={notification.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-blue-200">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black text-white">{notification.title}</h3>
                                            <button onClick={() => deleteNotification(notification.id)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative h-64">
                                        <img src={notification.image} alt={notification.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 leading-relaxed">{notification.description}</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${notification.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {notification.isActive ? '✓ Active' : '✕ Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
