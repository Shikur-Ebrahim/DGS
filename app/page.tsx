"use client";

import { useState, useRef, useEffect } from "react";
import RegisterForm from "@/components/RegisterForm";
import LoginForm from "@/components/LoginForm";
import Image from "next/image";
import { translations, Language, languageNames } from "@/lib/translations";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const t = translations[currentLanguage];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] p-6 md:p-8 overflow-x-hidden">

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* TOP HEADER: Logo Left / Selector Right */}
      <div className="relative z-50 flex items-center justify-between gap-6 mb-8 md:mb-12 animate-fade-in-down w-full max-w-7xl mx-auto px-4 md:px-8">
        {/* Logo - Bold & Large */}
        <div className="hover:scale-110 transition-transform duration-500 cursor-pointer group">
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-orange-500 via-yellow-400 via-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:drop-shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all animate-movable">
            Lumio
          </h1>
        </div>

        {/* Premium Language Selector - Far Right */}
        <div className="relative group pill-container" ref={langDropdownRef}>
          {/* Outer glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1a1a1a]/80 border border-white/10 text-gray-300 hover:text-white transition-all duration-300 backdrop-blur-xl shadow-2xl overflow-hidden group/btn"
          >
            {/* Hover sweep effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out"></div>

            <span className="text-xl leading-none">{languageNames[currentLanguage].flag}</span>
            <span className="text-sm font-semibold tracking-wide uppercase">{languageNames[currentLanguage].name}</span>
            <svg className={`w-4 h-4 text-purple-400 transition-transform duration-500 ease-out ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-3 w-64 p-2 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] animate-tab-switch overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto scrollbar-none">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setCurrentLanguage(lang);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full px-4 py-3.5 flex items-center gap-4 rounded-2xl transition-all duration-300 group/item relative overflow-hidden ${currentLanguage === lang
                      ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {/* Active indicator bar */}
                    {currentLanguage === lang && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full animate-pulse-slow"></div>
                    )}

                    <span className="text-2xl group-hover/item:scale-125 transition-transform duration-300">{languageNames[lang].flag}</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold tracking-tight">{languageNames[lang].name}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest group-hover/item:text-gray-300 transition-colors">
                        {lang === 'en' ? 'Default' : 'Localized'}
                      </span>
                    </div>

                    {currentLanguage === lang && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center">

        <h1 className="text-3xl md:text-5xl font-bold text-center bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
          {t.welcome}
        </h1>
        <p className="text-gray-400 text-center mb-8 md:mb-12 max-w-2xl text-base md:text-lg px-4">
          {t.subtitle}
        </p>

        {/* UNIFIED VIEW: Tabbed Interface for all devices */}
        <div className="w-full max-w-md mb-8 animate-fade-in">
          <div className="flex bg-[#1a1a1a]/80 backdrop-blur-xl rounded-full p-1 border border-white/10 mb-6 relative">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out shadow-lg shadow-purple-500/25 ${activeTab === "register" ? "left-1" : "left-[calc(50%+4px)]"}`}
            ></div>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 relative z-10 py-3 text-sm font-bold tracking-wide uppercase transition-colors duration-300 ${activeTab === "register" ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
              {t.registerBtn}
            </button>
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 relative z-10 py-3 text-sm font-bold tracking-wide uppercase transition-colors duration-300 ${activeTab === "login" ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
              {t.loginBtn}
            </button>
          </div>

          <div className="relative">
            {activeTab === "login" ? (
              <div className="animate-fade-in">
                <LoginForm lang={currentLanguage} onLanguageChange={setCurrentLanguage} />
              </div>
            ) : (
              <div className="animate-fade-in">
                <RegisterForm
                  lang={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  onSuccess={() => setActiveTab("login")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
