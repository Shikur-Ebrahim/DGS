"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc, updateDoc, increment } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image";

export default function ChatPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Initialize chat document if needed and fix unread count
                const chatDocRef = doc(db, "Chats", currentUser.uid);
                setDoc(chatDocRef, {
                    userId: currentUser.uid,
                    userPhone: currentUser.phoneNumber || "Unknown",
                    lastSeen: serverTimestamp()
                }, { merge: true });

                // Reset user unread count
                updateDoc(chatDocRef, { unreadUser: 0 });
            } else {
                router.push("/welcome");
            }
            setIsLoading(false);
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "Chats", user.uid, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            // Auto scroll
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const text = newMessage;
        setNewMessage("");

        try {
            // Add message to subcollection
            await addDoc(collection(db, "Chats", user.uid, "messages"), {
                text,
                senderId: user.uid,
                timestamp: serverTimestamp(),
                type: 'text'
            });

            // Update main chat document for admin list
            const chatDocRef = doc(db, "Chats", user.uid);
            await updateDoc(chatDocRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                unreadAdmin: increment(1)
            });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 py-4 px-4 flex items-center gap-4">
                <button
                    onClick={() => router.push('/service')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                            <Image src="/dgs_app_icon.png" alt="Support" width={40} height={40} className="object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></div>
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white leading-tight">Official Company</h2>
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online 24/7</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                {/* Welcome Message */}
                <div className="flex justify-center py-6">
                    <div className="bg-white/5 rounded-2xl p-4 text-center max-w-xs border border-white/5">
                        <p className="text-xs text-gray-400 font-bold">Today</p>
                        <p className="text-sm text-gray-200 mt-1">Welcome to DGS Premium Support. How can we help you maximize your earnings today?</p>
                    </div>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${isMe
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg shadow-blue-600/10'
                                : 'bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-bl-none'
                                }`}>
                                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                <p className={`text-[9px] mt-1 font-bold text-right ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/5 p-4 z-40 pb-safe">
                <form onSubmit={handleSend} className="relative max-w-2xl mx-auto flex items-center gap-3">
                    <button type="button" className="p-3 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-[#1a1a1a] text-white border-0 rounded-full px-6 py-4 focus:ring-2 focus:ring-blue-500/50 font-medium placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg shadow-blue-600/20"
                    >
                        <svg className="w-6 h-6 transform rotate-45 -ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}
