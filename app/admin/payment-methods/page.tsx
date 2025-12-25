"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import Image from "next/image";

// Cloudinary Config
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "djpf3qevd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "NOVA-PROJECT";

export default function AdminPaymentMethodsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Form States
    const [methodName, setMethodName] = useState("");
    const [accountNumbers, setAccountNumbers] = useState<string[]>([""]); // Array of account numbers
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // Data State
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    router.push("/welcome");
                }
            } else {
                router.push("/admin");
            }
        });

        const q = query(collection(db, "PaymentMethods"), orderBy("createdAt", "desc"));
        const unsubscribeMethods = onSnapshot(q, (snapshot) => {
            const methodsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPaymentMethods(methodsData);
        });

        return () => {
            unsubscribe();
            unsubscribeMethods();
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

    const handleAddAccountNumber = () => {
        setAccountNumbers([...accountNumbers, ""]);
    };

    const handleRemoveAccountNumber = (index: number) => {
        if (accountNumbers.length > 1) {
            setAccountNumbers(accountNumbers.filter((_, i) => i !== index));
        }
    };

    const handleAccountNumberChange = (index: number, value: string) => {
        const newAccountNumbers = [...accountNumbers];
        newAccountNumbers[index] = value;
        setAccountNumbers(newAccountNumbers);
    };

    const handleAddMethod = async (e: React.FormEvent) => {
        e.preventDefault();

        const validAccountNumbers = accountNumbers.filter(num => num.trim() !== "");

        if (!methodName || !logoFile || validAccountNumbers.length === 0) {
            showNotification("Please provide all fields.", "error");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Upload Logo
            const downloadURL = await uploadToCloudinary(logoFile);

            // 2. Save to Firestore
            await addDoc(collection(db, "PaymentMethods"), {
                name: methodName,
                accountNumbers: validAccountNumbers, // Save as array
                logo: downloadURL,
                createdAt: new Date().toISOString()
            });

            // Reset
            setMethodName("");
            setAccountNumbers([""]);
            setLogoFile(null);
            showNotification("Payment method added successfully!", "success");

        } catch (error: any) {
            console.error("Error adding payment method:", error);
            showNotification(`Failed to add: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMethod = async (id: string) => {
        if (confirm("Are you sure you want to delete this payment method?")) {
            try {
                await deleteDoc(doc(db, "PaymentMethods", id));
                showNotification("Payment method deleted.", "success");
            } catch (error: any) {
                console.error("Error deleting:", error);
                showNotification(`Error deleting: ${error.message}`, "error");
            }
        }
    };

    if (!isMounted) {
        return null; // Prevent hydration mismatch
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
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

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
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
                        <h1 className="text-4xl font-black tracking-tight text-white">Payment Methods</h1>
                        <p className="text-gray-400 mt-1">Manage payment options available for recharge.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl sticky top-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Add Method
                            </h2>
                            <form onSubmit={handleAddMethod} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Method Name</label>
                                    <input
                                        type="text"
                                        value={methodName}
                                        onChange={(e) => setMethodName(e.target.value)}
                                        className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-600"
                                        placeholder="e.g. WtetbPay"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Account Numbers</label>
                                        <button
                                            type="button"
                                            onClick={handleAddAccountNumber}
                                            className="p-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                                            title="Add Account Number"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {accountNumbers.map((accountNum, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={accountNum}
                                                    onChange={(e) => handleAccountNumberChange(index, e.target.value)}
                                                    className="flex-1 h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-600 font-mono"
                                                    placeholder="e.g. 1000123456789"
                                                    required
                                                />
                                                {accountNumbers.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAccountNumber(index)}
                                                        className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Logo</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-green-600 transition-all cursor-pointer border border-white/10 rounded-xl bg-[#0a0a0a]/50"
                                            required
                                        />
                                    </div>
                                    {logoFile && <p className="text-xs text-green-400 mt-1 ml-1 truncate">Selected: {logoFile.name}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    ) : (
                                        "Add Payment Method"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 px-1">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            Active Methods ({paymentMethods.length})
                        </h2>

                        {paymentMethods.length === 0 ? (
                            <div className="p-12 rounded-3xl bg-white/5 border border-white/5 text-center flex flex-col items-center justify-center text-gray-500 border-dashed border-2">
                                <p>No payment methods added yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className="group p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-green-500/30 transition-all hover:shadow-lg hover:shadow-green-900/10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                                    {method.logo ? (
                                                        <Image src={method.logo} alt={method.name} fill className="object-contain p-1" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-gray-900">LOGO</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-lg mb-2">{method.name}</h3>
                                                    <div className="space-y-1">
                                                        {(Array.isArray(method.accountNumbers) ? method.accountNumbers : [method.accountNumber]).filter(Boolean).map((accNum: string, idx: number) => (
                                                            <p key={idx} className="text-xs text-gray-400 font-mono tracking-wider bg-white/5 px-2 py-1 rounded inline-block mr-2">
                                                                {accNum}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMethod(method.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
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
