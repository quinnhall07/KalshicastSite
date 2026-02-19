// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar"; // <-- Import the NavBar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kalshicast | Quantitative Weather Bets",
  description: "Predictive Model Accuracy Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen`}>
        <NavBar /> {/* <-- Inject it right here above the children */}
        {children}
      </body>
    </html>
  );
}