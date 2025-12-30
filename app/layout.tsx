import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DGS - Digital Gold System",
  description: "Join DGS Pro - The ultimate investment platform for digital gold. Start your journey today and earn rewards.",
  keywords: ["DGS", "Digital Gold", "Investment", "Rewards", "Invite"],
  openGraph: {
    title: "DGS - Digital Gold System",
    description: "Join me on DGS and let's earn together!",
    url: "https://dgs-three.vercel.app",
    siteName: "DGS Pro",
    images: [
      {
        url: "/dgs_app_icon.png",
        width: 512,
        height: 512,
        alt: "DGS Pro Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DGS - Digital Gold System",
    description: "Join DGS and start earning rewards!",
    images: ["/dgs_app_icon.png"],
  },
};

import { LanguageProvider } from "@/lib/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
