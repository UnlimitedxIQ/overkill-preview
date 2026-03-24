import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne, Rubik } from "next/font/google";
import { LenisProvider } from "@/components/LenisProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Overkill — $1.99 Website Polish",
  description:
    "Paste your URL. Pick your upgrades. Get a $50k website for $1.99.",
  openGraph: {
    title: "Overkill — $1.99 Website Polish",
    description:
      "Paste your URL. Pick your upgrades. Get a $50k website for $1.99.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} ${rubik.variable} font-[family-name:var(--font-geist-sans)] antialiased`}
      >
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
