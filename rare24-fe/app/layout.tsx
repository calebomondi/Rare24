import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import TopBar from "./components/top-bar";
import BottomNavigation from "./components/bottom-navigation";
import { Web3Provider } from "./providers/wagmiProvider";
import { ThemeProvider } from "next-themes"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rare24",
  description: "Own Your Favourite Creator's Moment",
  other: {
    'base:app_id': '694a32f54d3a403912ed7c3e',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
         <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${manrope.variable} antialiased h-screen flex flex-col overflow-hidden`}
      >
        <Web3Provider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <TopBar />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <BottomNavigation />
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
