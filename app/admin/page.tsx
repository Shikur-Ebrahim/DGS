"use client";

import AdminLoginForm from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="mb-12 hover:scale-105 transition-transform duration-500 cursor-pointer group">
                    <h1 className="text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        DGS
                    </h1>
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mt-2 rounded-full"></div>
                </div>

                <AdminLoginForm />

                <p className="mt-8 text-gray-500 text-sm">
                    Protected System &bull; Authorized Access Only
                </p>
            </div>
        </div>
    );
}
