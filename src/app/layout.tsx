import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0e14",
};

export const metadata: Metadata = {
  title: "Strait Crisis Dashboard",
  description:
    "Real-time macro energy security monitor — oil, Brent, crack spread, DXY, SPR inventory, and strategic shipping chokepoints.",
  openGraph: {
    title: "Strait Crisis Dashboard",
    description:
      "Track the macro signals that matter — oil prices, crack spreads, dollar index, SPR, and shipping.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
