"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, deleteDoc } from "firebase/firestore";

interface RechargeRequest {
    id: string;
    userId: string;
    phoneNumber: string;
    amount: string;
    bankId: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ftCode: string;
    status: string;
    createdAt: string;
}

export default function AdminRechargePage() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [pendingRequests, setPendingRequests] = useState<RechargeRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<'approve' | 'delete' | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
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

    useEffect(() => {
        if (!isChecking) {
            const q = query(
                collection(db, "RechargeReview"),
                where("status", "==", "pending")
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as RechargeRequest));

                // Sort by createdAt (newest first)
                requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                setPendingRequests(requests);
                setIsLoading(false);
            });

            return () => unsubscribe();
        }
    }, [isChecking]);

    const handleApprove = async (request: RechargeRequest) => {
        if (processingId) return;

        setProcessingId(request.id);

        try {
            // Find the customer by userId
            const customersQuery = query(
                collection(db, "Customers"),
                where("uid", "==", request.userId)
            );

            const customersSnapshot = await getDocs(customersQuery);

            if (!customersSnapshot.empty) {
                const customerDoc = customersSnapshot.docs[0];
                const customerData = customerDoc.data();
                const currentBalance = customerData.balanceWallet || 0;
                const rechargeAmount = parseFloat(request.amount);
                const newBalance = currentBalance + rechargeAmount;

                // Update customer's balance
                await updateDoc(doc(db, "Customers", customerDoc.id), {
                    balanceWallet: newBalance
                });

                // Update status to 'approved' so it leaves the pending list immediately
                await updateDoc(doc(db, "RechargeReview", request.id), {
                    status: "approved",
                    approvedAt: new Date().toISOString()
                });

                console.log(`Approved recharge for ${request.phoneNumber}: ${rechargeAmount} Br added to balance. Document will be deleted in 10 seconds.`);

                // Delete the recharge request document after 10 seconds
                setTimeout(async () => {
                    try {
                        await deleteDoc(doc(db, "RechargeReview", request.id));
                        console.log(`Document ${request.id} deleted from RechargeReview.`);
                    } catch (err) {
                        console.error("Error deleting document after delay:", err);
                    }
                }, 10000);
            } else {
                alert("Customer not found!");
            }
        } catch (error) {
            console.error("Error approving recharge:", error);
            alert("Failed to approve recharge. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (requestId: string) => {
        if (processingId) return;

        setProcessingId(requestId);

        try {
            await deleteDoc(doc(db, "RechargeReview", requestId));
            console.log(`Manually deleted recharge request: ${requestId}`);
        } catch (error) {
            console.error("Error deleting recharge request:", error);
            alert("Failed to delete request. Please try again.");
        } finally {
            setProcessingId(null);
            setConfirmingId(null);
            setConfirmAction(null);
        }
    };

    if (isChecking || isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/10 sticky top-0">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/admin/welcome')}
                            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-black">Recharge Verification</h1>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="text-sm font-bold text-blue-400">{pendingRequests.length} Pending</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">All Clear!</h3>
                        <p className="text-gray-500">No pending recharge requests at the moment</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    {/* Left Side - User Info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{request.phoneNumber}</p>
                                                <p className="text-xs text-gray-500">User ID: {request.userId.slice(0, 12)}...</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Amount</p>
                                                <p className="text-2xl font-black text-blue-400">{parseInt(request.amount).toLocaleString()} Br</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Bank</p>
                                                <p className="font-bold">{request.bankName}</p>
                                                <p className="text-xs text-gray-400 font-mono">{request.accountNumber}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">FT Code</p>
                                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
                                                <p className="font-mono text-sm text-green-400 break-all">{request.ftCode}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Submitted: {new Date(request.createdAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side - Action Buttons */}
                                    <div className="lg:w-64">
                                        {confirmingId === request.id ? (
                                            <div className="flex flex-col gap-2 animate-fade-in">
                                                <p className="text-xs font-bold text-center uppercase tracking-widest mb-1">
                                                    Confirm {confirmAction}?
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (confirmAction === 'approve') handleApprove(request);
                                                            else handleDelete(request.id);
                                                            setConfirmingId(null);
                                                            setConfirmAction(null);
                                                        }}
                                                        disabled={processingId === request.id}
                                                        className={`flex-1 h-12 ${confirmAction === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2`}
                                                    >
                                                        {processingId === request.id ? (
                                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                        ) : (
                                                            'Confirm'
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setConfirmingId(null);
                                                            setConfirmAction(null);
                                                        }}
                                                        disabled={processingId === request.id}
                                                        className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => {
                                                        setConfirmingId(request.id);
                                                        setConfirmAction('approve');
                                                    }}
                                                    disabled={processingId !== null}
                                                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-green-500/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setConfirmingId(request.id);
                                                        setConfirmAction('delete');
                                                    }}
                                                    disabled={processingId !== null}
                                                    className="w-full h-12 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 rounded-xl transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete Request
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
