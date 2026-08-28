import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import LiveBackground from "@/components/ui/LiveBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinPilot AI — Personal Finance Education",
  description: "Learn personal finance, SIPs, mutual funds, and stocks with AI-powered guidance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LiveBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
