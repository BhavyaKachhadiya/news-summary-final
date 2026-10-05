import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | SIGNAL",
    default: "SIGNAL — AI Technology & Business Intelligence",
  },
  description:
    "Editorial news platform synthesizing in-depth Technology and Business reporting from The Hindu into comprehensive intelligence summaries with Google Gemini.",
  keywords: [
    "SIGNAL",
    "The Hindu",
    "Technology News",
    "Business News",
    "AI News Summary",
    "Google Gemini",
    "RBI",
    "SEBI",
  ],
  authors: [{ name: "SIGNAL Editorial" }],
  openGraph: {
    title: "SIGNAL — AI Technology & Business Intelligence",
    description:
      "Editorial news platform synthesizing in-depth Technology and Business reporting from The Hindu into comprehensive intelligence summaries with Google Gemini.",
    type: "website",
    siteName: "SIGNAL AI News",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIGNAL — AI Technology & Business Intelligence",
    description:
      "Editorial news platform synthesizing in-depth Technology and Business reporting from The Hindu into comprehensive intelligence summaries with Google Gemini.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#000000] text-[#ffffff] selection:bg-white selection:text-black">
        <Header />
        <main className="flex-1 max-w-325 w-full mx-auto px-4 sm:px-8 py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
