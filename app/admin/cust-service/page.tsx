"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/adminService";

export default function AdminChatList() {
    const router = useRouter();
    const [chats, setChats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

        // Listen for chats
        const q = query(
            collection(db, "Chats"),
            orderBy("lastMessageTime", "desc")
        );

        const unsubscribeChats = onSnapshot(q, (snapshot) => {
            setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeAuth();
            unsubscribeChats();
        };
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:pl-80">
            <h1 className="text-3xl font-black mb-8">Customer Service</h1>

            <div className="grid gap-4">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        onClick={() => router.push(`/admin/cust-service/${chat.id}`)}
                        className="bg-[#141414] border border-white/5 p-5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg font-bold">
                                {chat.userPhone?.slice(-2) || "??"}
                            </div>
                            <div>
                                <h3 className="font-bold text-base">{chat.userPhone || "Unknown User"}</h3>
                                <p className="text-sm text-gray-400 truncate max-w-[200px] md:max-w-md">
                                    {chat.lastMessage || "No messages yet"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-gray-500 font-bold">
                                {chat.lastMessageTime?.seconds ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {chat.unreadAdmin > 0 && (
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                    {chat.unreadAdmin} new
                                </span>
                            )}
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                ))}

                {chats.length === 0 && (
                    <div className="text-center py-20 bg-[#141414] rounded-3xl border border-white/5">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-gray-500 font-bold">No active conversations</p>
                    </div>
                )}
            </div>
        </div>
    );
}
