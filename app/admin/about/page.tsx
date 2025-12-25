"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";
import Image from "next/image";

interface AboutItem {
    id: string;
    title: string;
    description: string;
    image: string;
    order: number;
    createdAt: any;
}

export default function AdminAboutPage() {
    const [items, setItems] = useState<AboutItem[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
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
            await addDoc(collection(db, "about"), {
                title,
                description,
                image: imagePreview, // Base64 image
                order: items.length + 1,
                createdAt: new Date()
            });

            setTitle("");
            setDescription("");
            setImageFile(null);
            setImagePreview("");
            setShowForm(false);
            fetchItems();
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to add item");
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        try {
            await deleteDoc(doc(db, "about", id));
            fetchItems();
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
                            <h1 className="text-3xl font-bold">About Page Management</h1>
                            <p className="text-gray-600">Manage DGS company & jewelry showcase</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg">
                            + Add New Item
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-gray-200">
                            <h2 className="text-xl font-bold mb-4">Add New About Item</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., DGS Luxury Jewelry"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the company, products, or services..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Image</label>
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
                                            <img src={imagePreview} alt="Preview" className="w-full max-w-md rounded-xl border-2 border-gray-200" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                                        {saving ? "Saving..." : "Add Item"}
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
                    ) : items.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-gray-500">No about items added yet</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {items.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                                    <div className="relative h-64">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                                            <button onClick={() => deleteItem(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
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
