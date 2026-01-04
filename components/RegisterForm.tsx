"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { countries, Country } from "@/lib/countries";
import { registerCustomer } from "@/lib/customerService";
import { useRouter } from "next/navigation";
import { translations, Language } from "@/lib/translations";
import { useLanguage } from "@/lib/LanguageContext";

interface RegisterFormProps {
    onSuccess?: () => void;
    referralId?: string;
}

export default function RegisterForm({ onSuccess, referralId }: RegisterFormProps) {
    const { language: lang, setLanguage: onLanguageChange, t } = useLanguage();
    // Set Ethiopia as the default country
    const ethiopiaCountry = countries.find(c => c.code === "ET") || null;
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(ethiopiaCountry);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [invitationCode, setInvitationCode] = useState(referralId || "");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // Sync invitation code if prop changes or is populated later
    useEffect(() => {
        if (referralId && !invitationCode) {
            setInvitationCode(referralId);
        }
    }, [referralId]);

    // Auto-fill phone code when country is selected
    useEffect(() => {
        if (selectedCountry) {
            setPhoneNumber(selectedCountry.callingCode + " ");
        }
    }, [selectedCountry]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!selectedCountry) newErrors.country = t.errors.countryRequired;

        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = t.errors.phoneRequired;
        } else if (selectedCountry) {
            const raw = phoneNumber.replace(selectedCountry.callingCode, "").replace(/\s/g, "");
            if (selectedCountry.code === "ET") {
                if (raw && raw[0] !== "9") {
                    newErrors.phoneNumber = "Number must start with 9";
                } else if (raw.length !== 9) {
                    newErrors.phoneNumber = "Number must be exactly 9 digits";
                }
            } else {
                if (raw.length < 7 || raw.length > 15) {
                    newErrors.phoneNumber = "Invalid phone number length";
                }
            }
        }

        if (!password) {
            newErrors.password = t.errors.passwordRequired;
        } else if (password.length < 6) {
            newErrors.password = t.errors.passwordLength;
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = t.errors.passwordMatch;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        return (
            selectedCountry &&
            phoneNumber.trim() &&
            password.length >= 6 &&
            password === confirmPassword &&
            !isLoading
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setErrors({});

        // Universal check for phone number validation on click
        let rawValue = phoneNumber;
        if (selectedCountry) {
            const prefix = selectedCountry.callingCode;
            rawValue = rawValue.replace(prefix, "").replace(/\s/g, "");
        }

        let isPhoneValid = false;
        if (selectedCountry?.code === "ET") {
            isPhoneValid = rawValue.length === 9 && rawValue[0] === "9";
        } else if (selectedCountry) {
            isPhoneValid = rawValue.length >= 7 && rawValue.length <= 15;
        }

        if (!isPhoneValid) {
            setErrors({ form: "Please fill the correct phone number" });
            return;
        }

        if (validateForm()) {
            setIsLoading(true);
            try {
                // Submit form data
                await registerCustomer({
                    country: selectedCountry?.name || "",
                    phoneNumber: rawValue, // Send raw digit-only number
                    email: `${rawValue}@lumio.com`,
                    password,
                }, invitationCode); // Pass invitation code



                // Clear form
                setPassword("");
                setConfirmPassword("");
                setPhoneNumber(""); // Reset to empty

                // Set persistence flag for redirect logic
                localStorage.setItem('dgs_user_persistent', 'true');

                // Slightly delay redirect or callback so user sees the message
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    }
                }, 2000);

            } catch (error: any) {
                console.error("Registration failed:", error);

                // Handle specific constraints errors
                const errorMessage = error.message.toLowerCase();
                const newErrors: Record<string, string> = {};

                if (errorMessage.includes("email")) {
                    newErrors.phoneNumber = "An account with this phone number (or generated email) already exists";
                } else if (errorMessage.includes("phone")) {
                    newErrors.phoneNumber = "This phone number is already registered";
                } else {
                    setErrors({ form: "Registration failed: " + error.message });
                }

                if (Object.keys(newErrors).length > 0) {
                    setErrors(prev => ({ ...prev, ...newErrors }));
                }
            } finally {
                setIsLoading(false);
            }
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

    const inputClasses = (fieldName: string) => `
        w-full h-14 px-4 
        bg-gradient-to-r from-gray-900 to-gray-800
        border-2 rounded-xl
        transition-all duration-300 ease-out
        text-white
        ${focusedField === fieldName
            ? 'border-blue-500 shadow-lg shadow-blue-500/50 scale-[1.02] bg-gray-800 ring-2 ring-blue-400/30'
            : errors[fieldName]
                ? 'border-red-500/70 bg-red-900/20 shadow-lg shadow-red-500/30'
                : 'border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-purple-500/20'
        }
        focus:outline-none focus:ring-0
        placeholder:text-gray-500
    `;

    return (
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)] overflow-hidden">
            <div className="text-center mb-8">
                <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/10 ring-1 ring-white/10">
                    <Image src="/dgs_app_icon.png" alt="Logo" fill className="object-cover scale-110" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                    {t.createAccount}
                </h2>
                <p className="text-gray-400 mt-2">{t.joinUs}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-7">
                {/* Country Selector */}
                <div className="space-y-2 animate-fade-in">
                    <label className="flex items-center gap-2 text-sm font-semibold text-blue-400 ml-1">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t.country}
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`
                            w-full h-14 px-4 
                            bg-gradient-to-r from-gray-900 to-gray-800
                            border-2 rounded-xl
                            flex items-center justify-between
                            transition-all duration-300
                            ${isDropdownOpen
                                    ? 'border-blue-500 shadow-lg shadow-blue-500/50 scale-[1.02] ring-2 ring-blue-400/30'
                                    : 'border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-purple-500/20'
                                }
                            focus:outline-none
                        `}
                        >
                            {selectedCountry ? (
                                <div className="flex items-center gap-3 animate-slide-in">
                                    <div className="w-8 h-6 rounded overflow-hidden shadow-lg ring-2 ring-blue-400/50">
                                        <Image
                                            src={selectedCountry.flag}
                                            alt={selectedCountry.name}
                                            width={32}
                                            height={24}
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="text-white font-medium">{selectedCountry.name}</span>
                                </div>
                            ) : (
                                <span className="text-gray-500">{t.selectCountry}</span>
                            )}
                            <svg
                                className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute z-20 w-full mt-2 bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-blue-500/50 rounded-2xl shadow-2xl shadow-blue-500/30 max-h-64 overflow-y-auto backdrop-blur-sm">
                                {countries.map((country, index) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCountry(country);
                                            setIsDropdownOpen(false);
                                            if (onLanguageChange && country.preferredLanguage) {
                                                onLanguageChange(country.preferredLanguage);
                                            }
                                            setErrors({ ...errors, country: "" });
                                        }}
                                        className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 transition-all duration-200 text-left border-b border-gray-700/50 last:border-0 group"
                                    >
                                        <div className="w-8 h-6 rounded overflow-hidden shadow-md ring-2 ring-transparent group-hover:ring-blue-400/70 transition-all">
                                            <Image
                                                src={country.flag}
                                                alt={country.name}
                                                width={32}
                                                height={24}
                                                className="object-cover"
                                            />
                                        </div>
                                        <span className="text-gray-300 group-hover:text-blue-300 font-medium transition-colors">{country.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {errors.country && (
                        <p className="text-sm text-red-400 ml-1 flex items-center gap-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.country}
                        </p>
                    )}
                </div>



                {/* Phone Number */}
                {selectedCountry && (
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-green-400 ml-1">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {t.phoneNumber}
                        </label>
                        <div className="flex group w-full">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="relative h-14 flex items-center gap-3 pl-4 pr-3 bg-gray-900 border-2 border-gray-700 rounded-l-xl hover:border-gray-600 transition-all border-r-0 focus:outline-none"
                                >
                                    <div className="w-8 h-6 rounded overflow-hidden shadow-lg ring-2 ring-blue-400/50">
                                        <Image
                                            src={selectedCountry.flag}
                                            alt={selectedCountry.name}
                                            width={32}
                                            height={24}
                                            className="object-cover"
                                        />
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                    handlePhoneInput(e.target.value);
                                    setErrors({ ...errors, phoneNumber: "" });
                                }}
                                onFocus={() => setFocusedField('phoneNumber')}
                                onBlur={() => setFocusedField(null)}
                                className="flex-1 w-full min-w-0 h-14 px-4 bg-[#0a0a0a] border-2 border-gray-700 border-l-0 rounded-r-xl text-white placeholder-gray-500 focus:outline-none transition-all font-bold font-mono"
                                placeholder="912345678"
                            />
                        </div>
                        {errors.phoneNumber && (
                            <p className="text-sm text-red-400 ml-1 flex items-center gap-1 animate-pulse">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.phoneNumber}
                            </p>
                        )}
                    </div>
                )}



                {/* Password */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-orange-400 ml-1">
                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {t.password}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors({ ...errors, password: "" });
                            }}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={t.password}
                            className={`${inputClasses('password')} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-all duration-200 hover:scale-110"
                        >
                            {showPassword ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-sm text-red-400 ml-1 flex items-center gap-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.password}
                        </p>
                    )}
                </div>



                {/* Confirm Password */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-red-400 ml-1">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {t.confirmPassword}
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErrors({ ...errors, confirmPassword: "" });
                            }}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={t.confirmPassword}
                            className={`${inputClasses('confirmPassword')} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-all duration-200 hover:scale-110"
                        >
                            {showConfirmPassword ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-sm text-red-400 ml-1 flex items-center gap-1 animate-pulse">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                {/* Invitation Code */}
                <div className="space-y-2 animate-slide-up">
                    <label className="flex items-center gap-2 text-sm font-semibold text-yellow-500 ml-1">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        {t.dashboard.invitationCodeLabel || "Invitation Code"}
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={invitationCode}
                            onChange={(e) => setInvitationCode(e.target.value)}
                            onFocus={() => setFocusedField('invitationCode')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={t.dashboard.enterInvitationCode || "Enter code (Optional)"}
                            className={`
                                ${inputClasses('invitationCode')}
                                border-yellow-500/30 hover:border-yellow-500/50
                                ${focusedField === 'invitationCode' ? 'border-yellow-500 shadow-yellow-500/50' : ''}
                            `}
                        />
                        {referralId && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-yellow-500 uppercase tracking-widest animate-pulse">
                                Auto-Applied
                            </div>
                        )}
                    </div>
                </div>

                {/* Register Button and Msgs */}
                <div className="space-y-4">
                    {/* General Form Error */}
                    {errors.form && (
                        <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 shadow-lg shadow-red-500/10 animate-shake">
                            <div className="relative flex items-center justify-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/30">
                                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p className="text-red-300 font-medium text-sm">{errors.form}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!isFormValid()}
                        className={`
                    relative w-full h-14 rounded-xl font-bold text-lg
                    overflow-hidden
                    transition-all duration-300
                    ${isFormValid()
                                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 active:scale-95 hover:scale-[1.02]'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }
                `}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t.registering}
                                </>
                            ) : (
                                <>
                                    {t.register}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </span>
                        {isFormValid() && !isLoading && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-30 transition-opacity duration-300 animate-pulse"></div>
                        )}
                    </button>


                </div>
            </form >
        </div >
    );
}
