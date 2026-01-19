"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, where, doc, updateDoc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

export default function AdminCustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [rechargeData, setRechargeData] = useState<Map<string, number>>(new Map());
    const [withdrawalData, setWithdrawalData] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [balanceFilter, setBalanceFilter] = useState<'all' | 'zero' | 'positive'>('all');

    // Selection & Editing State
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [newBalance, setNewBalance] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user: any) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) {
                    router.push("/welcome");
                } else {
                    setIsLoading(false);
                }
            } else {
                router.push("/admin");
            }
        });

        // Fetch customers
        const customersQuery = query(collection(db, "Customers"));
        const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch approved recharge data
        const rechargeQuery = query(
            collection(db, "RechargeReview"),
            where("status", "==", "approved")
        );
        const unsubscribeRecharge = onSnapshot(rechargeQuery, (snapshot) => {
            const rechargeMap = new Map<string, number>();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                const amount = parseFloat(data.amount) || 0;
                rechargeMap.set(userId, (rechargeMap.get(userId) || 0) + amount);
            });
            setRechargeData(rechargeMap);
        });

        // Fetch approved withdrawal data
        const withdrawalQuery = query(
            collection(db, "withdraw"),
            where("status", "==", "approved")
        );
        const unsubscribeWithdrawal = onSnapshot(withdrawalQuery, (snapshot) => {
            const withdrawalMap = new Map<string, number>();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                const amount = parseFloat(data.amount) || 0;
                withdrawalMap.set(userId, (withdrawalMap.get(userId) || 0) + amount);
            });
            setWithdrawalData(withdrawalMap);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeCustomers();
            unsubscribeRecharge();
            unsubscribeWithdrawal();
        };
    }, [router]);

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.id?.toLowerCase().includes(searchTerm.toLowerCase());

        const balance = customer.balanceWallet || 0;
        let matchesFilter = true;
        if (balanceFilter === 'zero') matchesFilter = balance === 0;
        else if (balanceFilter === 'positive') matchesFilter = balance > 0;

        return matchesSearch && matchesFilter;
    });

    const toggleUserSelection = (userId: string) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(userId)) newSelection.delete(userId);
        else newSelection.add(userId);
        setSelectedUsers(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.size === filteredCustomers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    const handleUpdateBalance = async () => {
        const amount = parseFloat(newBalance);
        if (isNaN(amount)) {
            alert("Please enter a valid amount");
            return;
        }

        setIsProcessing(true);
        try {
            if (isBulkEditing) {
                const batch = writeBatch(db);
                selectedUsers.forEach(userId => {
                    const userRef = doc(db, "Customers", userId);
                    batch.update(userRef, { balanceWallet: amount });
                });
                await batch.commit();
                alert(`Updated balance for ${selectedUsers.size} users`);
            } else if (editingUser) {
                const userRef = doc(db, "Customers", editingUser.id);
                await updateDoc(userRef, { balanceWallet: amount });
                alert(`Updated balance for ${editingUser.phoneNumber || 'user'}`);
            }

            // Reset state
            setEditingUser(null);
            setIsBulkEditing(false);
            setNewBalance("");
            if (isBulkEditing) setSelectedUsers(new Set());
        } catch (error) {
            console.error("Error updating balance:", error);
            alert("Failed to update balance");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center lg:pl-80">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:pl-80">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-black mb-8">Customer Management</h1>

                {/* Search Bar */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by phone, email, or UID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Filters & Bulk Actions */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex bg-[#141414] p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar gap-2">
                        {(['all', 'zero', 'positive'] as const).map((f) => {
                            const count = f === 'all' ? customers.length : f === 'zero' ? customers.filter(c => (c.balanceWallet || 0) === 0).length : customers.filter(c => (c.balanceWallet || 0) > 0).length;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setBalanceFilter(f)}
                                    className={`flex-1 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${balanceFilter === f
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {f === 'all' ? `All (${count})` : f === 'zero' ? `0 Bal (${count})` : `Bal > 0 (${count})`}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSelectAll}
                            className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${selectedUsers.size === filteredCustomers.length && filteredCustomers.length > 0
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-[#141414] border-white/5 text-gray-500'
                                }`}
                        >
                            {selectedUsers.size === filteredCustomers.length && filteredCustomers.length > 0 ? "DESELECT ALL" : "SELECT ALL"}
                        </button>

                        {selectedUsers.size > 0 && (
                            <button
                                onClick={() => {
                                    setIsBulkEditing(true);
                                    setNewBalance("");
                                }}
                                className="flex-[1.5] py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/30 animate-in zoom-in duration-200"
                            >
                                SET BULK ({selectedUsers.size})
                            </button>
                        )}
                    </div>
                </div>

                {/* Customers Card List */}
                <div className="grid grid-cols-1 gap-3">
                    {filteredCustomers.map((customer) => {
                        const totalRecharge = rechargeData.get(customer.id) || 0;
                        const totalWithdrawal = withdrawalData.get(customer.id) || 0;
                        const isSelected = selectedUsers.has(customer.id);

                        return (
                            <div
                                key={customer.id}
                                className={`relative overflow-hidden bg-[#141414] border rounded-2xl p-4 transition-all duration-300 active:scale-[0.98] ${isSelected ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-600/[0.03]' : 'border-white/5'
                                    }`}
                                onClick={() => toggleUserSelection(customer.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 p-2 overflow-hidden flex-shrink-0">
                                            <img
                                                src="/subsidy_icon.png"
                                                alt="Profile"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-white truncate">{customer.phoneNumber || 'NO PHONE'}</h3>
                                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter truncate">{customer.id.slice(0, 16)}...</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${customer.isValidMember ? 'bg-green-600/20 text-green-500' : 'bg-gray-600/20 text-gray-500'
                                            }`}>
                                            {customer.isValidMember ? 'Active' : 'Inactive'}
                                        </span>
                                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                            <span className="text-[8px] font-black text-purple-400">VIP</span>
                                            <span className="text-[10px] font-black text-white">{customer.vipLevel || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                                    <div className="bg-black/20 p-2 rounded-xl border border-white/[0.02]">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Balance</p>
                                        <p className={`text-xs font-black ${customer.balanceWallet > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                                            {(customer.balanceWallet || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-xl border border-white/[0.02] text-center">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Recharge</p>
                                        <p className="text-xs font-black text-white">{totalRecharge.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-xl border border-white/[0.02] text-right">
                                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Withdraw</p>
                                        <p className="text-xs font-black text-white">{totalWithdrawal.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingUser(customer);
                                        setNewBalance((customer.balanceWallet || 0).toString());
                                    }}
                                    className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>

                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredCustomers.length === 0 && (
                    <div className="text-center py-20 bg-black/20">
                        <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-gray-500 font-bold">No customers found matching your criteria</p>
                    </div>
                )}
                {/* Edit Modal */}
                {(editingUser || isBulkEditing) && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#141414] w-full max-w-md rounded-3xl p-8 border border-white/5 shadow-2xl animate-in zoom-in duration-200">
                            <h2 className="text-2xl font-black mb-2">
                                {isBulkEditing ? `Set Balance for ${selectedUsers.size} Users` : `Edit Balance`}
                            </h2>
                            {!isBulkEditing && (
                                <p className="text-sm text-gray-400 mb-6">Updating wallet for {editingUser?.phoneNumber}</p>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">New Balance (ETB)</label>
                                    <input
                                        type="number"
                                        value={newBalance}
                                        onChange={(e) => setNewBalance(e.target.value)}
                                        placeholder="Enter amount..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-black text-blue-500 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setEditingUser(null);
                                            setIsBulkEditing(false);
                                            setNewBalance("");
                                        }}
                                        className="flex-1 py-4 text-gray-400 font-bold hover:bg-white/5 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateBalance}
                                        disabled={isProcessing}
                                        className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
