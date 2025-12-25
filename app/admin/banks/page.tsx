"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import Image from "next/image";
import AdminSidebar from "@/components/AdminSidebar";

// List of Ethiopian Banks for Dropdown
const ETHIOPIAN_BANKS = [
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
    "Goh Betoch Bank",
    "Siinqee Bank",
    "Tsehay Bank",
    "Ahadu Bank",
    "Amhara Bank",
    "Telebirr", // Often treated as a bank for payments
    "CBE Birr"
];

// Cloudinary Config
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "djpf3qevd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOVA-PROJECT";

export default function AdminBanksPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [bankName, setBankName] = useState(ETHIOPIAN_BANKS[0]);
    const [accountHolderName, setAccountHolderName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankLogoFile, setBankLogoFile] = useState<File | null>(null);
    const [status, setStatus] = useState("Active"); // Active/Inactive

    // Edit Mode State
    const [editingBankId, setEditingBankId] = useState<string | null>(null);
    const [existingLogoUrl, setExistingLogoUrl] = useState("");

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const [banks, setBanks] = useState<any[]>([]);

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
                }
            } else {
                router.push("/admin");
            }
        });

        const q = query(collection(db, "Banks"), orderBy("createdAt", "desc"));
        const unsubscribeBanks = onSnapshot(q, (snapshot: any) => {
            const banksData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }));
            setBanks(banksData);
        });

        return () => {
            unsubscribe();
            unsubscribeBanks();
        };
    }, [router]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
    };

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

    const handleEdit = (bank: any) => {
        setEditingBankId(bank.id);
        setBankName(bank.bankName);
        setAccountHolderName(bank.accountHolderName);
        setAccountNumber(bank.accountNumber);
        setStatus(bank.status || "Active");
        setExistingLogoUrl(bank.bankLogo);
        setBankLogoFile(null); // Reset file input
        // Scroll to top to show form
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingBankId(null);
        setBankName(ETHIOPIAN_BANKS[0]);
        setAccountHolderName("");
        setAccountNumber("");
        setBankLogoFile(null);
        setStatus("Active");
        setExistingLogoUrl("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!bankName || !accountHolderName || !accountNumber) {
            showNotification("Please fill in all required fields.", "error");
            return;
        }
        // For new banks, logo is required. For editing, it's optional (keep existing).
        if (!editingBankId && !bankLogoFile) {
            showNotification("Please select a bank logo.", "error");
            return;
        }

        setIsLoading(true);
        try {
            let downloadURL = existingLogoUrl;

            // Upload new logo if selected
            if (bankLogoFile) {
                console.log("Uploading new logo to Cloudinary...", bankLogoFile.name);
                downloadURL = await uploadToCloudinary(bankLogoFile);
            }

            const bankData = {
                bankName,
                accountHolderName,
                accountNumber,
                bankLogo: downloadURL,
                status,
                updatedAt: new Date().toISOString()
            };

            if (editingBankId) {
                // Update existing bank
                console.log("Updating bank...", editingBankId);
                await updateDoc(doc(db, "Banks", editingBankId), bankData);
                showNotification("Bank updated successfully!", "success");
            } else {
                // Create new bank
                console.log("Creating new bank...");
                await addDoc(collection(db, "Banks"), {
                    ...bankData,
                    createdAt: new Date().toISOString()
                });
                showNotification("Bank added successfully!", "success");
            }

            // Reset Form via cancelEdit
            cancelEdit();

        } catch (error: any) {
            console.error("Error saving bank:", error);
            showNotification(`Failed to save bank: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBank = async (id: string) => {
        if (confirm("Are you sure you want to delete this bank?")) {
            try {
                await deleteDoc(doc(db, "Banks", id));
                showNotification("Bank deleted successfully.", "success");
            } catch (error: any) {
                console.error("Error deleting bank:", error);
                showNotification(`Error deleting bank: ${error.message}`, "error");
            }
        }
    }

    const toggleStatus = async (bank: any) => {
        const newStatus = bank.status === "Active" ? "Inactive" : "Active";
        try {
            await updateDoc(doc(db, "Banks", bank.id), { status: newStatus });
            showNotification(`Bank status updated to ${newStatus}`, "success");
        } catch (error: any) {
            console.error("Error updating status:", error);
            showNotification("Failed to update status", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            <AdminSidebar />
            <div className="lg:pl-80 pt-20 lg:pt-6 p-6 transition-all duration-300">
                {/* Background Ambience */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
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
                        <p className="font-semibold">{notification.message}</p>
                    </div>
                )}

                <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => router.push('/admin/welcome')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Dashboard
                            </button>
                            <h1 className="text-4xl font-black tracking-tight text-white">Bank Management</h1>
                            <p className="text-gray-400 mt-1">Add and manage collection bank accounts.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add/Edit Bank Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl sticky top-6">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    {editingBankId ? (
                                        <>
                                            <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit Bank
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            Add New Bank
                                        </>
                                    )}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Select Bank</label>
                                        <select
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            {ETHIOPIAN_BANKS.map((bank) => (
                                                <option key={bank} value={bank} className="bg-[#1a1a1a] text-white">{bank}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Holder Name</label>
                                        <input
                                            type="text"
                                            value={accountHolderName}
                                            onChange={(e) => setAccountHolderName(e.target.value)}
                                            className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                            placeholder="e.g. Abebe Kebede"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 font-mono"
                                            placeholder="e.g. 1000123456789"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                            Bank Logo {editingBankId && "(Leave empty to keep existing)"}
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setBankLogoFile(e.target.files ? e.target.files[0] : null)}
                                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-blue-600 transition-all cursor-pointer border border-white/10 rounded-xl bg-[#0a0a0a]/50"
                                                required={!editingBankId} // Required only for new banks
                                            />
                                        </div>
                                        {bankLogoFile ? (
                                            <p className="text-xs text-green-400 mt-1 ml-1 truncate">New Selected: {bankLogoFile.name}</p>
                                        ) : existingLogoUrl && (
                                            <div className="flex items-center gap-2 mt-2 ml-1">
                                                <span className="text-xs text-gray-500">Current:</span>
                                                <div className="relative w-6 h-6 rounded overflow-hidden border border-white/20">
                                                    <Image src={existingLogoUrl} alt="Current" fill className="object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="Active" className="bg-[#1a1a1a]">Active</option>
                                            <option value="Inactive" className="bg-[#1a1a1a]">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        {editingBankId && (
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                disabled={isLoading}
                                                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                            ) : (
                                                editingBankId ? "Update Bank" : "Add Bank Account"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Bank List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 px-1">
                                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                Active Banks ({banks.length})
                            </h2>

                            {banks.length === 0 ? (
                                <div className="p-12 rounded-3xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center text-gray-500 border-dashed border-2">
                                    <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    <p>No banks added yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {banks.map((bank) => (
                                        <div key={bank.id} className="group relative p-5 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-blue-500/30 transition-all hover:shadow-lg hover:shadow-blue-900/10">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden relative">
                                                        {bank.bankLogo ? (
                                                            <Image src={bank.bankLogo} alt={bank.bankName} fill className="object-contain p-1" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-gray-900">LOGO</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-white leading-tight truncate pr-2">{bank.bankName}</h3>
                                                        <p className="text-xs text-gray-400 mt-1">Holder: <span className="text-gray-300">{bank.accountHolderName}</span></p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className={`w-2 h-2 rounded-full ${bank.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${bank.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{bank.status || 'Active'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => handleEdit(bank)}
                                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                                        title="Edit Bank"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBank(bank.id)}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                        title="Delete Bank"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(bank)}
                                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                                        title="Toggle Status"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Account Number</p>
                                                <p className="font-mono text-lg text-blue-400 font-bold tracking-wider">{bank.accountNumber}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
