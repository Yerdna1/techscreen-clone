import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "LiveHelpEasy - Your Invisible Interview Assistant",
  description:
    "AI-powered interview assistant that helps you ace technical interviews with real-time assistance. Get instant, accurate answers to coding questions.",
  keywords: [
    "interview",
    "coding interview",
    "AI assistant",
    "technical interview",
    "programming help",
    "code assistance",
  ],
  authors: [{ name: "LiveHelpEasy" }],
  openGraph: {
    title: "LiveHelpEasy - Your Invisible Interview Assistant",
    description: "AI-powered interview assistant for technical interviews",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#0a0a0a",
          colorText: "#fafafa",
          colorInputBackground: "#171717",
          colorInputText: "#fafafa",
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
