"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, orderBy, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";

interface UserOrder {
    id: string; // The order document ID
    contractPeriod: number;
    dailyIncome: number;
    lastIncomeSync: any;
    price: number;
    principalIncome: number;
    productId: string;
    productName: string;
    purchaseDate: any;
    remainingDays: number;
    status: string;
    totalProfit: number;
    userId: string;
}

interface UserData {
    id: string;
    phoneNumber: string;
    balanceWallet: number;
}

export default function ProductContractPage() {
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [users, setUsers] = useState<{ [key: string]: UserData }>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Editing State
    const [editPeriods, setEditPeriods] = useState<{ [key: string]: string }>({});
    const [expandedUsers, setExpandedUsers] = useState<{ [key: string]: boolean }>({});

    // Toggle Expand
    const toggleExpand = (userId: string) => {
        setExpandedUsers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    // Modal State
    interface ModalState {
        isOpen: boolean;
        title: string;
        message: string;
        type: 'confirm' | 'success' | 'error' | 'warning';
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => Promise<void> | void;
    }

    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: "",
        message: "",
        type: 'confirm'
    });

    const [modalLoading, setModalLoading] = useState(false);

    const closeModal = () => {
        if (modalLoading) return;
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleModalConfirm = async () => {
        if (modal.onConfirm) {
            setModalLoading(true);
            try {
                await modal.onConfirm();
            } catch (error) {
                console.error("Modal action error:", error);
            } finally {
                setModalLoading(false);
            }
        } else {
            closeModal();
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // 1. Fetch Active Orders
            const ordersQ = query(collection(db, "UserOrders"));
            const snapshot = await getDocs(ordersQ);
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UserOrder[];

            setOrders(ordersData);

            // 2. Extract User IDs and Fetch User Data
            const uniqueUserIds = Array.from(new Set(ordersData.map(o => o.userId)));
            const usersMap: { [key: string]: UserData } = {};

            if (uniqueUserIds.length > 0) {
                const usersSnap = await getDocs(collection(db, "Customers"));
                usersSnap.docs.forEach(doc => {
                    if (uniqueUserIds.includes(doc.id)) {
                        usersMap[doc.id] = {
                            id: doc.id,
                            ...doc.data()
                        } as UserData;
                    }
                });
            }

            setUsers(usersMap);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateContract = async (orderId: string, currentPeriod: number, currentRemainingDays: number) => {
        const newPeriodStr = editPeriods[orderId];
        if (!newPeriodStr) return;

        const newPeriod = parseInt(newPeriodStr);
        if (isNaN(newPeriod) || newPeriod <= 0) {
            setModal({
                isOpen: true,
                title: "Invalid Input",
                message: "Please enter a valid contract period.",
                type: 'error',
                confirmText: "OK",
                onConfirm: undefined
            });
            return;
        }

        // Find the order to get dailyIncome
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const diff = newPeriod - currentPeriod;
        const newRemaining = currentRemainingDays + diff;

        // Calculate financial impact
        const incomeDiff = diff * order.dailyIncome;
        const newTotalProfit = order.totalProfit + incomeDiff;
        const newPrincipalIncome = order.principalIncome + incomeDiff;

        const confirmUpdate = async () => {
            setUpdatingId(orderId);
            try {
                await updateDoc(doc(db, "UserOrders", orderId), {
                    contractPeriod: newPeriod,
                    remainingDays: newRemaining,
                    totalProfit: newTotalProfit,
                    principalIncome: newPrincipalIncome
                });

                setOrders(prev => prev.map(o => o.id === orderId ? {
                    ...o,
                    contractPeriod: newPeriod,
                    remainingDays: newRemaining,
                    totalProfit: newTotalProfit,
                    principalIncome: newPrincipalIncome
                } : o));

                setEditPeriods(prev => {
                    const newState = { ...prev };
                    delete newState[orderId];
                    return newState;
                });

                setModal({
                    isOpen: true,
                    title: "Success",
                    message: "Contract & Financials updated successfully!",
                    type: 'success',
                    confirmText: "Great",
                    onConfirm: undefined
                });
            } catch (error) {
                console.error("Error updating contract:", error);
                setModal({
                    isOpen: true,
                    title: "Error",
                    message: "Failed to update contract.",
                    type: 'error',
                    confirmText: "Close",
                    onConfirm: undefined
                });
            } finally {
                setUpdatingId(null);
            }
        };

        const financialMsg = incomeDiff !== 0
            ? `\n\n💰 Financial Adjustment (${diff > 0 ? '+' : ''}${diff} days * ${order.dailyIncome}):\n` +
            `Total Profit: ${order.totalProfit.toLocaleString()} ➝ ${newTotalProfit.toLocaleString()}\n` +
            `Principal Income: ${order.principalIncome.toLocaleString()} ➝ ${newPrincipalIncome.toLocaleString()}`
            : "";

        setModal({
            isOpen: true,
            title: "Confirm Update",
            message: `Update contract period from ${currentPeriod} to ${newPeriod}?\n\nThis will also change remaining days from ${currentRemainingDays} to ${newRemaining}.${financialMsg}`,
            type: 'confirm',
            confirmText: "Confirm Update",
            onConfirm: confirmUpdate
        });
    };

    const [globalDays, setGlobalDays] = useState("");
    const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false);

    const handleGlobalUpdate = async () => {
        const days = parseInt(globalDays);
        if (isNaN(days) || days === 0) {
            setModal({
                isOpen: true,
                title: "Invalid Input",
                message: "Please enter a valid number of days (positive or negative).",
                type: 'error',
                confirmText: "OK",
                onConfirm: undefined
            });
            return;
        }

        const activeOrders = orders.filter(o => o.status === 'active');
        if (activeOrders.length === 0) {
            setModal({
                isOpen: true,
                title: "No Active Orders",
                message: "No active orders found to update.",
                type: 'error',
                confirmText: "OK",
                onConfirm: undefined
            });
            return;
        }

        const performGlobalUpdate = async () => {
            setIsUpdatingGlobal(true);
            try {
                const batchSize = 400;
                for (let i = 0; i < activeOrders.length; i += batchSize) {
                    const chunk = activeOrders.slice(i, i + batchSize);
                    const batch = writeBatch(db);

                    chunk.forEach(order => {
                        const newPeriod = Math.max(0, order.contractPeriod + days);
                        const newRemaining = Math.max(0, order.remainingDays + days);

                        // Calculate financial impact
                        const incomeDiff = days * order.dailyIncome;
                        const newTotalProfit = order.totalProfit + incomeDiff;
                        const newPrincipalIncome = order.principalIncome + incomeDiff;

                        batch.update(doc(db, "UserOrders", order.id), {
                            contractPeriod: newPeriod,
                            remainingDays: newRemaining,
                            totalProfit: newTotalProfit,
                            principalIncome: newPrincipalIncome
                        });
                    });

                    await batch.commit();
                }

                setOrders(prev => prev.map(o => {
                    if (o.status !== 'active') return o;

                    const incomeDiff = days * o.dailyIncome;
                    return {
                        ...o,
                        contractPeriod: Math.max(0, o.contractPeriod + days),
                        remainingDays: Math.max(0, o.remainingDays + days),
                        totalProfit: o.totalProfit + incomeDiff,
                        principalIncome: o.principalIncome + incomeDiff
                    };
                }));

                setGlobalDays("");
                setModal({
                    isOpen: true,
                    title: "Global Update Complete",
                    message: `Successfully updated ${activeOrders.length} orders!\n\nContract periods and financial values have been adjusted.`,
                    type: 'success',
                    confirmText: "Awesome",
                    onConfirm: undefined
                });

            } catch (error) {
                console.error("Error global update:", error);
                setModal({
                    isOpen: true,
                    title: "Update Failed",
                    message: "Failed to perform global update.",
                    type: 'error',
                    confirmText: "Close",
                    onConfirm: undefined
                });
            } finally {
                setIsUpdatingGlobal(false);
            }
        };

        setModal({
            isOpen: true,
            title: "Global Contract Adjustment",
            message: `⚠️ DANGER ZONE ⚠️\n\nYou are about to update ${activeOrders.length} ACTIVE orders.\n\nThis will:\n1. ${days > 0 ? 'INCREASE' : 'DECREASE'} Contract Period & Remaining Days by ${Math.abs(days)}.\n2. Automatically adjust Total Profit & Principal Income based on daily income (${days} * Daily Income).`,
            type: 'warning',
            confirmText: "Yes, Apply to All",
            cancelText: "Cancel Operation",
            onConfirm: performGlobalUpdate
        });
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const user = users[order.userId];
        const phone = user?.phoneNumber || "";
        const searchLower = searchTerm.toLowerCase();

        return phone.includes(searchLower) || order.productName.toLowerCase().includes(searchLower) || order.userId.includes(searchLower);
    });

    // Group by User for display
    const groupedOrders: { [key: string]: UserOrder[] } = {};
    filteredOrders.forEach(order => {
        if (!groupedOrders[order.userId]) {
            groupedOrders[order.userId] = [];
        }
        groupedOrders[order.userId].push(order);
    });

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <AdminSidebar />

            <div className="lg:pl-80 p-8 pt-24 lg:pt-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black mb-2">Product Contract Manager</h1>
                    <p className="text-gray-400">Track user orders and update contract periods.</p>
                </div>

                {/* Global Adjustment */}
                <div className="mb-8 relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-black p-6 md:p-8">
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-1">Global Adjustment</h3>
                                <div className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                                    Update contract period & remaining days for <span className="text-blue-400 font-bold">ALL {orders.filter(o => o.status === 'active').length} ACTIVE</span> products.
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    placeholder="Enter days (+/-)"
                                    value={globalDays}
                                    onChange={(e) => setGlobalDays(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 font-bold text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-all focus:bg-black"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600 pointer-events-none">DAYS</span>
                            </div>
                            <button
                                onClick={handleGlobalUpdate}
                                disabled={!globalDays || isUpdatingGlobal}
                                className="sm:w-auto w-full px-8 py-4 bg-blue-600 rounded-xl font-black text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isUpdatingGlobal ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>PROCESSING</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="whitespace-nowrap">APPLY TO ALL</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by phone number, product name, or User ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.keys(groupedOrders).length === 0 ? (
                            <div className="text-center py-20 bg-[#141414] rounded-3xl border border-white/5">
                                <p className="text-gray-500 font-bold">No orders found.</p>
                            </div>
                        ) : (
                            Object.entries(groupedOrders).map(([userId, userOrders]) => {
                                const user = users[userId];
                                const isExpanded = expandedUsers[userId];
                                return (
                                    <div key={userId} className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden transition-all duration-300">
                                        {/* User Header - Clickable */}
                                        <div
                                            onClick={() => toggleExpand(userId)}
                                            className="bg-white/5 px-6 py-5 flex items-center justify-between border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-600/20 text-blue-500'}`}>
                                                    {userOrders.length}
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white tracking-tight">{user?.phoneNumber || 'Unknown User'}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                                                    <span className="text-sm font-bold text-green-500">{user?.balanceWallet?.toLocaleString() || 0} ETB Balance</span>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Products List - Collapsible */}
                                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'hidden opacity-0'}`}>
                                            {userOrders.map(order => (
                                                <div key={order.id} className="bg-black/20 rounded-2xl p-5 border border-white/5 hover:border-blue-500/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h4 className="text-lg font-black text-white mb-1">{order.productName}</h4>
                                                            <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${order.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'}`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400 mb-0.5">Daily</p>
                                                            <p className="font-mono font-bold text-xl text-blue-400">{order.dailyIncome}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                                            <span className="text-gray-500">Price</span>
                                                            <span className="text-white font-bold font-mono">{order.price.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                                            <span className="text-gray-500">Remaining</span>
                                                            <span className="text-white font-bold font-mono">{order.remainingDays} days</span>
                                                        </div>

                                                        <div className="pt-2">
                                                            <label className="block text-[10px] uppercase font-black text-gray-500 mb-2">Contract Period (Days)</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder={order.contractPeriod.toString()}
                                                                    value={editPeriods[order.id] || ''}
                                                                    onChange={(e) => setEditPeriods(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                                    className="w-20 bg-black border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-center focus:border-blue-500 focus:outline-none transition-colors"
                                                                />
                                                                <button
                                                                    onClick={() => handleUpdateContract(order.id, order.contractPeriod, order.remainingDays)}
                                                                    disabled={!editPeriods[order.id] || updatingId === order.id}
                                                                    className="flex-1 bg-blue-600 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
                                                                >
                                                                    {updatingId === order.id ? 'Saving...' : 'SAVE'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Custom Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={closeModal}
                    ></div>
                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all scale-100">
                        <div className={`p-6 ${modal.type === 'warning' ? 'bg-red-500/10 border-b border-red-500/10' : 'bg-white/5 border-b border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                                    ${modal.type === 'success' ? 'bg-green-500/20 text-green-500' :
                                        modal.type === 'error' ? 'bg-red-500/20 text-red-500' :
                                            modal.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-blue-500/20 text-blue-500'}`}>
                                    {modal.type === 'success' && (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    {modal.type === 'error' && (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    {modal.type === 'warning' && (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    )}
                                    {modal.type === 'confirm' && (
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{modal.title}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">{modal.message}</p>
                        </div>

                        <div className="p-6 pt-0 flex gap-3">
                            {/* Cancel Button - Only show if onConfirm is present (meaning it's a decision) */}
                            {modal.onConfirm && (
                                <button
                                    onClick={closeModal}
                                    disabled={modalLoading}
                                    className="flex-1 px-6 py-3 rounded-xl font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    {modal.cancelText || 'Cancel'}
                                </button>
                            )}

                            <button
                                onClick={handleModalConfirm}
                                disabled={modalLoading}
                                className={`flex-1 px-6 py-3 rounded-xl font-bold text-black transition-colors flex items-center justify-center gap-2
                                    ${modal.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-white hover:bg-gray-200'}`}
                            >
                                {modalLoading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                {modal.confirmText || 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
