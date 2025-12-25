"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

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

interface GameConfig {
    name: string;
    icon: string;
    reward: number;
    active: boolean;
}

export default function TaskRulesPage() {
    const router = useRouter();
    const [rules, setRules] = useState<WithdrawalRule[]>([]);
    const [games, setGames] = useState<Record<string, GameConfig>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rules' | 'games'>('rules');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchData();
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchData = async () => {
        try {
            // Fetch withdrawal rules
            const rulesQuery = query(collection(db, "dailyTaskRules"), orderBy("teamSize", "asc"));
            const rulesSnapshot = await getDocs(rulesQuery);
            const rulesData = rulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WithdrawalRule[];
            setRules(rulesData);

            // Fetch game settings
            const settingsDoc = await getDoc(doc(db, "gameSettings", "daily"));
            if (settingsDoc.exists()) {
                setGames(settingsDoc.data().games || {});
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const gameGuides = {
        spin: "Tap SPIN button → Watch the colorful wheel spin → Win random reward based on where it stops!",
        slot: "Tap PULL LEVER → Watch 3 symbols spin → Match all 3 for BIG WIN or get consolation prize!",
        scratch: "Tap all 9 cards to scratch them → Reveal prizes → Win when all cards are scratched!",
        tap: "Tap START → Tap the button as FAST as you can for 10 seconds → More taps = More money!",
        dice: "Tap ROLL → Watch dice roll → Roll 4, 5, or 6 to win BIG! Roll 1-3 for smaller reward!",
        coin: "Tap FLIP → Watch coin flip → Land on HEADS for full reward, TAILS for smaller reward!",
        memory: "Tap 2 cards → Try to match the same symbols → Match = BIG WIN, No match = Small reward!",
        guess: "Enter a number 1-10 → Tap GUESS → Closer to target = Higher reward!",
        color: "Pick a color (Red/Blue/Green/Yellow) → Match the target color to WIN!",
        balloon: "Pop all 9 balloons by tapping them → Pop them all to win the reward!",
        treasure: "Tap boxes to search for treasure → Find the treasure box to win BIG!",
        card: "Pick 1 of 4 cards → Each card has different reward → Higher cards = More money!",
        emoji: "Tap 2 emoji cards → Match the same emojis → Match = WIN, No match = Small reward!",
        prize: "Tap OPEN BOX → Reveal your mystery prize → Win random reward!"
    };

    const colors: Record<string, string> = {
        blue: "from-blue-500 to-blue-600",
        purple: "from-purple-500 to-purple-600",
        pink: "from-pink-500 to-pink-600",
        green: "from-green-500 to-green-600",
        orange: "from-orange-500 to-orange-600",
        red: "from-red-500 to-red-600"
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 pb-8 sticky top-0 z-10 shadow-2xl">
                <button onClick={() => router.back()} className="mb-4 text-white/90 hover:text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <h1 className="text-4xl font-black mb-2">📚 Task Guide</h1>
                <p className="text-blue-100">Learn how to earn & withdraw</p>

                {/* Tabs */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'rules'
                                ? 'bg-white text-blue-600 shadow-xl'
                                : 'bg-white/20 text-white'
                            }`}
                    >
                        💎 VIP Levels
                    </button>
                    <button
                        onClick={() => setActiveTab('games')}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'games'
                                ? 'bg-white text-purple-600 shadow-xl'
                                : 'bg-white/20 text-white'
                            }`}
                    >
                        🎮 How to Play
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="px-5 mt-6 space-y-5">
                    {activeTab === 'rules' ? (
                        <>
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/20">
                                <h2 className="text-2xl font-black mb-3">💰 Withdrawal Requirements</h2>
                                <p className="text-white/80 leading-relaxed">
                                    To withdraw your Task Income, you must reach one of the VIP levels below. Each level requires specific team size and assets. Once qualified, enjoy monthly salary and long-term income!
                                </p>
                            </div>

                            {rules.length === 0 ? (
                                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border-2 border-white/20">
                                    <p className="text-white/60">No VIP levels available yet</p>
                                </div>
                            ) : (
                                rules.map(rule => (
                                    <div key={rule.id} className={`bg-gradient-to-br ${colors[rule.color] || 'from-blue-500 to-blue-600'} rounded-3xl p-6 shadow-2xl`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="text-5xl">{rule.icon}</div>
                                            <div>
                                                <h3 className="text-3xl font-black">{rule.level}</h3>
                                                <p className="text-white/80 text-sm">VIP Membership</p>
                                            </div>
                                        </div>

                                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 space-y-4">
                                            <div>
                                                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Requirements</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                                        <span className="text-sm">👥 Team Size</span>
                                                        <span className="font-black">{rule.teamSize.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                                        <span className="text-sm">💎 Assets</span>
                                                        <span className="font-black">{rule.assets.toLocaleString()} Br</span>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                                        <span className="text-sm">💰 Min Task Wallet</span>
                                                        <span className="font-black">${rule.minTaskWallet.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/20">
                                                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">Benefits</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                                        <span className="text-sm">📅 Monthly Salary</span>
                                                        <span className="font-black text-yellow-300">{rule.monthlySalary.toLocaleString()} Br</span>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                                                        <span className="text-sm">🏆 4 Year Income</span>
                                                        <span className="font-black text-yellow-300">{rule.yearIncome.toLocaleString()} Br</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/20">
                                <h2 className="text-2xl font-black mb-3">🎮 Game Instructions</h2>
                                <p className="text-white/80 leading-relaxed">
                                    Play any of these fun games once per day to earn rewards! Each game is simple and takes less than a minute. Your earnings go to your Task Wallet automatically!
                                </p>
                            </div>

                            {Object.entries(games).filter(([_, g]) => g.active).map(([key, game]) => (
                                <div key={key} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/20 shadow-xl">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                                            {game.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-black">{game.name}</h3>
                                            <p className="text-yellow-300 font-bold">Reward: ${game.reward}</p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-500/20 border-2 border-blue-400/30 rounded-2xl p-4">
                                        <p className="text-sm font-bold text-blue-100 mb-2">📖 How to Play:</p>
                                        <p className="text-white/90 leading-relaxed">
                                            {gameGuides[key as keyof typeof gameGuides] || "Play the game to win rewards!"}
                                        </p>
                                    </div>

                                    <div className="mt-4 bg-green-500/20 border-2 border-green-400/30 rounded-2xl p-3">
                                        <p className="text-xs text-green-200">
                                            ✓ Play once per day • ✓ Instant rewards • ✓ Auto-added to Task Wallet
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl p-6 text-gray-900 shadow-2xl">
                                <h3 className="text-2xl font-black mb-3">💡 Pro Tips</h3>
                                <ul className="space-y-2 text-sm font-bold">
                                    <li className="flex items-start gap-2">
                                        <span>🎯</span>
                                        <span>Play all games daily to maximize earnings!</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>⏰</span>
                                        <span>Games reset every 24 hours</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>💰</span>
                                        <span>Rewards are added instantly to your Task Wallet</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>🏆</span>
                                        <span>Reach VIP levels to withdraw your earnings!</span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Play Now Button */}
            <div className="fixed bottom-6 left-0 right-0 px-5 z-20">
                <button
                    onClick={() => router.push('/tasks')}
                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                    🎮 Play Games Now!
                </button>
            </div>
        </div>
    );
}
