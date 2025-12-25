"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import Image from "next/image";

interface Bank {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    bankLogo?: string;
    status: string;
}

export default function BankDetailsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const methodId = searchParams.get('method');
    const amount = searchParams.get('amount') || '0';

    const [banks, setBanks] = useState<Bank[]>([]);
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [showBankDetails, setShowBankDetails] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState<string>('');
    const [countdown, setCountdown] = useState(180); // 3 minutes
    const [ftCode, setFtCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (methodId) {
            const fetchBanks = async () => {
                try {
                    const methodDoc = await getDoc(doc(db, "PaymentMethods", methodId));

                    if (methodDoc.exists()) {
                        const methodData = methodDoc.data();
                        const accountNumbers = methodData.accountNumbers || [];

                        const q = query(
                            collection(db, "Banks"),
                            where("status", "==", "Active")
                        );

                        const unsubscribe = onSnapshot(q, (snapshot) => {
                            const banksData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            } as Bank));

                            const filteredBanks = banksData.filter(bank =>
                                accountNumbers.includes(bank.accountNumber)
                            );

                            setBanks(filteredBanks);
                            setIsLoading(false);
                        });

                        return () => unsubscribe();
                    }
                } catch (error) {
                    console.error("Error fetching banks:", error);
                    setIsLoading(false);
                }
            };

            fetchBanks();
        }
    }, [methodId]);

    // Countdown timer
    useEffect(() => {
        if (showBankDetails && countdown > 0) {
            const timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [showBankDetails, countdown]);

    const handleBankSelect = (bank: Bank) => {
        setSelectedBank(bank);
        setShowBankDetails(true);
        setCountdown(180); // Reset countdown
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleSubmit = async () => {
        if (!ftCode.trim() || !selectedBank) {
            alert('Please enter the FT code');
            return;
        }

        setIsSubmitting(true);
        try {
            const { addDoc, getDocs, query: firestoreQuery, where } = await import('firebase/firestore');
            const { auth } = await import('@/lib/firebase');

            const currentUser = auth.currentUser;
            let phoneNumber = '';

            // Fetch user's phone number from Customers collection
            if (currentUser) {
                const customersQuery = firestoreQuery(
                    collection(db, 'Customers'),
                    where('uid', '==', currentUser.uid)
                );
                const customersSnapshot = await getDocs(customersQuery);

                if (!customersSnapshot.empty) {
                    const customerData = customersSnapshot.docs[0].data();
                    phoneNumber = customerData.phoneNumber || '';
                }
            }

            await addDoc(collection(db, 'RechargeReview'), {
                userId: currentUser?.uid || 'anonymous',
                phoneNumber: phoneNumber,
                amount: amount,
                bankId: selectedBank.id,
                bankName: selectedBank.bankName,
                accountNumber: selectedBank.accountNumber,
                accountHolderName: selectedBank.accountHolderName,
                ftCode: ftCode,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Redirect to review page
            router.push(`/recharge-review?amount=${amount}`);
        } catch (error) {
            console.error('Error submitting recharge:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return { mins, secs };
    };

    const { mins, secs } = formatTime(countdown);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="flex-1 text-center text-xl font-bold -ml-10">Recharge</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
                {/* Amount Display */}
                <div className="text-center mb-6">
                    <p className="text-gray-600 text-sm mb-2">The amount</p>
                    <p className="text-5xl font-black text-purple-600">{parseInt(amount).toLocaleString()} Br</p>
                </div>

                {/* Order Amount */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">Order Amount</span>
                        <span className="text-xl font-bold text-purple-600">ETB {parseInt(amount).toLocaleString()}.00</span>
                    </div>
                </div>

                {/* Bank Selection */}
                {!showBankDetails && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-4">Please choose payment</h2>

                        {banks.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No banks available for this payment method</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {banks.map((bank) => (
                                    <button
                                        key={bank.id}
                                        onClick={() => handleBankSelect(bank)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden relative shadow-sm">
                                                {bank.bankLogo ? (
                                                    <Image
                                                        src={bank.bankLogo}
                                                        alt={bank.bankName}
                                                        fill
                                                        className="object-contain p-1"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400">BANK</span>
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-base font-bold text-gray-900">{bank.bankName}</p>
                                            </div>
                                        </div>

                                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bank Details Modal/Bottom Sheet */}
            {showBankDetails && selectedBank && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-fade-in">
                    <div className="w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
                        {/* Header with Countdown */}
                        <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-4 sticky top-0 z-10">
                            <div className="flex items-center justify-between max-w-2xl mx-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                        {selectedBank.bankLogo && (
                                            <Image
                                                src={selectedBank.bankLogo}
                                                alt={selectedBank.bankName}
                                                width={40}
                                                height={40}
                                                className="object-contain p-1"
                                            />
                                        )}
                                    </div>
                                    <span className="font-semibold">Order Remaining</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <span className="text-2xl font-bold">{mins}</span>
                                    </div>
                                    <span className="text-sm">Min</span>
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <span className="text-2xl font-bold">{secs}</span>
                                    </div>
                                    <span className="text-sm">Sec</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 max-w-2xl mx-auto">
                            {/* Step 1 */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-4">
                                    <span className="text-gray-900">Step 1</span>
                                    <span className="text-gray-500 ml-2">Copy account for payment</span>
                                </h3>

                                <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                        <span className="text-gray-600">Order Amount</span>
                                        <span className="text-xl font-bold text-purple-600">ETB {parseInt(amount).toLocaleString()}.00</span>
                                    </div>

                                    <div>
                                        <label className="text-gray-500 text-sm block mb-2">Payment Channel</label>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-900">{selectedBank.bankName}</span>
                                            <button
                                                onClick={() => setShowBankDetails(false)}
                                                className="px-4 py-1 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-100"
                                            >
                                                switch
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-gray-500 text-sm block mb-2">Account Name</label>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-900">{selectedBank.accountHolderName}</span>
                                            <button
                                                onClick={() => copyToClipboard(selectedBank.accountHolderName, 'name')}
                                                className="px-4 py-1 border border-gray-300 rounded-full text-sm text-purple-600 hover:bg-purple-50"
                                            >
                                                {copied === 'name' ? '✓ copied' : 'copy'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-gray-500 text-sm block mb-2">Account Number</label>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-lg text-gray-900 font-mono">{selectedBank.accountNumber}</span>
                                            <button
                                                onClick={() => copyToClipboard(selectedBank.accountNumber, 'number')}
                                                className="px-4 py-1 border border-gray-300 rounded-full text-sm text-purple-600 hover:bg-purple-50"
                                            >
                                                {copied === 'number' ? '✓ copied' : 'copy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-4">
                                    <span className="text-gray-900">Step 2</span>
                                    <span className="text-red-600 ml-2">Paste payment sms Or enter TID: FT*****</span>
                                </h3>

                                <textarea
                                    value={ftCode}
                                    onChange={(e) => setFtCode(e.target.value)}
                                    className="w-full h-32 p-4 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:border-purple-500"
                                    placeholder="Dear Mr your Account 1*********1122 has been debited with ETB 200.00. Your Current Balance is ETB 44.76 Thank you for Banking with CBE! https://apps.cbe.com.et:100/?id=FT25512S26V825101122"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !ftCode.trim()}
                                className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-2xl shadow-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Button - Only show when not in details view */}
            {!showBankDetails && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
                    <div className="max-w-2xl mx-auto">
                        <button
                            disabled
                            className="w-full h-14 bg-gray-300 text-white font-bold rounded-2xl cursor-not-allowed"
                        >
                            I have transferred
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
