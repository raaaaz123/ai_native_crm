import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/workspace-auth-context";
import { LayoutWrapper } from "./components/layout/LayoutWrapper";
import { PostHogProvider } from "./components/providers/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ragzy — AI‑Native Customer Engagement Platform",
  description:
    "Instantly answer your visitors' questions with a personalized chatbot trained on your website content.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <PostHogProvider>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
