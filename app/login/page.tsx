import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Animated Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-0"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="z-10 w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="relative w-232 h-32 hover:scale-105 transition-transform duration-300">
                        {/* Logo Placeholder - assuming logo exists based on previous context, 
                 but using text fallback if needed or just the nice container */}
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            LUMIO
                        </div>
                    </div>
                </div>

                <LoginForm />
            </div>
        </div>
    );
}
