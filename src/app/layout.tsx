import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppFrame } from "@/components/AppFrame";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beerlympics",
  description:
    "The annual backyard games. Get invited, draft your team, run the tournament, and watch the live scoreboard.",
  applicationName: "Beerlympics",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Beerlympics",
  },
  openGraph: {
    title: "Beerlympics",
    description: "The annual backyard games. RSVP, build your team, compete.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
