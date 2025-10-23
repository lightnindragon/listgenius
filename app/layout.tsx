import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { UserMetadataProvider } from '@/contexts/UserMetadataContext';
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
  title: "ListGenius - AI Etsy Listing Expert",
  description: "Generate SEO-optimized Etsy listings with AI. Create professional titles, descriptions, and tags for your digital products.",
  keywords: ["Etsy SEO", "AI listing writer", "Etsy tags", "digital products", "listing generator"],
  openGraph: {
    title: "ListGenius - AI Etsy Listing Expert",
    description: "Generate SEO-optimized Etsy listings with AI. Create professional titles, descriptions, and tags for your digital products.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/app"
      afterSignUpUrl="/app"
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        >
          <UserMetadataProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </UserMetadataProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
