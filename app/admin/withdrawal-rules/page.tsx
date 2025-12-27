"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, onSnapshot, deleteDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

export default function AdminWithdrawalRulesPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [rules, setRules] = useState({
        maxWithdrawalPercent: 50,
        productRules: [] as { productId: string; productName: string; inviteRechargeRequired: number }[],
        customMessage: "You need more recharge from your invited users to unlock full withdrawal."
    });
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [inviteRechargeAmount, setInviteRechargeAmount] = useState(0);
    const [customers, setCustomers] = useState<any[]>([]);
    const [restrictions, setRestrictions] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [restrictionReason, setRestrictionReason] = useState("");
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

        // Fetch withdrawal rules
        const fetchRules = async () => {
            const rulesDoc = await getDoc(doc(db, "Settings", "withdrawalRules"));
            if (rulesDoc.exists()) {
                const data = rulesDoc.data();
                setRules({
                    maxWithdrawalPercent: data.maxWithdrawalPercent || 50,
                    productRules: data.productRules || [],
                    customMessage: data.customMessage || "You need more recharge from your invited users to unlock full withdrawal."
                });
            }
        };
        fetchRules();

        // Fetch all products
        const productsQuery = query(collection(db, "Products"));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch customers
        const customersQuery = query(collection(db, "Customers"));
        const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch restrictions
        const restrictionsQuery = query(collection(db, "WithdrawalRestrictions"));
        const unsubscribeRestrictions = onSnapshot(restrictionsQuery, (snapshot) => {
            setRestrictions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeCustomers();
            unsubscribeRestrictions();
            unsubscribeProducts();
        };
    }, [router]);

    const handleAddProductRule = () => {
        if (!selectedProductId || inviteRechargeAmount <= 0) {
            alert("Please select a product and enter a valid invite recharge amount");
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        // Check if product already has a rule
        if (rules.productRules.some(r => r.productId === selectedProductId)) {
            alert("This product already has a rule. Remove it first to update.");
            return;
        }

        setRules({
            ...rules,
            productRules: [
                ...rules.productRules,
                {
                    productId: selectedProductId,
                    productName: product.name,
                    inviteRechargeRequired: inviteRechargeAmount
                }
            ]
        });
        setSelectedProductId("");
        setInviteRechargeAmount(0);
    };

    const handleRemoveProductRule = (productId: string) => {
        setRules({
            ...rules,
            productRules: rules.productRules.filter(r => r.productId !== productId)
        });
    };

    const handleSaveRules = async () => {
        try {
            await setDoc(doc(db, "Settings", "withdrawalRules"), rules);
            alert("Withdrawal rules updated successfully!");
        } catch (error) {
            console.error("Error saving rules:", error);
            alert("Failed to save rules");
        }
    };

    const handleAddRestriction = async () => {
        if (!selectedUser || !restrictionReason) {
            alert("Please select a user and provide a reason");
            return;
        }

        try {
            await setDoc(doc(db, "WithdrawalRestrictions", selectedUser), {
                userId: selectedUser,
                isRestricted: true,
                reason: restrictionReason,
                restrictedAt: serverTimestamp()
            });
            setSelectedUser("");
            setRestrictionReason("");
            alert("User restricted successfully!");
        } catch (error) {
            console.error("Error adding restriction:", error);
            alert("Failed to restrict user");
        }
    };

    const handleRemoveRestriction = async (userId: string) => {
        if (!confirm("Remove withdrawal restriction for this user?")) return;

        try {
            await deleteDoc(doc(db, "WithdrawalRestrictions", userId));
            alert("Restriction removed!");
        } catch (error) {
            console.error("Error removing restriction:", error);
            alert("Failed to remove restriction");
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-black mb-8">Withdrawal Rules</h1>

                {/* Global Rules */}
                <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 mb-6">
                    <h2 className="text-xl font-bold mb-6">Global Withdrawal Settings</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                Maximum Withdrawal Percentage (% of Your Recharge)
                            </label>
                            <input
                                type="number"
                                value={rules.maxWithdrawalPercent}
                                onChange={(e) => setRules({ ...rules, maxWithdrawalPercent: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                min="0"
                                max="100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Users can withdraw up to this percentage of their own total recharge without meeting invite requirements</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                Product-Based Invite Requirements
                            </label>

                            {/* Add Product Rule */}
                            <div className="bg-black/20 rounded-xl p-4 space-y-3 mb-4">
                                <h3 className="text-sm font-bold text-white">Add Product Rule</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Select Product</label>
                                        <select
                                            value={selectedProductId}
                                            onChange={(e) => setSelectedProductId(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                                        >
                                            <option value="">Choose a product...</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} - {product.price} ETB
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Invite Recharge Required (ETB)</label>
                                        <input
                                            type="number"
                                            value={inviteRechargeAmount}
                                            onChange={(e) => setInviteRechargeAmount(parseInt(e.target.value) || 0)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
                                            min="0"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddProductRule}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors"
                                    >
                                        Add Product Rule
                                    </button>
                                </div>
                            </div>

                            {/* Product Rules List */}
                            <div className="space-y-3">
                                {rules.productRules.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4 text-sm">No product rules set</p>
                                ) : (
                                    rules.productRules.map((rule) => (
                                        <div key={rule.productId} className="bg-black/20 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-white">{rule.productName}</p>
                                                <p className="text-sm text-gray-400">Invite Recharge Required: {rule.inviteRechargeRequired} ETB</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveProductRule(rule.productId)}
                                                className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-600/30 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Users who purchase these products must meet the invite recharge requirement to unlock unlimited withdrawal</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">
                                Custom Notification Message
                            </label>
                            <textarea
                                value={rules.customMessage}
                                onChange={(e) => setRules({ ...rules, customMessage: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500 mt-1">Message shown to users when withdrawal rules are violated</p>
                        </div>

                        <button
                            onClick={handleSaveRules}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Save Rules
                        </button>
                    </div>
                </div>

                {/* User Restrictions */}
                <div className="bg-[#141414] rounded-2xl border border-white/5 p-6">
                    <h2 className="text-xl font-bold mb-6">User-Specific Restrictions</h2>

                    {/* Add Restriction */}
                    <div className="mb-6 p-4 bg-black/40 rounded-xl">
                        <h3 className="text-sm font-bold text-gray-400 mb-4">Add New Restriction</h3>
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none mb-2"
                                />
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">Select a user</option>
                                    {filteredCustomers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.phoneNumber} - {customer.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Reason for restriction"
                                value={restrictionReason}
                                onChange={(e) => setRestrictionReason(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                            />
                            <button
                                onClick={handleAddRestriction}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                Restrict User
                            </button>
                        </div>
                    </div>

                    {/* Restricted Users List */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-4">Currently Restricted Users</h3>
                        {restrictions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No users are currently restricted</p>
                        ) : (
                            <div className="space-y-3">
                                {restrictions.map(restriction => {
                                    const customer = customers.find(c => c.id === restriction.userId);
                                    return (
                                        <div key={restriction.id} className="bg-black/40 rounded-lg p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-white">{customer?.phoneNumber || 'Unknown'}</p>
                                                <p className="text-sm text-gray-400">{restriction.reason}</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {restriction.restrictedAt?.seconds ? new Date(restriction.restrictedAt.seconds * 1000).toLocaleString() : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveRestriction(restriction.userId)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
