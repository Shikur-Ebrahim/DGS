"use client";

import { useState, useRef, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import RegisterForm from "@/components/RegisterForm";
import LoginForm from "@/components/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { translations, Language, languageNames } from "@/lib/translations";
import { Suspense } from "react";

function HomeContent() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const { language: currentLanguage, setLanguage: setCurrentLanguage, t } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is already logged in or has persistent session
  useEffect(() => {
    // 1. Instant check for persistent flag
    const isPersistent = localStorage.getItem('dgs_user_persistent') === 'true';
    if (isPersistent) {
      router.replace("/welcome");
      return;
    }

    // 2. Secondary check via Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        localStorage.setItem('dgs_user_persistent', 'true');
        router.replace("/welcome");
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Persist referral ID in localStorage so it survives if the user installs the app or reopens the browser
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("dgs_referral_id", ref);
    }
  }, [searchParams]);

  const referralId = searchParams.get("ref") || (typeof window !== "undefined" ? localStorage.getItem("dgs_referral_id") : undefined) || undefined;

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-32 h-32 mb-8 animate-pulse">
          <Image src="/dgs_app_icon.png" alt="DGS" fill className="object-contain opacity-50 gray-scale" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-6 animate-pulse">Establishing Secure Session</p>
      </div>
    );
  }

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
        <div
          className="hover:scale-110 transition-transform duration-500 cursor-pointer group flex items-center"
          onClick={() => {
            const newCount = adminClickCount + 1;
            if (newCount >= 5) {
              router.push("/admin");
              setAdminClickCount(0);
            } else {
              setAdminClickCount(newCount);
            }
          }}
        >
          <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-500">
            <Image
              src="/dgs_app_icon.png"
              alt="DGS PRO"
              fill
              className="object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
            />
          </div>
          <div className="ml-4 flex flex-col">
            <span className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">DGS</span>
            <span className="text-[10px] md:text-xs font-black tracking-[0.3em] text-blue-400 uppercase opacity-60">Investment</span>
          </div>
        </div>

        {/* Premium Language Selector - Far Right */}
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#d1d5db] rounded-[8px] text-[#4b5563] hover:bg-gray-50 transition-all duration-200 shadow-sm"
          >
            <svg className="w-5 h-5 text-[#6b7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="text-[15px] font-medium">{languageNames[currentLanguage].name}</span>
            <svg className={`w-4 h-4 text-[#6b7280] transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-[#e5e7eb] rounded-[8px] shadow-lg z-[60] overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setCurrentLanguage(lang);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full px-4 py-2 flex items-center justify-between transition-colors duration-150 ${currentLanguage === lang
                      ? 'bg-[#f3f4f6] text-[#111827] font-semibold'
                      : 'text-[#4b5563] hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-[14px]">{languageNames[lang].name}</span>
                    {currentLanguage === lang && (
                      <svg className="w-4 h-4 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
                <LoginForm />
              </div>
            ) : (
              <div className="animate-fade-in">
                <RegisterForm
                  onSuccess={() => setActiveTab("login")}
                  referralId={referralId}
                />
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
