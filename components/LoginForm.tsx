"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/lib/countries";
import Image from "next/image";
import { loginWithPhone } from "@/lib/customerService";
import { translations, Language } from "@/lib/translations";
import { useLanguage } from "@/lib/LanguageContext";

interface LoginFormProps {
}

export default function LoginForm({ }: LoginFormProps) {
    const router = useRouter();
    const { language: lang, setLanguage: onLanguageChange, t } = useLanguage();
    const ethiopia = countries.find(c => c.code === "ET") || countries[0];
    const [selectedCountry, setSelectedCountry] = useState(ethiopia);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(ethiopia.callingCode + " "); // Init with prefix

    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Auto-fill phone code when country is selected
    useEffect(() => {
        if (selectedCountry) {
            setPhoneNumber(selectedCountry.callingCode + " ");
        }
    }, [selectedCountry]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCountryDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        setLoading(true);

        try {
            // Extract raw number by removing prefix
            let rawPhoneNumber = phoneNumber;
            if (selectedCountry) {
                const prefix = selectedCountry.callingCode;
                rawPhoneNumber = rawPhoneNumber.replace(prefix, "").replace(/\s/g, "");
            }

            // const fullPhoneNumber = `${selectedCountry.code} ${phoneNumber}`; // Removed prefix logic
            await loginWithPhone(rawPhoneNumber, password); // Pass raw number

            setTimeout(() => {
                router.push("/welcome");
            }, 1000);
        } catch (err: any) {
            console.error(err);
            setError(t.errors.loginFailed);
            setLoading(false);
        }
    };

    const handlePhoneInput = (value: string) => {
        if (!selectedCountry) return;

        const prefix = selectedCountry.callingCode + " ";

        // Basic enforcement
        if (!value.startsWith(selectedCountry.callingCode)) {
            setPhoneNumber(prefix);
            return;
        }
        setPhoneNumber(value);
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)]">
            <div className="text-center mb-8">
                <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/10 ring-1 ring-white/10">
                    <Image src="/dgs_app_icon.png" alt="Logo" fill className="object-cover scale-110" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                    {t.welcomeBack}
                </h2>
                <p className="text-gray-400 mt-2">{t.signInToAccount}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Phone Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">{t.phoneNumber}</label>
                    <div className="relative flex group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

                        {/* Country Selector */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="relative h-12 flex items-center gap-2 pl-4 pr-3 bg-[#0a0a0a]/50 border border-white/10 rounded-l-xl hover:bg-white/5 transition-colors border-r-0 focus:outline-none"
                            >
                                <div className="relative w-6 h-4 overflow-hidden rounded-sm shadow-sm">
                                    <Image
                                        src={selectedCountry.flag}
                                        alt={selectedCountry.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-gray-300 text-sm font-medium">{selectedCountry.code}</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showCountryDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-72 max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 py-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                                    {countries.map((country) => (
                                        <button
                                            key={country.name}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCountry(country);
                                                setShowCountryDropdown(false);
                                                if (onLanguageChange && country.preferredLanguage) {
                                                    onLanguageChange(country.preferredLanguage);
                                                }
                                            }}
                                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div className="relative w-6 h-4 overflow-hidden rounded-sm flex-shrink-0">
                                                <Image
                                                    src={country.flag}
                                                    alt={country.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <span className="text-gray-300 text-sm flex-1 truncate">{country.name}</span>
                                            <span className="text-gray-500 text-sm font-mono">{country.code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Phone Input Field */}
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => handlePhoneInput(e.target.value)}
                            className="relative flex-1 h-12 bg-[#eef2ff] border border-white/10 border-l-0 rounded-r-xl px-4 text-black placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-bold font-mono"
                            placeholder="912345678"
                            required
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">{t.password}</label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="relative w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            placeholder={t.password}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 shadow-lg shadow-red-500/10 animate-shake">
                        <div className="relative flex items-center justify-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/30">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-red-300 font-medium text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Login Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t.signingIn}</span>
                        </>
                    ) : (
                        <span>{t.signIn}</span>
                    )}
                </button>



            </form>
        </div >
    );
}
