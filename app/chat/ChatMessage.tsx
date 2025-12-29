"use client";

import { useState } from "react";
import { translateText } from "./actions";

interface ChatMessageProps {
    msg: {
        id: string;
        text: string;
        senderId: string;
        timestamp: any;
        type?: string;
    };
    isMe: boolean;
}

export default function ChatMessage({ msg, isMe }: ChatMessageProps) {
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const handleTranslate = async (lang: 'am' | 'om') => {
        setIsLoading(true);
        setShowOptions(false);
        const result = await translateText(msg.text, lang);
        if (result.success && result.translatedText) {
            setTranslatedText(result.translatedText);
        } else {
            // Optional: Show error toast or state
            console.error(result.error);
        }
        setIsLoading(false);
    };

    const toggleOptions = () => {
        if (translatedText) {
            setTranslatedText(null); // Revert to original
        } else {
            setShowOptions(!showOptions);
        }
    };

    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            <div
                onClick={toggleOptions}
                className={`max-w-[80%] rounded-2xl p-4 cursor-pointer transition-all active:scale-95 ${isMe
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg shadow-blue-600/10'
                        : 'bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-bl-none'
                    }`}
            >
                <p className="text-sm font-medium leading-relaxed">
                    {isLoading ? (
                        <span className="animate-pulse">Translating...</span>
                    ) : (
                        translatedText || msg.text
                    )}
                </p>
                <p className={`text-[9px] mt-1 font-bold text-right ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                    {msg.timestamp?.seconds
                        ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '...'}
                    {translatedText && " (Translated)"}
                </p>
            </div>

            {/* Translation Options */}
            {showOptions && !translatedText && (
                <div className={`flex gap-2 mt-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleTranslate('am'); }}
                        className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/5"
                    >
                        Amharic
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleTranslate('om'); }}
                        className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/5"
                    >
                        Oromiffa
                    </button>
                </div>
            )}

            {/* Revert Button (Small hint if needed, though clicking the bubble handles it) */}
        </div>
    );
}
