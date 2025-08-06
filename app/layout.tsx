import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { shouldUseClerk } from "@/lib/env"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Quadrant Task Manager",
  description: "Organize your tasks using the Eisenhower Matrix",
  generator: 'v0.dev'
}

function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  if (shouldUseClerk()) {
    return (
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        {children}
      </ClerkProvider>
    )
  }
  
  // Show domain warning for production keys on wrong domain
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Domain Restriction</h1>
          <p className="text-gray-600 mb-4">
            This application is configured for production use on quadrants.ch domain only.
          </p>
          <p className="text-sm text-gray-500">
            To use this app on other domains, please use development keys or configure the domain in Clerk.
          </p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConditionalClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ConditionalClerkProvider>
  )
}
