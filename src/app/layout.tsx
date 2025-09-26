import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import SessionProvider from "@/provider/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Eartle",
    template: "%s | Eartle",
  },
  description:
    "Eartle is a daily word guessing game inspired by Wordle. Challenge yourself with a new 5-letter word every day, compete on the global leaderboard, and track your progress over time.",
  keywords: [
    "word game",
    "daily puzzle",
    "wordle",
    "word guessing",
    "puzzle game",
    "Eartle",
    "eartle",
    "daily word",
    "word challenge",
    "brain game",
    "vocabulary",
    "spelling",
    "leaderboard",
    "daily challenge",
    "word puzzle",
    "guess the word",
    "5-letter word",
    "word game online",
    "daily word game",
    "competitive word game",
  ],
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
  authors: [{ name: "Eartle Team", url: "https://github.com/wind-surfing" }],
  creator: "Eartle Team",
  publisher: "Eartle",
  applicationName: "Eartle",
  category: "Games",
  classification: "Daily Word Puzzle Game",
  openGraph: {
    type: "website",
    siteName: "Eartle",
    title: "Eartle: Daily Word Challenge",
    description:
      "Play the daily word guessing game! Challenge yourself with a new 5-letter word every day, compete on the global leaderboard, and improve your vocabulary.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://eartle.vercel.app",
    images: [
      {
        url: "/brands/eartle.svg",
        width: 1200,
        height: 630,
        alt: "Eartle: Daily Word Guessing Game",
        type: "image/svg+xml",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@eartle",
    creator: "@eartle_game",
    title: "Eartle: Daily Word Challenge",
    description:
      "Play the daily word guessing game! New 5-letter word every day. Compete globally and improve your vocabulary.",
    images: ["/brands/eartle.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://eartle.vercel.app",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://eartle.vercel.app"
  ),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

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
        <SessionProvider>
          <Toaster />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
