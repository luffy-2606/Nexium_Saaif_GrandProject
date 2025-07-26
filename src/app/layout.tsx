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
  title: "Recipe Generator - AI-Powered Recipe Creation",
  description: "Transform your available ingredients into delicious recipes with AI. Get personalized recipes, save favorites, and explore cuisines from around the world.",
  keywords: "recipe generator, AI recipes, cooking, ingredients, food, cuisine",
  authors: [{ name: "Recipe Generator Team" }],
  creator: "Recipe Generator",
  publisher: "Recipe Generator",
  openGraph: {
    title: "Recipe Generator - AI-Powered Recipe Creation",
    description: "Transform your available ingredients into delicious recipes with AI",
    url: "https://your-domain.com",
    siteName: "Recipe Generator",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Recipe Generator - AI-Powered Recipe Creation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Generator - AI-Powered Recipe Creation",
    description: "Transform your available ingredients into delicious recipes with AI",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
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
        {children}
      </body>
    </html>
  );
}
