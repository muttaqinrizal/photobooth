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

export const metadata = {
  title: "Sony ZV-E10 Photobooth",
  description: "Professional Photobooth Experience",
};

import { SocketProvider } from "@/context/SocketContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-black text-white antialiased overflow-hidden font-sans">
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
