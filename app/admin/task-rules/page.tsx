"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";

interface WithdrawalRule {
    id: string;
    level: string;
    teamSize: number;
    assets: number;
    monthlySalary: number;
    yearIncome: number;
    minTaskWallet: number;
    icon: string;
    color: string;
}

export default function DailyTaskRulesPage() {
    const [rules, setRules] = useState<WithdrawalRule[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form state
    const [level, setLevel] = useState("");
    const [teamSize, setTeamSize] = useState("");
    const [assets, setAssets] = useState("");
    const [monthlySalary, setMonthlySalary] = useState("");
    const [yearIncome, setYearIncome] = useState("");
    const [minTaskWallet, setMinTaskWallet] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("💎");
    const [selectedColor, setSelectedColor] = useState("blue");
    const [saving, setSaving] = useState(false);

    const icons = ["💎", "👑", "⭐", "🏆", "💰", "🎯", "🔥", "✨"];
    const colors = [
        { name: "blue", class: "from-blue-500 to-blue-600" },
        { name: "purple", class: "from-purple-500 to-purple-600" },
        { name: "pink", class: "from-pink-500 to-pink-600" },
        { name: "green", class: "from-green-500 to-green-600" },
        { name: "orange", class: "from-orange-500 to-orange-600" },
        { name: "red", class: "from-red-500 to-red-600" }
    ];

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const q = query(collection(db, "dailyTaskRules"), orderBy("teamSize", "asc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as WithdrawalRule[];
            setRules(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await addDoc(collection(db, "dailyTaskRules"), {
                level,
                teamSize: parseInt(teamSize),
                assets: parseInt(assets),
                monthlySalary: parseInt(monthlySalary),
                yearIncome: parseInt(yearIncome),
                minTaskWallet: parseInt(minTaskWallet),
                icon: selectedIcon,
                color: selectedColor,
                createdAt: new Date()
            });

            setLevel("");
            setTeamSize("");
            setAssets("");
            setMonthlySalary("");
            setYearIncome("");
            setMinTaskWallet("");
            setShowForm(false);
            fetchRules();
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to add rule");
        } finally {
            setSaving(false);
        }
    };

    const deleteRule = async (id: string) => {
        if (!confirm("Delete this rule?")) return;
        try {
            await deleteDoc(doc(db, "dailyTaskRules", id));
            fetchRules();
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />

            <div className="lg:pl-72 pt-20 lg:pt-6 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Daily Task Withdrawal Rules</h1>
                            <p className="text-gray-600">Set VIP levels & withdrawal requirements</p>
                        </div>
                        <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg">
                            + Add New Level
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border border-gray-200">
                            <h2 className="text-xl font-bold mb-4">Create New VIP Level</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Level Name</label>
                                        <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g., V5, VIP Gold" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Size Required</label>
                                        <input type="number" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="180" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assets Required (Br)</label>
                                        <input type="number" value={assets} onChange={(e) => setAssets(e.target.value)} placeholder="2500000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Task Wallet ($)</label>
                                        <input type="number" value={minTaskWallet} onChange={(e) => setMinTaskWallet(e.target.value)} placeholder="100" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Salary (Br)</label>
                                        <input type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder="40000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">4 Year Income (Br)</label>
                                        <input type="number" value={yearIncome} onChange={(e) => setYearIncome(e.target.value)} placeholder="1920000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Icon</label>
                                    <div className="flex gap-2">
                                        {icons.map((icon: string) => (
                                            <button key={icon} type="button" onClick={() => setSelectedIcon(icon)} className={`w-12 h-12 rounded-xl border-2 text-2xl transition-all ${selectedIcon === icon ? 'border-blue-500 bg-blue-50 scale-110' : 'border-gray-200 hover:border-blue-300'}`}>
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Color</label>
                                    <div className="flex gap-2">
                                        {colors.map((color: any) => (
                                            <button key={color.name} type="button" onClick={() => setSelectedColor(color.name)} className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.class} border-2 transition-all ${selectedColor === color.name ? 'border-gray-900 scale-110' : 'border-transparent'}`} />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">
                                        {saving ? "Creating..." : "Create Level"}
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-gray-500">No withdrawal rules created yet</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rules.map((rule: any) => (
                                <div key={rule.id} className={`bg-gradient-to-br ${colors.find(c => c.name === rule.color)?.class || 'from-blue-500 to-blue-600'} rounded-2xl p-6 text-white shadow-xl`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-4xl">{rule.icon}</div>
                                            <h3 className="text-2xl font-black">{rule.level}</h3>
                                        </div>
                                        <button onClick={() => deleteRule(rule.id)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                        <div>
                                            <p className="text-xs text-white/70 uppercase tracking-wide">Team Size</p>
                                            <p className="text-xl font-bold">{rule.teamSize.toLocaleString()} People</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70 uppercase tracking-wide">Assets</p>
                                            <p className="text-xl font-bold">{rule.assets.toLocaleString()} Br</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70 uppercase tracking-wide">Min Task Wallet</p>
                                            <p className="text-xl font-bold">${rule.minTaskWallet.toLocaleString()}</p>
                                        </div>
                                        <div className="pt-3 border-t border-white/20">
                                            <p className="text-xs text-white/70 uppercase tracking-wide">Monthly Salary</p>
                                            <p className="text-2xl font-black">{rule.monthlySalary.toLocaleString()} Br</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/70 uppercase tracking-wide">4 Year Income</p>
                                            <p className="text-2xl font-black">{rule.yearIncome.toLocaleString()} Br</p>
                                        </div>
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
