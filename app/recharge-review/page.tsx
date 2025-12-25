"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface Particle {
    left: string;
    top: string;
    delay: string;
    duration: string;
}

import { Suspense } from "react";

function RechargeReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get('amount') || '0';
    const [particles, setParticles] = useState<Particle[]>([]);
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState('pending');

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Listen for the recharge request status
        const q = query(
            collection(db, "RechargeReview"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot: any) => {
            if (snapshot.empty) {
                // If the document is gone (deleted after 10s), or never existed, we can redirect
                // But we usually want to wait for the 'approved' status first
                return;
            }

            const data = snapshot.docs[0].data() as any;
            if (data.status === 'approved') {
                setStatus('approved');
                // Redirect after a short delay to show "Approved" or go home immediately as requested
                setTimeout(() => {
                    router.push('/welcome');
                }, 1500);
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        // Generate random particles only on client side to avoid hydration errors
        const generatedParticles = [...Array(20)].map(() => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${5 + Math.random() * 10}s`
        }));
        setParticles(generatedParticles);
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 max-w-md w-full">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                    {/* Circular Progress Indicator */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-32 h-32">
                            {/* Outer rotating ring */}
                            <div className="absolute inset-0 border-8 border-white/20 rounded-full"></div>
                            <div className="absolute inset-0 border-8 border-transparent border-t-white border-r-white rounded-full animate-spin"></div>

                            <div className={`absolute inset-4 ${status === 'approved' ? 'bg-green-500/30' : 'bg-white/30'} rounded-full flex items-center justify-center transition-colors duration-500 ${status === 'pending' ? 'animate-pulse' : ''}`}>
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {status === 'approved' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-black text-white mb-3 transition-all duration-500">
                            {status === 'approved' ? 'Recharge Approved!' : 'Under Review'}
                        </h1>
                        <p className="text-white/80 text-lg mb-2">
                            {status === 'approved' ? 'Your balance has been updated' : 'Your recharge request is being processed'}
                        </p>
                        <div className={`inline-block ${status === 'approved' ? 'bg-green-500/40' : 'bg-white/20'} px-6 py-2 rounded-full transition-colors duration-500`}>
                            <p className="text-2xl font-bold text-white">{parseInt(amount).toLocaleString()} Br</p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-semibold">Request Submitted</p>
                                <p className="text-white/60 text-sm">Your transaction details have been received</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <div className="w-3 h-3 rounded-full bg-white"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-semibold">DGS Team Verified</p>
                                <p className="text-white/60 text-sm">Waiting for DGS team approval...</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <div className="w-3 h-3 rounded-full bg-white/40"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-white/70 font-semibold">Balance Update</p>
                                <p className="text-white/50 text-sm">Your balance will be updated shortly</p>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-white font-semibold text-sm mb-1">Please Wait</p>
                                <p className="text-white/70 text-xs leading-relaxed">
                                    This process usually takes 5-30 minutes. You'll be notified once your recharge is verified by DGS team and your balance is updated.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={() => router.push('/welcome')}
                            className="w-full h-12 bg-white hover:bg-gray-100 text-purple-900 font-bold rounded-xl transition-all transform active:scale-[0.98]"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all"
                        >
                            Go Back
                        </button>
                    </div>
                </div>

                {/* Floating particles animation */}
                <div className="absolute inset-0 pointer-events-none">
                    {mounted && particles.map((particle, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
                            style={{
                                left: particle.left,
                                top: particle.top,
                                animationDelay: particle.delay,
                                animationDuration: particle.duration
                            }}
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    50% {
                        opacity: 0.5;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(20px);
                        opacity: 0;
                    }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
}

export default function RechargeReviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-purple-900 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
        }>
            <RechargeReviewContent />
        </Suspense>
    );
}
