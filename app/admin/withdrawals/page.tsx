"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, orderBy, where, deleteDoc, runTransaction } from "firebase/firestore";
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
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
    const [editingAmount, setEditingAmount] = useState<string | null>(null);
    const [editedAmounts, setEditedAmounts] = useState<{ [key: string]: number }>({});
    const [editReasons, setEditReasons] = useState<{ [key: string]: string }>({});

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingWithdrawal, setRejectingWithdrawal] = useState<Withdrawal | null>(null);
    const [shouldRefund, setShouldRefund] = useState(false);

    // System Check State
    const [checkPhone, setCheckPhone] = useState("");
    const [checkLoading, setCheckLoading] = useState(false);
    const [checkError, setCheckError] = useState("");
    const [checkResult, setCheckResult] = useState<any>(null);

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

    const handleSystemCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkPhone.trim()) return;

        setCheckLoading(true);
        setCheckError("");
        setCheckResult(null);

        try {
            // 1. Find User
            const userQ = query(collection(db, "Customers"), where("phoneNumber", "==", checkPhone.trim()));
            const userSnap = await getDocs(userQ);

            if (userSnap.empty) {
                setCheckError("User not found");
                setCheckLoading(false);
                return;
            }

            const userDoc = userSnap.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;
            const walletBalance = Number(userData.balanceWallet || 0);

            // 2. Fetch Total Approved Withdrawals
            const withdrawQ = query(
                collection(db, "withdraw"),
                where("phoneNumber", "==", checkPhone.trim()),
                where("status", "==", "approved")
            );
            const withdrawSnap = await getDocs(withdrawQ);
            const totalWithdrawals = withdrawSnap.docs.reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0);

            // 3. Fetch Total Generated Income (from Orders)
            const ordersQ = query(collection(db, "UserOrders"), where("userId", "==", userId));
            const ordersSnap = await getDocs(ordersQ);
            const totalGenerated = ordersSnap.docs.reduce((sum, doc) => {
                const data = doc.data();
                const totalDays = Number(data.contractPeriod || 0);
                const remaining = Number(data.remainingDays || 0);
                const daysPassed = totalDays - remaining;
                const generated = (daysPassed > 0 ? daysPassed : 0) * Number(data.dailyIncome || 0);
                return sum + generated;
            }, 0);

            // 4. Fetch Total Rewards (Commission)
            const levels = [
                { id: "B", field: "inviterA", rate: 0.10 },
                { id: "C", field: "inviterB", rate: 0.05 },
                { id: "D", field: "inviterC", rate: 0.03 },
                { id: "E", field: "inviterD", rate: 0.02 }
            ];

            let totalRewards = 0;
            await Promise.all(levels.map(async (level) => {
                const customersRef = collection(db, "Customers");
                const q = query(customersRef, where(level.field, "==", userId));
                const snapshot = await getDocs(q);

                const levelRechargeSums = await Promise.all(snapshot.docs.map(async (doc) => {
                    const docId = doc.id;
                    const rechargeQ = query(
                        collection(db, "RechargeReview"),
                        where("userId", "==", docId),
                        where("status", "==", "approved")
                    );
                    const rechargeSnap = await getDocs(rechargeQ);
                    return rechargeSnap.docs.reduce((sum, rDoc) => {
                        const amountStr = rDoc.data().amount || "0";
                        return sum + (parseFloat(amountStr) || 0);
                    }, 0);
                }));

                const levelTotalRecharge = levelRechargeSums.reduce((a, b) => a + b, 0);
                totalRewards += levelTotalRecharge * level.rate;
            }));

            // 5. Apply Formula
            const adjustedRewards = totalRewards * 0.95; // Time 95%
            const totalCredits = adjustedRewards + totalGenerated;
            const totalDebits = totalWithdrawals + walletBalance;

            const isSafe = totalCredits >= totalDebits;
            const diff = totalDebits - totalCredits;

            setCheckResult({
                isSafe,
                diff,
                phoneNumber: checkPhone.trim(),
                details: {
                    walletBalance,
                    totalWithdrawals,
                    totalGenerated,
                    totalRewards,
                    formulas: {
                        credits: totalCredits,
                        debits: totalDebits
                    }
                }
            });

        } catch (err: any) {
            console.error(err);
            setCheckError("Check failed: " + err.message);
        } finally {
            setCheckLoading(false);
        }
    };

    const handleSaveEdit = async (withdrawalId: string) => {
        const newAmount = editedAmounts[withdrawalId];
        const reason = editReasons[withdrawalId];

        if (!newAmount) {
            alert('Please enter a valid amount');
            return;
        }

        if (!reason || reason.trim() === '') {
            alert('Please provide a reason for editing the amount');
            return;
        }

        setProcessingId(withdrawalId);
        try {
            const newFee = newAmount * 0.06;
            const newActualReceipt = newAmount * 0.94;

            await updateDoc(doc(db, "withdraw", withdrawalId), {
                amount: newAmount,
                fee: newFee,
                actualReceipt: newActualReceipt,
                editReason: reason,
                editedAt: new Date().toISOString(),
                editedBy: 'admin'
            });

            // Update local state
            setWithdrawals((prev: any[]) => prev.map((w: any) =>
                w.id === withdrawalId ? {
                    ...w,
                    amount: newAmount,
                    fee: newFee,
                    actualReceipt: newActualReceipt,
                    editReason: reason
                } : w
            ));

            setEditingAmount(null);
            alert('Withdrawal amount updated successfully!');
        } catch (error) {
            console.error('Error updating withdrawal:', error);
            alert('Failed to update withdrawal amount');
        } finally {
            setProcessingId(null);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
        if (newStatus === 'rejected') {
            const withdrawal = withdrawals.find(w => w.id === id);
            if (!withdrawal) return;
            setRejectingWithdrawal(withdrawal);
            setShowRejectModal(true);
            return;
        }

        if (!confirm(`Are you sure you want to ${newStatus} this withdrawal?`)) return;

        setProcessingId(id);
        try {
            await updateDoc(doc(db, "withdraw", id), {
                status: newStatus,
                approvedAt: new Date().toISOString()
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

    const confirmRejection = async () => {
        if (!rejectingWithdrawal) return;

        setProcessingId(rejectingWithdrawal.id);
        try {
            await runTransaction(db, async (transaction) => {
                const withdrawRef = doc(db, "withdraw", rejectingWithdrawal.id);

                // 1. Update withdrawal status
                transaction.update(withdrawRef, {
                    status: 'rejected',
                    rejectedAt: new Date().toISOString(),
                    refunded: shouldRefund
                });

                // 2. Perform refund if requested
                if (shouldRefund) {
                    const userRef = doc(db, "Customers", rejectingWithdrawal.userId);
                    const userSnap = await transaction.get(userRef);

                    if (!userSnap.exists()) {
                        throw new Error("User document not found for refund");
                    }

                    const currentBalance = Number(userSnap.data().balanceWallet || 0);
                    const refundAmount = Number(rejectingWithdrawal.amount);

                    transaction.update(userRef, {
                        balanceWallet: currentBalance + refundAmount
                    });
                }
            });

            // Update local state
            setWithdrawals((prev: any[]) => prev.map((w: any) =>
                w.id === rejectingWithdrawal.id ? { ...w, status: 'rejected' } : w
            ));

            alert(`Withdrawal rejected ${shouldRefund ? 'and refunded' : ''} successfully!`);
            setShowRejectModal(false);
            setRejectingWithdrawal(null);
            setShouldRefund(false);
        } catch (error: any) {
            console.error("Error confirming rejection:", error);
            alert("Failed to reject withdrawal: " + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this rejected withdrawal? This action cannot be undone.")) return;

        setProcessingId(id);
        try {
            await deleteDoc(doc(db, "withdraw", id));

            // Update local state
            setWithdrawals((prev: any[]) => prev.filter((w: any) => w.id !== id));

            alert("Withdrawal deleted successfully!");
        } catch (error) {
            console.error("Error deleting withdrawal:", error);
            alert("Failed to delete withdrawal");
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

                    {/* System Check Section */}
                    <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center gap-3 mb-4">
                            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-900">Security Check</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Verify user financial integrity before approving withdrawals</p>

                        <form onSubmit={handleSystemCheck} className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={checkPhone}
                                onChange={(e) => setCheckPhone(e.target.value)}
                                placeholder="Enter Phone Number to Verify"
                                className="flex-1 bg-white border border-purple-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                            />
                            <button
                                type="submit"
                                disabled={checkLoading}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-600/30"
                            >
                                {checkLoading ? "Checking..." : "Verify"}
                            </button>
                        </form>
                        {checkError && <p className="text-red-600 text-sm font-medium mb-4">{checkError}</p>}

                        {checkResult && (
                            <div className={`rounded-xl p-5 border-2 ${checkResult.isSafe
                                ? "bg-emerald-50 border-emerald-300"
                                : "bg-red-50 border-red-300"
                                }`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {checkResult.isSafe ? (
                                                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            )}
                                            <h3 className={`text-lg font-black ${checkResult.isSafe ? "text-emerald-700" : "text-red-700"}`}>
                                                {checkResult.isSafe ? "SYSTEM NORMAL" : "⚠️ ANOMALY DETECTED"}
                                            </h3>
                                        </div>
                                        <p className={`text-sm mb-3 ${checkResult.isSafe ? "text-emerald-600" : "text-red-600"}`}>
                                            Phone: <span className="font-mono font-bold">{checkResult.phoneNumber}</span>
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-white/50 p-2 rounded">
                                                <p className="text-gray-600 font-semibold">Credits (Income)</p>
                                                <p className="font-mono font-bold text-emerald-700">{checkResult.details.formulas.credits.toLocaleString()} ETB</p>
                                            </div>
                                            <div className="bg-white/50 p-2 rounded">
                                                <p className="text-gray-600 font-semibold">Debits (Assets)</p>
                                                <p className="font-mono font-bold text-red-700">{checkResult.details.formulas.debits.toLocaleString()} ETB</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-right px-4 py-3 rounded-lg ${checkResult.isSafe ? "bg-emerald-100" : "bg-red-100"
                                        }`}>
                                        <p className={`text-xs font-bold uppercase mb-1 ${checkResult.isSafe ? "text-emerald-600" : "text-red-600"
                                            }`}>
                                            {checkResult.isSafe ? "Safe Margin" : "Excess"}
                                        </p>
                                        <p className={`text-2xl font-black ${checkResult.isSafe ? "text-emerald-700" : "text-red-700"
                                            }`}>
                                            {Math.abs(checkResult.diff).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-600">ETB</p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-mono font-bold text-gray-900">{withdrawal.phoneNumber}</p>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(withdrawal.phoneNumber);
                                                                setCopiedPhone(withdrawal.id);
                                                                setTimeout(() => setCopiedPhone(null), 2000);
                                                            }}
                                                            className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors group relative"
                                                            title="Copy phone number"
                                                        >
                                                            {copiedPhone === withdrawal.id ? (
                                                                <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">Copied!</span>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 pt-2 border-t border-gray-100 flex-wrap">
                                                <div className="group/amount relative">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                                    {editingAmount === withdrawal.id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    defaultValue={editedAmounts[withdrawal.id] || withdrawal.amount}
                                                                    onChange={(e) => setEditedAmounts({ ...editedAmounts, [withdrawal.id]: Number(e.target.value) })}
                                                                    className="w-32 px-2 py-1 border-2 border-blue-500 rounded-lg font-bold text-blue-600"
                                                                    placeholder="New amount"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={() => handleSaveEdit(withdrawal.id)}
                                                                    disabled={processingId === withdrawal.id}
                                                                    className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
                                                                >
                                                                    {processingId === withdrawal.id ? 'Saving...' : 'Save'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingAmount(null)}
                                                                    className="px-3 py-1 bg-gray-400 text-white rounded-lg text-xs font-bold hover:bg-gray-500"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Reason for editing (required)"
                                                                value={editReasons[withdrawal.id] || ''}
                                                                onChange={(e) => setEditReasons({ ...editReasons, [withdrawal.id]: e.target.value })}
                                                                className="w-full px-3 py-2 border-2 border-amber-400 rounded-lg text-sm text-gray-700 placeholder-gray-400"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-2xl font-black text-blue-600 blur-[6px] group-hover/amount:blur-0 transition-all cursor-help duration-300">
                                                                {(editedAmounts[withdrawal.id] || withdrawal.amount).toLocaleString()} ETB
                                                            </p>
                                                            <button
                                                                onClick={() => setEditingAmount(withdrawal.id)}
                                                                className="opacity-0 group-hover/amount:opacity-100 p-1 hover:bg-blue-100 rounded transition-all"
                                                                title="Edit amount"
                                                            >
                                                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-40 group-hover/amount:opacity-0 transition-opacity pointer-events-none">
                                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">PRIVATE</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fee</p>
                                                    <p className="text-lg font-bold text-red-600">
                                                        -{((editedAmounts[withdrawal.id] || withdrawal.amount) * 0.06).toLocaleString()} ETB
                                                    </p>
                                                </div>
                                                <div className="relative overflow-hidden px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100/50 shadow-inner">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none"></div>
                                                    <p className="text-xs text-emerald-600/70 uppercase tracking-wide mb-0.5 font-black">Actual Receipt</p>
                                                    <p className="text-2xl font-black text-emerald-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse">
                                                        {((editedAmounts[withdrawal.id] || withdrawal.amount) * 0.94).toLocaleString()} ETB
                                                    </p>
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

                                        {withdrawal.status === 'rejected' && (
                                            <div className="flex lg:flex-col gap-3">
                                                <button
                                                    onClick={() => handleDelete(withdrawal.id)}
                                                    disabled={processingId === withdrawal.id}
                                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-gray-700/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
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

            {/* Rejection Modal */}
            {showRejectModal && rejectingWithdrawal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Reject Withdrawal</h2>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-500 font-medium">User:</span>
                                <span className="text-gray-900 font-bold">{rejectingWithdrawal.phoneNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 font-medium">Amount:</span>
                                <span className="text-red-600 font-black">{rejectingWithdrawal.amount.toLocaleString()} ETB</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-8 cursor-pointer group" onClick={() => setShouldRefund(!shouldRefund)}>
                            <div className="flex items-center h-6">
                                <input
                                    type="checkbox"
                                    checked={shouldRefund}
                                    onChange={(e) => setShouldRefund(e.target.checked)}
                                    className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-amber-900 cursor-pointer">
                                    Return amount to user's wallet
                                </label>
                                <p className="text-xs text-amber-700/70 mt-0.5">
                                    Checking this will automatically add {rejectingWithdrawal.amount.toLocaleString()} ETB back to the customer's balance.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectingWithdrawal(null);
                                    setShouldRefund(false);
                                }}
                                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRejection}
                                disabled={processingId === rejectingWithdrawal.id}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                            >
                                {processingId === rejectingWithdrawal.id ? 'Processing...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
