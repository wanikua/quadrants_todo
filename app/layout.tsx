import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { headers } from "next/headers"
import { getClerkProviderConfig } from "@/lib/env"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Quadrant Task Manager",
  description: "Organize your tasks using the Eisenhower Matrix",
  generator: "v0.dev",
}

function Providers({ children }: { children: React.ReactNode }) {
  const host = headers().get("host")
  const clerk = getClerkProviderConfig(host)

  if (clerk.enabled && clerk.publishableKey) {
    return (
      <ClerkProvider
        publishableKey={clerk.publishableKey}
        // proxyUrl={clerk.proxyUrl} // uncomment if you configured a Clerk proxy
        signInUrl={clerk.signInUrl}
        signUpUrl={clerk.signUpUrl}
      >
        {children}
      </ClerkProvider>
    )
  }

  // Clerk disabled on this host (e.g., preview domain with production key).
  return <>{children}</>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
