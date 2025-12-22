import Image from "next/image";
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col items-center justify-center py-8 px-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-md">
                {/* Header Section with Logo + Text */}
                <div className="mb-8 flex items-center justify-center gap-4 px-6">
                    <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                            src="/logo/Lumino.png"
                            alt="Lumino Logo"
                            fill
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
                            Welcome to Lumino
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Create your account to get started
                        </p>
                    </div>
                </div>

                {/* Registration Form Card */}
                <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
                    {/* Decorative Top Border */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    <RegisterForm />
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors"
                    >
                        Sign In
                    </a>
                </p>
            </div>
        </div>
    );
}
