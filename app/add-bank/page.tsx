"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

export default function AddBankPage() {
    const router = useRouter();
    const [availableBanks, setAvailableBanks] = useState<any[]>([]);
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");
    const [showBankList, setShowBankList] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user: any) => {
            if (!user) router.push("/login");
        });

        const banksRef = collection(db, "WithdrawalBanks");
        const unsubBanks = onSnapshot(banksRef, (snapshot: any) => {
            const banksData = snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as any) }));
            setAvailableBanks(banksData);
            setLoading(false);
        });

        return () => {
            unsubscribe();
            unsubBanks();
        };
    }, [router]);

    const handleConnect = async () => {
        if (!selectedBank || !accountNumber || !accountHolderName) {
            alert("Please fill all details");
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error("Unauthorized");

            const bankIdStr = selectedBank.name.replace(/\s+/g, '_');
            const linkedBankRef = doc(db, "UserLinkedBanks", `${userId}_${bankIdStr}`);

            await setDoc(linkedBankRef, {
                userId,
                bankId: selectedBank.id,
                bankName: selectedBank.name,
                accountNumber,
                accountHolderName,
                updatedAt: serverTimestamp()
            }, { merge: true });

            router.push("/bank");
        } catch (error) {
            console.error("Link bank error:", error);
            alert("Failed to link bank account. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/bank')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="text-xl font-black text-white tracking-wide uppercase">Connect Account</h2>
            </div>

            <div className="p-6 max-w-xl mx-auto space-y-8 pt-10">
                {/* Visual Identity */}
                <div className="flex flex-col items-center text-center space-y-4 mb-4">
                    <div className="relative w-28 h-28">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                        <Image src="/bank_icon.png" alt="Bank" width={112} height={112} className="relative z-10 drop-shadow-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Financial Shield</h1>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Securely link your withdrawal method</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                    {/* Bank Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">Select Partner Bank</label>
                        <button
                            onClick={() => setShowBankList(true)}
                            className="w-full bg-[#151515] hover:bg-[#1a1a1a] border border-white/5 p-5 rounded-[2rem] flex items-center justify-between transition-all group"
                        >
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                    {selectedBank?.logoUrl ? (
                                        <Image src={selectedBank.logoUrl} alt={selectedBank.name} width={32} height={32} className="object-contain" />
                                    ) : (
                                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">{selectedBank?.name || "Choose Supported Bank"}</p>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{selectedBank ? "Verified Partner" : "Click to browse list"}</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>

                    {/* Account Name */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">Account Holder Name</label>
                        <input
                            type="text"
                            placeholder="NAME AS PER BANK RECORD"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                            className="w-full bg-[#151515] border border-white/5 p-5 rounded-[2rem] text-sm font-black tracking-widest outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                        />
                    </div>

                    {/* Account Number */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-4">Account Number / IBAN</label>
                        <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="w-full bg-[#151515] border border-white/5 p-5 rounded-[2rem] text-sm font-black tracking-[0.2em] font-mono outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-8">
                    <button
                        onClick={handleConnect}
                        disabled={isSubmitting}
                        className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? "Encrypting Data..." : "Authorize Connection"}
                    </button>
                    <p className="text-[9px] text-center text-gray-600 uppercase tracking-widest mt-6 bg-white/5 py-3 rounded-xl border border-white/5">
                        🛡️ 256-bit AES End-to-End Encryption Enabled
                    </p>
                </div>
            </div>

            {/* Bank List Modal */}
            {showBankList && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end animate-fade-in">
                    <div className="w-full bg-[#0a0a0a] border-t border-white/10 rounded-t-[3rem] p-8 max-h-[80vh] flex flex-col animate-slide-up">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">Select Partner</h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Only authorized banks displayed</p>
                            </div>
                            <button onClick={() => setShowBankList(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {availableBanks.map((bank: any) => (
                                <button
                                    key={bank.id}
                                    onClick={() => {
                                        setSelectedBank(bank);
                                        setShowBankList(false);
                                    }}
                                    className="w-full flex items-center gap-4 p-5 rounded-3xl bg-[#151515] hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                                        {bank.logoUrl ? (
                                            <Image src={bank.logoUrl} alt={bank.name} width={40} height={40} className="object-contain" />
                                        ) : (
                                            <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10zm3 3v5m4-5v5m4-5v5" /></svg>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-white group-hover:text-blue-400 transition-colors">{bank.name}</p>
                                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Network Integrated</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
