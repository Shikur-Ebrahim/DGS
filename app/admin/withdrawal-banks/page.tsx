"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

// Common Ethiopian Banks for Dropdown (for editing)
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

export default function WithdrawalBanksManagementPage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [banks, setBanks] = useState<any[]>([]);

    // Edit Modal State
    const [editingBank, setEditingBank] = useState<any | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editSelectedBank, setEditSelectedBank] = useState("");
    const [editCustomName, setEditCustomName] = useState("");

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

        const q = query(collection(db, "WithdrawalBanks"), orderBy("createdAt", "desc"));
        const unsubscribeBanks = onSnapshot(q, (snapshot: any) => {
            setBanks(snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as any) })));
            setIsLoading(false);
        }, (error: any) => {
            console.error("Error fetching banks:", error);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
            unsubscribeBanks();
        };
    }, [router]);

    const handleEditClick = (bank: any) => {
        setEditingBank(bank);
        if (COMMON_BANKS.includes(bank.name)) {
            setEditSelectedBank(bank.name);
            setEditCustomName("");
        } else {
            setEditSelectedBank("Other");
            setEditCustomName(bank.name);
        }
        setEditImagePreview(bank.logoUrl);
        setEditImageFile(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImageFile(file);
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
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return data.secure_url;
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBank) return;

        setIsUpdating(true);
        try {
            const finalName = editSelectedBank === "Other" ? editCustomName : editSelectedBank;
            if (!finalName) throw new Error("Invalid bank name");

            let logoUrl = editingBank.logoUrl;
            if (editImageFile) {
                logoUrl = await uploadToCloudinary(editImageFile);
            }

            await updateDoc(doc(db, "WithdrawalBanks", editingBank.id), {
                name: finalName,
                logoUrl,
                updatedAt: new Date().toISOString()
            });

            showNotification("Bank updated successfully", "success");
            setEditingBank(null);
        } catch (error: any) {
            showNotification(error.message, "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this withdrawal bank?")) return;
        try {
            await deleteDoc(doc(db, "WithdrawalBanks", id));
            showNotification("Deleted successfully", "success");
        } catch (error: any) {
            showNotification(error.message, "error");
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

            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin/welcome')} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Withdrawal Banks</h1>
                            <p className="text-gray-500 font-medium">Manage available payout methods</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/admin/withdrawal-banks/add')} className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                        Register New Bank
                    </button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i: number) => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse"></div>)}
                    </div>
                ) : banks.length === 0 ? (
                    <div className="text-center py-24 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <p className="text-gray-500 font-black text-lg">No banks registered</p>
                        <button onClick={() => router.push('/admin/withdrawal-banks/add')} className="text-blue-500 font-black uppercase tracking-widest text-xs hover:underline">Click here to register your first bank</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {banks.map((bank: any) => (
                            <div key={bank.id} className="group bg-[#141414] border border-white/5 rounded-[2.5rem] p-6 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-white p-3 flex items-center justify-center mb-5 shadow-2xl overflow-hidden relative border border-white/10">
                                        <img src={bank.logoUrl} alt={bank.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <h3 className="font-black text-lg mb-1">{bank.name}</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Active Payout Method</p>

                                    <div className="flex w-full gap-2">
                                        <button onClick={() => handleEditClick(bank)} className="flex-1 py-3.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Edit</button>
                                        <button onClick={() => handleDelete(bank.id)} className="flex-1 py-3.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingBank && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#141414] w-full max-w-xl rounded-[3.5rem] p-8 border border-white/10 shadow-3xl animate-slide-up">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Modify Bank</h2>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Update bank credentials</p>
                            </div>
                            <button onClick={() => setEditingBank(null)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all shadow-inner">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="grid gap-8">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Display Name</label>
                                <select
                                    value={editSelectedBank}
                                    onChange={(e) => setEditSelectedBank(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/40"
                                >
                                    {COMMON_BANKS.map((b: string) => <option key={b} value={b} className="bg-gray-900">{b}</option>)}
                                </select>
                            </div>

                            {editSelectedBank === "Other" && (
                                <div className="animate-fade-in">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Custom Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editCustomName}
                                        onChange={(e) => setEditCustomName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Update Logo (Optional)</label>
                                <div className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center cursor-pointer group hover:border-blue-500/30">
                                    <img src={editImagePreview || ""} alt="Edit Preview" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </div>
                                    <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                </div>
                            </div>

                            <button type="submit" disabled={isUpdating} className="w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isUpdating ? (
                                    <div className="animate-spin h-6 w-6 border-4 border-white/30 border-t-white rounded-full"></div>
                                ) : "Commit Changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
