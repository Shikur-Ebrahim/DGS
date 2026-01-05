"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

type Tab = "B" | "C" | "D" | "E";

export default function TeamSearchPage() {
    // View Mode State
    const [viewMode, setViewMode] = useState<"team" | "withdraw" | "income" | "check">("team");

    // Team Search State
    const [searchPhone, setSearchPhone] = useState("");
    const [targetUser, setTargetUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<Tab>("B");
    const [teamData, setTeamData] = useState<any[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [totalCommission, setTotalCommission] = useState(0);
    const [calculatingCommission, setCalculatingCommission] = useState(false);

    // Withdrawal Search State
    const [withdrawSearchPhone, setWithdrawSearchPhone] = useState("");
    const [withdrawList, setWithdrawList] = useState<any[]>([]);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [totalApprovedWithdrawal, setTotalApprovedWithdrawal] = useState(0);
    const [withdrawError, setWithdrawError] = useState("");

    // Income/Order Search State
    const [incomeSearchPhone, setIncomeSearchPhone] = useState("");
    const [incomeList, setIncomeList] = useState<any[]>([]);
    const [incomeLoading, setIncomeLoading] = useState(false);
    const [totalDailyIncome, setTotalDailyIncome] = useState(0);
    const [accumulatedIncome, setAccumulatedIncome] = useState(0);
    const [incomeError, setIncomeError] = useState("");
    const [incomeTargetUser, setIncomeTargetUser] = useState<any>(null);

    // System Check State
    const [checkPhone, setCheckPhone] = useState("");
    const [checkLoading, setCheckLoading] = useState(false);
    const [checkError, setCheckError] = useState("");
    const [checkResult, setCheckResult] = useState<any>(null);


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchPhone.trim()) return;

        setLoading(true);
        setError("");
        setTargetUser(null);
        setTeamData([]);
        setTotalCommission(0);

        try {
            // Find user by phone
            const q = query(collection(db, "Customers"), where("phoneNumber", "==", searchPhone.trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError("User not found");
            } else {
                const doc = snapshot.docs[0];
                setTargetUser({ id: doc.id, ...doc.data() });
                // Automatically fetch Level B for the found user
                fetchTeamData(doc.id, "B");
                // Calculate Total Commission
                calculateTotalCommission(doc.id, setTotalCommission);
            }
        } catch (err: any) {
            console.error(err);
            setError("Search failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!withdrawSearchPhone.trim()) return;

        setWithdrawLoading(true);
        setWithdrawError("");
        setWithdrawList([]);
        setTotalApprovedWithdrawal(0);

        try {
            // Query withdraw collection by phoneNumber
            const q = query(
                collection(db, "withdraw"),
                where("phoneNumber", "==", withdrawSearchPhone.trim())
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setWithdrawError("No withdrawal history found for this number");
            } else {
                let total = 0;
                const list = snapshot.docs.map(doc => {
                    const data = doc.data();
                    if (data.status === 'approved') {
                        total += Number(data.amount || 0);
                    }
                    return { id: doc.id, ...data };
                });

                // Client-side sort by createdAt desc
                list.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.seconds ? a.createdAt.seconds : (new Date(a.createdAt).getTime() / 1000) || 0;
                    const timeB = b.createdAt?.seconds ? b.createdAt.seconds : (new Date(b.createdAt).getTime() / 1000) || 0;
                    return timeB - timeA;
                });

                setWithdrawList(list);
                setTotalApprovedWithdrawal(total);
            }
        } catch (err: any) {
            console.error(err);
            setWithdrawError("Search failed: " + err.message);
        } finally {
            setWithdrawLoading(false);
        }
    };

    const handleIncomeSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!incomeSearchPhone.trim()) return;

        setIncomeLoading(true);
        setIncomeError("");
        setIncomeList([]);
        setTotalDailyIncome(0);
        setAccumulatedIncome(0);
        setIncomeTargetUser(null);

        try {
            // 1. Find User to get UID
            const userQ = query(collection(db, "Customers"), where("phoneNumber", "==", incomeSearchPhone.trim()));
            const userSnap = await getDocs(userQ);

            if (userSnap.empty) {
                setIncomeError("User not found");
                setIncomeLoading(false);
                return;
            }

            const userDoc = userSnap.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;
            setIncomeTargetUser({ id: userId, ...userData });

            // 2. Fetch UserOrders using userId
            const ordersQ = query(collection(db, "UserOrders"), where("userId", "==", userId));
            const ordersSnap = await getDocs(ordersQ);

            if (ordersSnap.empty) {
                setIncomeError("No active orders found for this user");
            } else {
                let totalDaily = 0;
                let totalAccumulated = 0;

                const list = ordersSnap.docs.map(doc => {
                    const data = doc.data();
                    // Status check if needed, prompt implies tracking all but usually active ones count for daily income
                    if (data.status === 'active') {
                        totalDaily += Number(data.dailyIncome || 0);
                    }

                    // Calculate days passed
                    const totalDays = Number(data.contractPeriod || 0);
                    const remaining = Number(data.remainingDays || 0);
                    const daysPassed = totalDays - remaining;
                    const generated = (daysPassed > 0 ? daysPassed : 0) * Number(data.dailyIncome || 0);

                    totalAccumulated += generated;

                    return {
                        id: doc.id,
                        ...data,
                        daysPassed: daysPassed > 0 ? daysPassed : 0,
                        totalGenerated: generated
                    };
                });

                // Sort by purchaseDate desc
                list.sort((a: any, b: any) => {
                    const timeA = a.purchaseDate?.seconds ? a.purchaseDate.seconds : (new Date(a.purchaseDate).getTime() / 1000) || 0;
                    const timeB = b.purchaseDate?.seconds ? b.purchaseDate.seconds : (new Date(b.purchaseDate).getTime() / 1000) || 0;
                    return timeB - timeA;
                });

                setIncomeList(list);
                setTotalDailyIncome(totalDaily);
                setAccumulatedIncome(totalAccumulated);
            }

        } catch (err: any) {
            console.error(err);
            setIncomeError("Search failed: " + err.message);
        } finally {
            setIncomeLoading(false);
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
            // Reuse logic but wait for it
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


    const calculateTotalCommission = async (uid: string, setStateCallback: (val: number) => void) => {
        setCalculatingCommission(true);
        try {
            const levels = [
                { id: "B", field: "inviterA", rate: 0.10 },
                { id: "C", field: "inviterB", rate: 0.05 },
                { id: "D", field: "inviterC", rate: 0.03 },
                { id: "E", field: "inviterD", rate: 0.02 }
            ];

            let grandTotal = 0;

            await Promise.all(levels.map(async (level) => {
                const customersRef = collection(db, "Customers");
                const q = query(customersRef, where(level.field, "==", uid));
                const snapshot = await getDocs(q);

                const levelRechargeSums = await Promise.all(snapshot.docs.map(async (doc) => {
                    const userId = doc.id;
                    const rechargeQ = query(
                        collection(db, "RechargeReview"),
                        where("userId", "==", userId),
                        where("status", "==", "approved")
                    );
                    const rechargeSnap = await getDocs(rechargeQ);
                    return rechargeSnap.docs.reduce((sum, rDoc) => {
                        const amountStr = rDoc.data().amount || "0";
                        return sum + (parseFloat(amountStr) || 0);
                    }, 0);
                }));

                const levelTotalRecharge = levelRechargeSums.reduce((a, b) => a + b, 0);
                grandTotal += levelTotalRecharge * level.rate;
            }));

            setStateCallback(grandTotal);
        } catch (err) {
            console.error("Commission Calc Error:", err);
        } finally {
            setCalculatingCommission(false);
        }
    };

    const fetchTeamData = async (uid: string, level: Tab) => {
        setLoadingTeam(true);
        setActiveTab(level);

        try {
            const customersRef = collection(db, "Customers");
            const fieldMap: Record<Tab, string> = {
                "B": "inviterA",
                "C": "inviterB",
                "D": "inviterC",
                "E": "inviterD"
            };

            const q = query(customersRef, where(fieldMap[level], "==", uid));
            const snapshot = await getDocs(q);

            const members = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const userData = docSnap.data();
                const userId = docSnap.id;

                let totalRecharge = 0;
                try {
                    const rechargeQ = query(
                        collection(db, "RechargeReview"),
                        where("userId", "==", userId),
                        where("status", "==", "approved")
                    );
                    const rechargeSnapshot = await getDocs(rechargeQ);

                    totalRecharge = rechargeSnapshot.docs.reduce((sum, rDoc) => {
                        const amountStr = rDoc.data().amount || "0";
                        return sum + (parseFloat(amountStr) || 0);
                    }, 0);
                } catch (err) {
                    console.error(`Error fetching recharges for ${userId}`, err);
                }

                return {
                    id: userId,
                    ...userData,
                    totalRecharge
                };
            }));

            members.sort((a: any, b: any) => {
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return dateB - dateA;
            });

            setTeamData(members);
        } catch (err) {
            console.error("Error fetching team:", err);
        } finally {
            setLoadingTeam(false);
        }
    };

    return (
        <div className="min-h-screen p-8 text-white">
            <h1 className="text-3xl font-black mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Data Tracking Center
            </h1>

            {/* View Mode Toggles */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                <button
                    onClick={() => setViewMode("team")}
                    className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${viewMode === "team" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-[#1a1a1a] text-gray-400 hover:text-white"}`}
                >
                    Team Search
                </button>
                <button
                    onClick={() => setViewMode("withdraw")}
                    className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${viewMode === "withdraw" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-[#1a1a1a] text-gray-400 hover:text-white"}`}
                >
                    Withdrawal Search
                </button>
                <button
                    onClick={() => setViewMode("income")}
                    className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${viewMode === "income" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-[#1a1a1a] text-gray-400 hover:text-white"}`}
                >
                    Income Search
                </button>
                <button
                    onClick={() => setViewMode("check")}
                    className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${viewMode === "check" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "bg-[#1a1a1a] text-gray-400 hover:text-white"}`}
                >
                    System Check
                </button>
            </div>

            {/* TEAM SEARCH SECTION */}
            {viewMode === "team" && (
                <>
                    {/* Search Section */}
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 mb-8 max-w-2xl">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <input
                                type="text"
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                placeholder="Enter User Phone Number"
                                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {loading ? "Searching..." : "Search"}
                            </button>
                        </form>
                        {error && <p className="text-red-400 mt-3 font-medium">{error}</p>}
                    </div>

                    {/* Target User Info */}
                    {targetUser && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/30">
                                        {targetUser.email?.substring(0, 2).toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black tracking-tight">{targetUser.phoneNumber}</h2>
                                        <p className="text-blue-400 font-medium mt-1">Found User</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right bg-black/20 p-5 rounded-2xl border border-white/5 min-w-[200px]">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Wallet Balance</p>
                                        <p className="text-3xl font-black text-emerald-400">{(targetUser.balanceWallet || 0).toLocaleString()} <span className="text-sm text-gray-500 font-medium">ETB</span></p>
                                    </div>

                                    <div className="text-right bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 rounded-2xl border border-amber-500/20 min-w-[200px] relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                                        <div className="relative z-10">
                                            <p className="text-xs text-amber-400/80 uppercase font-bold tracking-wider mb-1">Total Rewards</p>
                                            {calculatingCommission ? (
                                                <div className="flex items-center justify-end gap-2 h-9">
                                                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-amber-500 text-sm font-bold">Calculating...</span>
                                                </div>
                                            ) : (
                                                <p className="text-3xl font-black text-amber-400">
                                                    {totalCommission.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    <span className="text-sm text-amber-500/60 font-medium ml-1">ETB</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Hierarchy Tabs */}
                            <div>
                                <div className="flex gap-2 mb-6 border-b border-white/10 pb-1">
                                    {(["B", "C", "D", "E"] as Tab[]).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => fetchTeamData(targetUser.id, tab)}
                                            className={`px-8 py-3 rounded-t-xl font-bold text-sm transition-all ${activeTab === tab
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-y-[1px]"
                                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                                }`}
                                        >
                                            Level {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* Results Table */}
                                <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Phone Number</th>
                                                    <th className="px-6 py-4">Assets</th>
                                                    <th className="px-6 py-4">Join Date</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {loadingTeam ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                            <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                                            Loading team data...
                                                        </td>
                                                    </tr>
                                                ) : teamData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                                                            No members found in Level {activeTab}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    teamData.map((member) => (
                                                        <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                                                            <td className="px-6 py-4 font-mono text-gray-300">{member.phoneNumber}</td>
                                                            <td className="px-6 py-4 font-black text-emerald-400">{(member.totalRecharge || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                                {member.createdAt?.toDate ? member.createdAt.toDate().toLocaleDateString() : "N/A"}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${member.vipLevel > 0 ? "bg-amber-500/20 text-amber-500" : "bg-gray-700 text-gray-400"}`}>
                                                                    {member.vipLevel > 0 ? `VIP ${member.vipLevel}` : "Standard"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-4 text-right text-gray-500 text-sm font-medium">
                                    Total Members: <span className="text-white">{teamData.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* WITHDRAWAL SEARCH SECTION */}
            {viewMode === "withdraw" && (
                <div className="animate-fade-in">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 mb-8 max-w-2xl">
                        <form onSubmit={handleWithdrawSearch} className="flex gap-4">
                            <input
                                type="text"
                                value={withdrawSearchPhone}
                                onChange={(e) => setWithdrawSearchPhone(e.target.value)}
                                placeholder="Enter Withdrawal User Phone"
                                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                            />
                            <button
                                type="submit"
                                disabled={withdrawLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {withdrawLoading ? "Searching..." : "Search"}
                            </button>
                        </form>
                        {withdrawError && <p className="text-red-400 mt-3 font-medium">{withdrawError}</p>}
                    </div>

                    {/* Withdrawal Stats */}
                    {withdrawList.length > 0 && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-emerald-400">Client Withdrawal Overview</h2>
                                    <p className="text-gray-400 text-sm mt-1">{withdrawSearchPhone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-emerald-400/80 uppercase font-bold tracking-wider mb-1">Total Approved Withdrawal</p>
                                    <p className="text-4xl font-black text-emerald-400">
                                        {totalApprovedWithdrawal.toLocaleString()}
                                        <span className="text-sm text-emerald-500/60 font-medium ml-1">ETB</span>
                                    </p>
                                </div>
                            </div>

                            {/* Withdrawal List Table */}
                            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Account Holder</th>
                                            <th className="px-6 py-4">Bank Details</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {withdrawList.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-bold text-gray-200">{item.accountHolderName}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{item.phoneNumber}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    <p>{item.bankName}</p>
                                                    <p className="font-mono text-xs text-gray-500">{item.accountNumber}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-emerald-400">{item.amount?.toLocaleString()} ETB</div>
                                                    {item.fee && <div className="text-xs text-red-400">Fee: {item.fee}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                                                        item.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-yellow-500/20 text-yellow-500'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* INCOME / ORDER SEARCH SECTION */}
            {viewMode === "income" && (
                <div className="animate-fade-in">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 mb-8 max-w-2xl">
                        <form onSubmit={handleIncomeSearch} className="flex gap-4">
                            <input
                                type="text"
                                value={incomeSearchPhone}
                                onChange={(e) => setIncomeSearchPhone(e.target.value)}
                                placeholder="Enter User Phone for Income"
                                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors font-mono"
                            />
                            <button
                                type="submit"
                                disabled={incomeLoading}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {incomeLoading ? "Searching..." : "Search"}
                            </button>
                        </form>
                        {incomeError && <p className="text-red-400 mt-3 font-medium">{incomeError}</p>}
                    </div>

                    {/* Income Stats & List */}
                    {incomeTargetUser && incomeList.length > 0 && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h2 className="text-xl font-bold text-amber-400">User Income Analysis</h2>
                                    <div className="flex gap-4 mt-2">
                                        <p className="text-gray-400 text-sm font-mono">{incomeTargetUser.phoneNumber}</p>
                                        <p className="text-gray-500 text-sm">ID: {incomeTargetUser.id}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 justify-end">
                                    <div className="text-right bg-black/20 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-amber-400/80 uppercase font-bold tracking-wider mb-1">Total Daily Income</p>
                                        <p className="text-3xl font-black text-amber-400">
                                            {totalDailyIncome.toLocaleString()}
                                            <span className="text-sm text-amber-500/60 font-medium ml-1">ETB/day</span>
                                        </p>
                                    </div>
                                    <div className="text-right bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <p className="text-xs text-emerald-400/80 uppercase font-bold tracking-wider mb-1">Total Generated</p>
                                        <p className="text-3xl font-black text-emerald-400">
                                            {accumulatedIncome.toLocaleString()}
                                            <span className="text-sm text-emerald-500/60 font-medium ml-1">ETB</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Orders Table */}
                            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Product Name</th>
                                            <th className="px-6 py-4">Investment</th>
                                            <th className="px-6 py-4">Daily Income</th>
                                            <th className="px-6 py-4">Timeline</th>
                                            <th className="px-6 py-4">Profit Generated</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {incomeList.map((order) => (
                                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-200">{order.productName}</div>
                                                    <div className="text-xs text-gray-500">{order.productId}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-300">
                                                    {(order.price || 0).toLocaleString()} <span className="text-xs text-gray-600">ETB</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-amber-400">{(order.dailyIncome || 0).toLocaleString()}</div>
                                                    <div className="text-xs text-gray-500">ETB/day</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-400">Period: {order.contractPeriod} days</span>
                                                        <span className="text-blue-400 font-bold">{order.daysPassed} days passed</span>
                                                        <span className="text-xs text-gray-600">Purchased: {order.purchaseDate?.toDate ? order.purchaseDate.toDate().toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-emerald-400">{(order.totalGenerated || 0).toLocaleString()} ETB</div>
                                                    <div className="text-xs text-gray-500">Accumulated</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                                                        'bg-gray-700 text-gray-400'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {incomeTargetUser && incomeList.length === 0 && (
                        <div className="text-center py-12 bg-[#1a1a1a] rounded-2xl border border-white/5 mt-6">
                            <p className="text-gray-500">No investment records found for this user.</p>
                        </div>
                    )}
                </div>
            )}

            {/* SYSTEM CHECK SECTION */}
            {viewMode === "check" && (
                <div className="animate-fade-in">
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 mb-8 max-w-2xl">
                        <form onSubmit={handleSystemCheck} className="flex gap-4">
                            <input
                                type="text"
                                value={checkPhone}
                                onChange={(e) => setCheckPhone(e.target.value)}
                                placeholder="Enter User Phone for Verification"
                                className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono"
                            />
                            <button
                                type="submit"
                                disabled={checkLoading}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {checkLoading ? "Verifying..." : "Verify System"}
                            </button>
                        </form>
                        {checkError && <p className="text-red-400 mt-3 font-medium">{checkError}</p>}
                    </div>

                    {checkResult && (
                        <div className="space-y-6">
                            {/* Result Card */}
                            <div className={`border rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl ${checkResult.isSafe
                                ? "bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-500/30"
                                : "bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-500/30"
                                }`}>
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">
                                        System Integrity Check
                                    </p>
                                    <h2 className={`text-4xl font-black ${checkResult.isSafe ? "text-emerald-400" : "text-red-500"}`}>
                                        {checkResult.isSafe ? "SYSTEM NORMAL" : "ANOMALY DETECTED"}
                                    </h2>
                                    <p className="mt-2 text-gray-400 max-w-lg">
                                        {checkResult.isSafe
                                            ? "User assets and withdrawals are within legitimate income limits."
                                            : "WARNING: User withdrawals and assets exceed calculated legitimate income sources."}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {checkResult.isSafe ? (
                                        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                            <p className="text-xs text-emerald-500 uppercase font-bold tracking-wider mb-1">Safe Withdrawal Margin</p>
                                            <p className="text-3xl font-black text-emerald-500">
                                                {Math.abs(checkResult.diff).toLocaleString()} <span className="text-sm">ETB</span>
                                            </p>
                                            <p className="text-xs text-emerald-400/60 mt-1">Max Available to Withdraw</p>
                                        </div>
                                    ) : (
                                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                            <p className="text-xs text-red-500 uppercase font-bold tracking-wider mb-1">Excess Amount (Cheating)</p>
                                            <p className="text-3xl font-black text-red-500">
                                                {checkResult.diff.toLocaleString()} <span className="text-sm">ETB</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CREDITS */}
                                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                        Legitimate Sources (Credits)
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl">
                                            <span className="text-gray-400">Total Rewards (x95%)</span>
                                            <span className="font-mono text-emerald-400 font-bold">
                                                {(checkResult.details.totalRewards * 0.95).toLocaleString()} ETB
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl">
                                            <span className="text-gray-400">Total Generated Income</span>
                                            <span className="font-mono text-emerald-400 font-bold">
                                                {checkResult.details.totalGenerated.toLocaleString()} ETB
                                            </span>
                                        </div>
                                        <div className="border-t border-white/10 pt-4 mt-2 flex justify-between items-center">
                                            <span className="text-gray-300 font-bold">Total Credits</span>
                                            <span className="font-mono text-emerald-400 text-xl font-black">
                                                {checkResult.details.formulas.credits.toLocaleString()} ETB
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* DEBITS */}
                                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-red-500 rounded-full"></span>
                                        Assets & Withdrawals (Debits)
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl">
                                            <span className="text-gray-400">Total Approved Withdrawals</span>
                                            <span className="font-mono text-red-400 font-bold">
                                                {checkResult.details.totalWithdrawals.toLocaleString()} ETB
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl">
                                            <span className="text-gray-400">Current Wallet Balance</span>
                                            <span className="font-mono text-red-400 font-bold">
                                                {checkResult.details.walletBalance.toLocaleString()} ETB
                                            </span>
                                        </div>
                                        <div className="border-t border-white/10 pt-4 mt-2 flex justify-between items-center">
                                            <span className="text-gray-300 font-bold">Total Debits</span>
                                            <span className="font-mono text-red-400 text-xl font-black">
                                                {checkResult.details.formulas.debits.toLocaleString()} ETB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
