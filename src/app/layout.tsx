import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RightTimeMD - Healthcare Portal",
  description: "Modern healthcare management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-blue-50">
      <body className={`${inter.className} h-full`}>
        <main className="min-h-screen">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  );
}
