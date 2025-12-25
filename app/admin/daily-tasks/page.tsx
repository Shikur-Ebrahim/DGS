"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminSidebar from "@/components/AdminSidebar";

interface GameConfig {
    name: string;
    icon: string;
    reward: number;
    active: boolean;
}

export default function AdminGameSettingsPage() {
    const [games, setGames] = useState<Record<string, GameConfig>>({
        spin: { name: "Lucky Wheel", icon: "🎡", reward: 10, active: true },
        slot: { name: "Slot Machine", icon: "🎰", reward: 15, active: true },
        scratch: { name: "Scratch Card", icon: "🎫", reward: 8, active: true },
        tap: { name: "Tap Challenge", icon: "👆", reward: 5, active: true },
        dice: { name: "Dice Roll", icon: "🎲", reward: 7, active: true },
        coin: { name: "Coin Flip", icon: "🪙", reward: 6, active: true },
        memory: { name: "Memory Match", icon: "🧠", reward: 12, active: true },
        guess: { name: "Number Guess", icon: "🔢", reward: 9, active: true },
        color: { name: "Color Match", icon: "🎨", reward: 8, active: true },
        balloon: { name: "Balloon Pop", icon: "🎈", reward: 7, active: true },
        treasure: { name: "Treasure Hunt", icon: "🗺️", reward: 11, active: true },
        card: { name: "Card Pick", icon: "🃏", reward: 8, active: true },
        emoji: { name: "Emoji Match", icon: "😊", reward: 7, active: true },
        prize: { name: "Prize Box", icon: "🎁", reward: 10, active: true }
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, "gameSettings", "daily"));
            if (settingsDoc.exists()) {
                setGames(settingsDoc.data().games || games);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "gameSettings", "daily"), {
                games,
                updatedAt: new Date()
            });
            alert("Settings saved!");
        } catch (error) {
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const updateGame = (key: string, field: 'reward' | 'active', value: any) => {
        setGames(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar />

            <div className="lg:pl-72 pt-20 lg:pt-6 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Daily Games Settings</h1>
                            <p className="text-gray-600">Manage 14 different games</p>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50">
                            {saving ? "Saving..." : "Save All"}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(games).map(([key, game]) => (
                            <div key={key} className={`bg-white rounded-2xl p-5 shadow-lg border-2 transition-all ${game.active ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl">{game.icon}</span>
                                        <h3 className="font-bold text-gray-900">{game.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => updateGame(key, 'active', !game.active)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${game.active ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                                            }`}
                                    >
                                        {game.active ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reward ($)</label>
                                    <input
                                        type="number"
                                        value={game.reward}
                                        onChange={(e) => updateGame(key, 'reward', parseInt(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                        <h3 className="font-bold text-blue-900 mb-2">💡 Quick Stats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-xs text-gray-600">Active Games</p>
                                <p className="text-2xl font-black text-green-600">{Object.values(games).filter(g => g.active).length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-xs text-gray-600">Total Games</p>
                                <p className="text-2xl font-black text-blue-600">{Object.keys(games).length}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-xs text-gray-600">Avg Reward</p>
                                <p className="text-2xl font-black text-purple-600">${Math.round(Object.values(games).reduce((a, b) => a + b.reward, 0) / Object.keys(games).length)}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3">
                                <p className="text-xs text-gray-600">Max Daily</p>
                                <p className="text-2xl font-black text-orange-600">${Object.values(games).filter(g => g.active).reduce((a, b) => a + b.reward, 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
