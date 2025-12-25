"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, addDoc } from "firebase/firestore";

// Common Ethiopian Banks for Dropdown
const COMMON_BANKS = [
    "Commercial Bank of Ethiopia (CBE)",
    "Awash Bank",
    "Dashen Bank",
    "Bank of Abyssinia",
    "United Bank (Hibret Bank)",
    "Nib International Bank",
    "Wegagen Bank",
    "Oromia International Bank",
    "Cooperative Bank of Oromia",
    "Zemen Bank",
    "Lion International Bank",
    "Berhan Bank",
    "Bunna International Bank",
    "Abay Bank",
    "Addis International Bank",
    "Enat Bank",
    "Debub Global Bank",
    "Telebirr",
    "CBE Birr",
    "Other"
];

// Cloudinary Config
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "djpf3qevd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOVA-PROJECT";

export default function AddWithdrawalBankPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [selectedBank, setSelectedBank] = useState(COMMON_BANKS[0]);
    const [customBankName, setCustomBankName] = useState("");
    const [bankLogoFile, setBankLogoFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBankLogoFile(file);
            setImagePreview(URL.createObjectURL(file));
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
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return data.secure_url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bankLogoFile) {
            showNotification("Please upload a bank logo", "error");
            return;
        }

        setIsLoading(true);

        try {
            const name = selectedBank === "Other" ? customBankName : selectedBank;
            if (!name) throw new Error("Please specify bank name");

            const imageUrl = await uploadToCloudinary(bankLogoFile);

            await addDoc(collection(db, "WithdrawalBanks"), {
                name,
                logoUrl: imageUrl,
                createdAt: new Date().toISOString()
            });

            showNotification("Withdrawal bank registered successfully!", "success");
            setTimeout(() => router.push("/admin/withdrawal-banks"), 1500);
        } catch (error: any) {
            showNotification(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[1000] min-w-[320px] p-1 rounded-2xl shadow-2xl animate-slide-in backdrop-blur-xl border border-white/20 ${notification.type === 'success' ? 'bg-emerald-500/90' : 'bg-rose-500/90'} text-white`}>
                    <div className="flex items-center gap-4 px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold font-black">
                            {notification.type === 'success' ? "✓" : "!"}
                        </div>
                        <p className="font-bold">{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => router.push('/admin/withdrawal-banks')} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Register Withdrawal Bank</h1>
                        <p className="text-gray-500 font-medium">Add a new withdrawal option for users</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Form Side */}
                    <div className="space-y-6">
                        <form onSubmit={handleSubmit} className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Target Bank</label>
                                <select
                                    value={selectedBank}
                                    onChange={(e) => setSelectedBank(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500/40 outline-none transition-all appearance-none"
                                >
                                    {COMMON_BANKS.map((b: string) => <option key={b} value={b} className="bg-gray-900">{b}</option>)}
                                </select>
                            </div>

                            {selectedBank === "Other" && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Specify Bank Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={customBankName}
                                        onChange={(e) => setCustomBankName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500/40 outline-none"
                                        placeholder="e.g. Dashen Bank"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 pl-1">Bank Official Logo</label>
                                <div className="relative group aspect-square rounded-3xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500/30 transition-all">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-6 transition-transform group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">Change Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-gray-500 group-hover:text-blue-400 transition-colors">
                                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload PNG/JPG Logo</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-16 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                                ) : (
                                    <>
                                        <span>Confirm Registration</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Info Side */}
                    <div className="hidden md:block space-y-6">
                        <div className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 space-y-4">
                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Requirements</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">✓</div>
                                    <p className="text-sm text-gray-500 leading-relaxed font-bold">Logos should be in high resolution (recommended 512x512) and preferrably with a transparent background.</p>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">✓</div>
                                    <p className="text-sm text-gray-500 leading-relaxed font-bold">Double-check the bank name spelling as it will be shown exactly as entered to the users.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
