"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

export default function AdminChatDetail() {
    const router = useRouter();
    const { id: userId } = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatData, setChatData] = useState<any>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Explicitly cast userId to string to satisfy type checking if it might be string[]
    const targetUserId = Array.isArray(userId) ? userId[0] : userId;

    useEffect(() => {
        const checkAdmin = onAuthStateChanged(auth, async (user: any) => {
            if (user) {
                const isUserAdmin = await isAdmin(user.uid);
                if (!isUserAdmin) router.push("/welcome");
            } else {
                router.push("/admin");
            }
        });

        // Fetch User Info
        const fetchChatInfo = async () => {
            // targetUserId is guaranteed string here
            const docRef = doc(db, "Chats", targetUserId as string);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setChatData(snap.data());
                // Mark as read by admin
                updateDoc(docRef, { unreadAdmin: 0 });
            }
        };
        fetchChatInfo();

        const q = query(
            collection(db, "Chats", targetUserId as string, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => {
            checkAdmin();
            unsubscribe();
        };
    }, [targetUserId, router]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage;
        setNewMessage("");

        try {
            await addDoc(collection(db, "Chats", targetUserId as string, "messages"), {
                text,
                senderId: 'admin', // Special ID for admin
                timestamp: serverTimestamp(),
                type: 'text'
            });

            const chatDocRef = doc(db, "Chats", targetUserId as string);
            await updateDoc(chatDocRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                unreadUser: increment(1)
            });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const toggleMessageSelection = (messageId: string) => {
        const newSelected = new Set(selectedMessages);
        if (newSelected.has(messageId)) {
            newSelected.delete(messageId);
        } else {
            newSelected.add(messageId);
        }
        setSelectedMessages(newSelected);
    };

    const selectAllMessages = () => {
        if (selectedMessages.size === messages.length) {
            setSelectedMessages(new Set());
        } else {
            setSelectedMessages(new Set(messages.map(m => m.id)));
        }
    };

    const deleteSelectedMessages = async () => {
        if (!confirm(`Delete ${selectedMessages.size} message(s)?`)) return;

        try {
            const deletePromises = Array.from(selectedMessages).map(msgId =>
                deleteDoc(doc(db, "Chats", targetUserId as string, "messages", msgId))
            );
            await Promise.all(deletePromises);
            setSelectedMessages(new Set());
            setSelectionMode(false);
        } catch (error) {
            console.error("Error deleting messages:", error);
        }
    };

    const deleteMessage = async (messageId: string) => {
        if (!confirm("Delete this message?")) return;

        try {
            await deleteDoc(doc(db, "Chats", targetUserId as string, "messages", messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col lg:pl-80">
            {/* Header */}
            <div className="bg-[#141414] border-b border-white/5 py-4 px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/cust-service')}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white">{chatData?.userPhone || "User Chat"}</h2>
                        <p className="text-xs text-gray-500 font-mono">{targetUserId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectionMode ? (
                        <>
                            <button
                                onClick={selectAllMessages}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500"
                            >
                                {selectedMessages.size === messages.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button
                                onClick={deleteSelectedMessages}
                                disabled={selectedMessages.size === 0}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-500 disabled:opacity-50"
                            >
                                Delete ({selectedMessages.size})
                            </button>
                            <button
                                onClick={() => {
                                    setSelectionMode(false);
                                    setSelectedMessages(new Set());
                                }}
                                className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-bold hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setSelectionMode(true)}
                            className="px-3 py-2 bg-white/5 text-white rounded-lg text-sm font-bold hover:bg-white/10"
                        >
                            Select Messages
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isAdminMsg = msg.senderId === 'admin';
                    const isSelected = selectedMessages.has(msg.id);
                    return (
                        <div key={msg.id} className={`flex items-start gap-3 ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                            {selectionMode && !isAdminMsg && (
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMessageSelection(msg.id)}
                                    className="mt-2 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                            )}
                            <div className={`max-w-[70%] rounded-2xl p-4 ${isAdminMsg
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#1a1a1a] border border-white/5 text-gray-200'
                                } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${isAdminMsg ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                </p>
                            </div>
                            {!selectionMode && isAdminMsg && (
                                <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="mt-2 p-1 text-red-400 hover:text-red-300 opacity-0 hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            {selectionMode && isAdminMsg && (
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleMessageSelection(msg.id)}
                                    className="mt-2 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                            )}
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="bg-[#141414] border-t border-white/5 p-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Reply to user..."
                        className="flex-1 bg-black/40 text-white border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-6 py-3 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-500 transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
