import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/Providers";
import Header from "@/components/Header";
import React from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T-Nigger Page",
  description: "Generate New Nigger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Add logo variable
  const TOKTIK_LOGO =
    "https://cdn.discordapp.com/attachments/978003347783159880/1420839977889169508/7xfcF3t.png?ex=68d6dbd8&is=68d58a58&hm=36b73cb9169cf0eb89c52c93b5597fd82e9e7764212a937b098b7c1f7990656d&";

  const disableHeaderPaths = ["/video", "/video/[id]"];

  return (
    <Providers>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Header logo={TOKTIK_LOGO} disabledPaths={disableHeaderPaths} />
          <div className="h-screen w-full">{children}</div>
        </body>
      </html>
    </Providers>
  );
}
