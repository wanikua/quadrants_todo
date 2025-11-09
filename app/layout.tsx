import type React from "react"
import type { Metadata } from "next"
import { Inter, Libre_Baskerville } from "next/font/google"
import { Toaster } from "sonner"
// import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-inter',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: 'swap',
  variable: '--font-libre-baskerville',
})

export const metadata: Metadata = {
  title: "Quadrant Task Manager",
  description: "Manage your tasks with the Eisenhower Matrix",
  generator: 'v0.app',
  icons: {
    icon: '/Original Logo Symbol.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${libreBaskerville.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
