"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Image from "next/image";

export default function PaymentMethodPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get('amount') || '7500';

    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "PaymentMethods"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const methodsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPaymentMethods(methodsData);
            setIsLoading(false);

            // Auto-select first method if available
            if (methodsData.length > 0 && !selectedMethod) {
                setSelectedMethod(methodsData[0].id);
            }
        });

        return () => unsubscribe();
    }, [selectedMethod]);

    const handleRecharge = () => {
        if (selectedMethod) {
            // Redirect to bank details page with payment method
            router.push(`/bank-details?method=${selectedMethod}&amount=${amount}`);
        }
    };

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

            {/* Amount Display */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="text-center mb-6">
                    <p className="text-gray-600 text-sm mb-2">The amount</p>
                    <p className="text-5xl font-black text-purple-600">{parseInt(amount).toLocaleString()} Br</p>
                </div>

                {/* Payment Methods Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-4">Select payment method</h2>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                        </div>
                    ) : paymentMethods.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No payment methods available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMethod === method.id
                                            ? 'border-purple-600 bg-purple-50 shadow-lg shadow-purple-200'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-0.5 flex items-center justify-center shadow-lg">
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                                                {method.logo ? (
                                                    <Image
                                                        src={method.logo}
                                                        alt={method.name}
                                                        fill
                                                        className="object-contain p-2"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-blue-600">PAY</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">{method.name}</span>
                                    </div>

                                    {selectedMethod === method.id && (
                                        <div className="flex-shrink-0">
                                            <svg className="w-7 h-7 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Action Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={handleRecharge}
                        disabled={!selectedMethod}
                        className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-2xl shadow-lg shadow-purple-300 disabled:shadow-none transition-all transform active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                        Recharge
                    </button>
                </div>
            </div>
        </div>
    );
}
