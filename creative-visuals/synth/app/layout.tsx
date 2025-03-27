import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Piano Composer",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Injecting the external script */}
        <script src="http://unpkg.com/tone" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
