"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useLanguage } from "@/lib/LanguageContext";

interface GameConfig { name: string; icon: string; reward: number; active: boolean; }

export default function DailyGamesPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [userId, setUserId] = useState<string | null>(null);
    const [games, setGames] = useState<Record<string, GameConfig>>({});
    const [playedGames, setPlayedGames] = useState<Set<string>>(new Set());
    const [totalEarned, setTotalEarned] = useState(0);
    const [wonAmount, setWonAmount] = useState<number | null>(null);

    // Game states
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [slotting, setSlotting] = useState(false);
    const [slots, setSlots] = useState(['🍒', '🍋', '🍊']);
    const [scratched, setScratched] = useState<number[]>([]);
    const [tapping, setTapping] = useState(false);
    const [tapCount, setTapCount] = useState(0);
    const [diceRolling, setDiceRolling] = useState(false);
    const [diceValue, setDiceValue] = useState(1);
    const [coinFlipping, setCoinFlipping] = useState(false);
    const [coinSide, setCoinSide] = useState('heads');
    const [memoryCards, setMemoryCards] = useState<number[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]);
    const [guessNumber, setGuessNumber] = useState('');
    const [colorTarget, setColorTarget] = useState('');
    const [colorSelected, setColorSelected] = useState('');
    const [balloons, setBalloons] = useState<boolean[]>(Array(9).fill(true));
    const [treasureRevealed, setTreasureRevealed] = useState<number[]>([]);
    const [selectedCard, setSelectedCard] = useState<number | null>(null);
    const [emojiPairs, setEmojiPairs] = useState<string[]>([]);
    const [emojiFlipped, setEmojiFlipped] = useState<number[]>([]);
    const [prizeBoxOpened, setPrizeBoxOpened] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: any) => {
            if (user) {
                setUserId(user.uid);
                fetchGames(user.uid);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchGames = async (uid: string) => {
        try {
            const settingsDoc = await getDoc(doc(db, "gameSettings", "daily"));
            if (settingsDoc.exists()) {
                setGames(settingsDoc.data().games || {});
            }

            const today = new Date().toISOString().split('T')[0];
            const played = new Set<string>();
            let earned = 0;

            const allGames = ['spin', 'slot', 'scratch', 'tap', 'dice', 'coin', 'memory', 'guess', 'color', 'balloon', 'treasure', 'card', 'emoji', 'prize'];
            for (const game of allGames) {
                const gameDoc = await getDoc(doc(db, "userGameProgress", `${uid}_${game}_${today}`));
                if (gameDoc.exists()) {
                    played.add(game);
                    earned += gameDoc.data().reward || 0;
                }
            }
            setPlayedGames(played);
            setTotalEarned(earned);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const saveReward = async (game: string, reward: number) => {
        if (!userId) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            await setDoc(doc(db, "userGameProgress", `${userId}_${game}_${today}`), {
                userId, game, reward, playedAt: serverTimestamp(), date: today
            });
            await updateDoc(doc(db, "Customers", userId), { taskWallet: increment(reward) });
            setPlayedGames(prev => new Set(prev).add(game));
            setTotalEarned(prev => prev + reward);
            setWonAmount(reward);
            setTimeout(() => setWonAmount(null), 3000);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const playSpin = async () => {
        if (playedGames.has('spin') || spinning) return;
        setSpinning(true);
        setRotation(r => r + 360 * 6 + Math.random() * 360);
        setTimeout(async () => {
            const reward = Math.floor(games.spin.reward * (0.5 + Math.random()));
            await saveReward('spin', reward);
            setSpinning(false);
        }, 3000);
    };

    const playSlot = async () => {
        if (playedGames.has('slot') || slotting) return;
        setSlotting(true);
        const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐'];
        let spins = 0;
        const interval = setInterval(() => {
            setSlots([symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)], symbols[Math.floor(Math.random() * symbols.length)]]);
            if (++spins >= 20) {
                clearInterval(interval);
                const allSame = slots[0] === slots[1] && slots[1] === slots[2];
                saveReward('slot', allSame ? games.slot.reward * 2 : Math.floor(games.slot.reward * 0.5));
                setSlotting(false);
            }
        }, 100);
    };

    const playScratch = async (i: number) => {
        if (playedGames.has('scratch') || scratched.includes(i)) return;
        const newScratched = [...scratched, i];
        setScratched(newScratched);
        if (newScratched.length === 9) {
            await saveReward('scratch', Math.floor(games.scratch.reward * (0.8 + Math.random() * 0.4)));
        }
    };

    const startTap = () => {
        if (playedGames.has('tap') || tapping) return;
        setTapping(true);
        setTapCount(0);
        setTimeout(async () => {
            await saveReward('tap', Math.floor(tapCount * (games.tap.reward / 50)));
            setTapping(false);
        }, 10000);
    };

    const playDice = async () => {
        if (playedGames.has('dice') || diceRolling) return;
        setDiceRolling(true);
        let rolls = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            if (++rolls >= 10) {
                clearInterval(interval);
                saveReward('dice', diceValue >= 4 ? games.dice.reward : Math.floor(games.dice.reward * 0.5));
                setDiceRolling(false);
            }
        }, 100);
    };

    const playCoin = async () => {
        if (playedGames.has('coin') || coinFlipping) return;
        setCoinFlipping(true);
        let flips = 0;
        const interval = setInterval(() => {
            setCoinSide(Math.random() > 0.5 ? 'heads' : 'tails');
            if (++flips >= 10) {
                clearInterval(interval);
                saveReward('coin', coinSide === 'heads' ? games.coin.reward : Math.floor(games.coin.reward * 0.7));
                setCoinFlipping(false);
            }
        }, 100);
    };

    const playMemory = async (i: number) => {
        if (playedGames.has('memory') || flipped.length >= 2) return;
        const newFlipped = [...flipped, i];
        setFlipped(newFlipped);
        if (newFlipped.length === 2) {
            setTimeout(async () => {
                const match = memoryCards[newFlipped[0]] === memoryCards[newFlipped[1]];
                await saveReward('memory', match ? games.memory.reward : Math.floor(games.memory.reward * 0.5));
                setFlipped([]);
            }, 1000);
        }
    };

    const playGuess = async () => {
        if (playedGames.has('guess')) return;
        const target = Math.floor(Math.random() * 10) + 1;
        const guess = parseInt(guessNumber);
        const diff = Math.abs(target - guess);
        await saveReward('guess', diff === 0 ? games.guess.reward : Math.floor(games.guess.reward * (1 - diff / 10)));
    };

    const playColor = async (color: string) => {
        if (playedGames.has('color')) return;
        setColorSelected(color);
        const colors = ['red', 'blue', 'green', 'yellow'];
        const target = colors[Math.floor(Math.random() * colors.length)];
        setColorTarget(target);
        await saveReward('color', color === target ? games.color.reward : Math.floor(games.color.reward * 0.3));
    };

    const playBalloon = async (i: number) => {
        if (playedGames.has('balloon') || !balloons[i]) return;
        const newBalloons = [...balloons];
        newBalloons[i] = false;
        setBalloons(newBalloons);
        const popped = newBalloons.filter((b: boolean) => !b).length;
        if (popped === 9) {
            await saveReward('balloon', games.balloon.reward);
        }
    };

    const playTreasure = async (i: number) => {
        if (playedGames.has('treasure') || treasureRevealed.includes(i)) return;
        const newRevealed = [...treasureRevealed, i];
        setTreasureRevealed(newRevealed);
        if (i === 4) {
            await saveReward('treasure', games.treasure.reward);
        } else if (newRevealed.length === 9) {
            await saveReward('treasure', Math.floor(games.treasure.reward * 0.5));
        }
    };

    const playCard = async (i: number) => {
        if (playedGames.has('card')) return;
        setSelectedCard(i);
        const values = [5, 10, 15, 20];
        await saveReward('card', values[i]);
    };

    const playEmoji = async (i: number) => {
        if (playedGames.has('emoji') || emojiFlipped.length >= 2) return;
        const newFlipped = [...emojiFlipped, i];
        setEmojiFlipped(newFlipped);
        if (newFlipped.length === 2) {
            setTimeout(async () => {
                const match = emojiPairs[newFlipped[0]] === emojiPairs[newFlipped[1]];
                await saveReward('emoji', match ? games.emoji.reward : Math.floor(games.emoji.reward * 0.4));
                setEmojiFlipped([]);
            }, 1000);
        }
    };

    const playPrize = async () => {
        if (playedGames.has('prize')) return;
        setPrizeBoxOpened(true);
        const reward = Math.floor(games.prize.reward * (0.7 + Math.random() * 0.6));
        await saveReward('prize', reward);
    };

    const activeGames = Object.entries(games).filter(([_, g]: [string, any]) => g.active);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 text-white pb-24 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="relative z-10 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 p-6 pb-12 rounded-b-[3rem]">
                <button onClick={() => router.back()} className="mb-4 text-white/90 hover:text-white flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t.dashboard.back}
                </button>
                <h1 className="text-5xl font-black mb-2">🎮 {t.dashboard.dailyGames}</h1>
                <p className="text-orange-100 text-lg">{activeGames.length} {t.dashboard.gamesAvailable}</p>
                <div className="mt-6 bg-white/20 backdrop-blur-xl rounded-3xl p-6 border-2 border-white/30">
                    <p className="text-xs text-white/70 uppercase mb-2">{t.dashboard.todaysWinnings}</p>
                    <p className="text-5xl font-black text-yellow-300">${totalEarned}</p>
                    <p className="text-sm text-white/60 mt-2">{playedGames.size}/{activeGames.length} {t.dashboard.gamesPlayed}</p>
                </div>
            </div>

            {wonAmount !== null && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-12 py-8 rounded-3xl font-black text-4xl shadow-2xl animate-bounce">
                        +${wonAmount} 🎉
                    </div>
                </div>
            )}

            <div className="relative z-10 px-5 -mt-6 space-y-4">
                {activeGames.map(([key, game]: [string, any]) => {
                    const played = playedGames.has(key);

                    return (
                        <div key={key} className={`bg-white/10 backdrop-blur-xl rounded-3xl p-6 border-2 ${played ? 'border-green-400/50 opacity-60' : 'border-white/30'} shadow-2xl`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{game.icon}</span>
                                    <div>
                                        <h2 className="text-2xl font-black">{game.name}</h2>
                                        <p className="text-sm text-white/70">{t.dashboard.winUpTo} ${game.reward}</p>
                                    </div>
                                </div>
                                {played && <span className="px-4 py-2 bg-green-500 rounded-full text-sm font-bold">✓ {t.dashboard.done}</span>}
                            </div>

                            {/* Game UI based on type */}
                            {key === 'spin' && (
                                <div className="flex flex-col items-center">
                                    <div className="relative w-40 h-40 mb-4">
                                        <div className="w-full h-full rounded-full border-8 border-yellow-400 transition-transform duration-3000 ease-out" style={{ transform: `rotate(${rotation}deg)`, background: 'conic-gradient(from 0deg, #ef4444 0deg 60deg, #f59e0b 60deg 120deg, #10b981 120deg 180deg, #3b82f6 180deg 240deg, #8b5cf6 240deg 300deg, #ec4899 300deg 360deg)' }}>
                                            <div className="absolute inset-0 flex items-center justify-center text-3xl">💎</div>
                                        </div>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-3xl">▼</div>
                                    </div>
                                    <button onClick={playSpin} disabled={played || spinning} className={`px-8 py-3 rounded-2xl font-bold ${played || spinning ? 'bg-gray-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:scale-105'}`}>
                                        {spinning ? t.dashboard.spinning : played ? t.dashboard.played : t.dashboard.spinBtn}
                                    </button>
                                </div>
                            )}

                            {key === 'slot' && (
                                <div className="flex flex-col items-center">
                                    <div className="flex gap-2 mb-4">
                                        {slots.map((s: string, i: number) => <div key={i} className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-3xl">{s}</div>)}
                                    </div>
                                    <button onClick={playSlot} disabled={played || slotting} className={`px-8 py-3 rounded-2xl font-bold ${played || slotting ? 'bg-gray-500' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105'}`}>
                                        {slotting ? t.dashboard.spinning : played ? t.dashboard.played : t.dashboard.pullBtn}
                                    </button>
                                </div>
                            )}

                            {key === 'scratch' && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i: number) => (
                                        <button key={i} onClick={() => playScratch(i)} disabled={played || scratched.includes(i)} className={`aspect-square rounded-xl text-2xl ${scratched.includes(i) ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900' : 'bg-gray-700 hover:scale-105'}`}>
                                            {scratched.includes(i) ? '💰' : '?'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {key === 'tap' && (
                                <div className="flex flex-col items-center">
                                    {tapping && <p className="text-5xl font-black text-yellow-300 mb-4">{tapCount}</p>}
                                    {!tapping ? (
                                        <button onClick={startTap} disabled={played} className={`px-8 py-3 rounded-2xl font-bold ${played ? 'bg-gray-500' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105'}`}>
                                            {played ? t.dashboard.played : t.dashboard.startBtn}
                                        </button>
                                    ) : (
                                        <button onClick={() => setTapCount(c => c + 1)} className="w-40 h-40 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 font-black text-2xl active:scale-95">{t.dashboard.tapBtn}</button>
                                    )}
                                </div>
                            )}

                            {key === 'dice' && (
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-5xl font-black text-gray-900 mb-4">{diceValue}</div>
                                    <button onClick={playDice} disabled={played || diceRolling} className={`px-8 py-3 rounded-2xl font-bold ${played || diceRolling ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-105'}`}>
                                        {diceRolling ? t.dashboard.rolling : played ? t.dashboard.played : t.dashboard.rollBtn}
                                    </button>
                                </div>
                            )}

                            {key === 'coin' && (
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl font-black mb-4">{coinSide === 'heads' ? '👑' : '💰'}</div>
                                    <button onClick={playCoin} disabled={played || coinFlipping} className={`px-8 py-3 rounded-2xl font-bold ${played || coinFlipping ? 'bg-gray-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105'}`}>
                                        {coinFlipping ? t.dashboard.flipping : played ? t.dashboard.played : t.dashboard.flipBtn}
                                    </button>
                                </div>
                            )}

                            {/* Add simple UI for remaining games */}
                            {!['spin', 'slot', 'scratch', 'tap', 'dice', 'coin'].includes(key) && (
                                <div className="text-center">
                                    <button onClick={() => {
                                        if (key === 'prize') playPrize();
                                    }} disabled={played} className={`px-8 py-3 rounded-2xl font-bold ${played ? 'bg-gray-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-105'}`}>
                                        {played ? t.dashboard.played : t.dashboard.playBtn}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
