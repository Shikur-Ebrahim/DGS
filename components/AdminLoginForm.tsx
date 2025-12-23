"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { isAdmin, ensureAdminRecord } from "@/lib/adminService";

export default function AdminLoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Admin Credentials provided by user
    const ADMIN_EMAIL = "lumio3828@gmail.com";
    const ADMIN_PHONE = "0938287788";
    const ADMIN_PASSWORD = "LumioNewEra3828";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Security Check: Only allow the specific admin credentials to even attempt login here
        if (email !== ADMIN_EMAIL || phoneNumber !== ADMIN_PHONE || password !== ADMIN_PASSWORD) {
            setError("Invalid Admin Credentials");
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Ensure the admin record exists in the Admins collection
            await ensureAdminRecord(user.uid, email, phoneNumber);

            // Double check if they are in the Admins collection (redundant but safe)
            const isUserAdmin = await isAdmin(user.uid);

            if (isUserAdmin) {
                router.push("/admin/welcome");
            } else {
                setError("Access Denied: Not an Administrator");
            }
        } catch (err: any) {
            console.error(err);
            setError("Login Failed: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
            <div className="text-center mb-8">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                    Secure Admin Access
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
                    Admin Portal
                </h2>
                <p className="text-gray-400 mt-2">Enter credentials to manage Lumio</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Address */}
                <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-gray-300 ml-1">Admin Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                        placeholder="admin@lumio.com"
                        required
                    />
                </div>

                {/* Phone Number */}
                <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-gray-300 ml-1">Phone Number</label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                        placeholder="09..."
                        required
                    />
                </div>

                {/* Password */}
                <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                            placeholder="••••••••"
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

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-shake">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Verifying...</span>
                        </>
                    ) : (
                        <span>Admin Login</span>
                    )}
                </button>
            </form>
        </div>
    );
}
