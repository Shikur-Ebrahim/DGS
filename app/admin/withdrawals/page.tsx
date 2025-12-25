"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";

interface Withdrawal {
    id: string;
    accountHolderName: string;
    accountNumber: string;
    actualReceipt: number;
    amount: number;
    bankName: string;
    createdAt: any;
    fee: number;
    phoneNumber: string;
    status: string;
    userId: string;
}

export default function WithdrawalWalletPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchWithdrawals = async () => {
        try {
            const q = query(collection(db, "withdraw"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...(doc.data() as any)
            })) as Withdrawal[];
            setWithdrawals(data);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${newStatus} this withdrawal?`)) return;

        setProcessingId(id);
        try {
            await updateDoc(doc(db, "withdraw", id), {
                status: newStatus
            });

            // Update local state
            setWithdrawals((prev: any[]) => prev.map((w: any) =>
                w.id === id ? { ...w, status: newStatus } : w
            ));

            alert(`Withdrawal ${newStatus} successfully!`);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update withdrawal status");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredWithdrawals = withdrawals.filter((w: any) => {
        if (filter === 'all') return true;
        return w.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />

            <div className="lg:pl-72 pt-20 lg:pt-6 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Wallet</h1>
                        <p className="text-gray-600">Manage and approve user withdrawal requests</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-6 py-3 rounded-xl font-bold capitalize transition-all whitespace-nowrap ${filter === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                {tab} ({withdrawals.filter((w: any) => tab === 'all' || w.status === tab).length})
                            </button>
                        ))}
                    </div>

                    {/* Withdrawals List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-600">Loading withdrawals...</p>
                        </div>
                    ) : filteredWithdrawals.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-gray-500 font-medium">No {filter !== 'all' ? filter : ''} withdrawals found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredWithdrawals.map((withdrawal) => (
                                <div
                                    key={withdrawal.id}
                                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* Left: Details */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(withdrawal.status)} uppercase`}>
                                                    {withdrawal.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {withdrawal.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account Holder</p>
                                                    <p className="font-bold text-gray-900">{withdrawal.accountHolderName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bank</p>
                                                    <p className="font-bold text-gray-900">{withdrawal.bankName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account Number</p>
                                                    <p className="font-mono font-bold text-gray-900">{withdrawal.accountNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                                                    <p className="font-mono font-bold text-gray-900">{withdrawal.phoneNumber}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 pt-2 border-t border-gray-100">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                                    <p className="text-2xl font-black text-blue-600">{withdrawal.amount} ETB</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fee</p>
                                                    <p className="text-lg font-bold text-red-600">-{withdrawal.fee} ETB</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Actual Receipt</p>
                                                    <p className="text-lg font-bold text-emerald-600">{withdrawal.actualReceipt} ETB</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        {withdrawal.status === 'pending' && (
                                            <div className="flex lg:flex-col gap-3">
                                                <button
                                                    onClick={() => handleStatusUpdate(withdrawal.id, 'approved')}
                                                    disabled={processingId === withdrawal.id}
                                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                                                    disabled={processingId === withdrawal.id}
                                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Reject
                                                </button>
                                            </div>
                                        )}
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
