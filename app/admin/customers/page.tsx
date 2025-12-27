"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

export default function AdminCustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [rechargeData, setRechargeData] = useState<Map<string, number>>(new Map());
    const [withdrawalData, setWithdrawalData] = useState<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const filteredCustomers = customers.filter(customer =>
        customer.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl">
                        <p className="text-sm text-blue-200 font-bold mb-1">Total Customers</p>
                        <p className="text-3xl font-black">{customers.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-2xl">
                        <p className="text-sm text-green-200 font-bold mb-1">Total Recharges</p>
                        <p className="text-3xl font-black">${Array.from(rechargeData.values()).reduce((a, b) => a + b, 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-2xl">
                        <p className="text-sm text-red-200 font-bold mb-1">Total Withdrawals</p>
                        <p className="text-3xl font-black">${Array.from(withdrawalData.values()).reduce((a, b) => a + b, 0).toFixed(2)}</p>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-[#141414] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Team Income</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">VIP Level</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Total Recharge</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Total Withdrawal</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCustomers.map((customer) => {
                                    const totalRecharge = rechargeData.get(customer.id) || 0;
                                    const totalWithdrawal = withdrawalData.get(customer.id) || 0;
                                    return (
                                        <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-white">{customer.phoneNumber || 'N/A'}</div>
                                                <div className="text-xs text-gray-500 font-mono">{customer.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{customer.email || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-green-400">${(customer.balanceWallet || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-blue-400">${(customer.totalTeamIncome || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-bold">
                                                    VIP {customer.vipLevel || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => alert(`Total Recharge: $${totalRecharge.toFixed(2)}`)}
                                                    className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg text-sm font-bold hover:bg-green-600/30 transition-colors"
                                                >
                                                    ${totalRecharge.toFixed(2)}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => alert(`Total Withdrawal: $${totalWithdrawal.toFixed(2)}`)}
                                                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-600/30 transition-colors"
                                                >
                                                    ${totalWithdrawal.toFixed(2)}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {customer.isValidMember ? (
                                                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-bold">Active</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-xs font-bold">Inactive</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredCustomers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p className="font-bold">No customers found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
