import type React from "react"
import type { Metadata } from "next"
import { Inter, Libre_Baskerville } from "next/font/google"
import { Toaster } from "sonner"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

export const dynamic = 'force-dynamic'

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
  metadataBase: new URL("https://quadrants.ch"),
  title: {
    default: "Quadrants | AI Task Manager",
    template: "%s | Quadrants"
  },
  description: "AI-powered task management using the Eisenhower Matrix. Minimal effort, maximum productivity with smart AI organization.",
  keywords: [
    "task manager",
    "AI task management",
    "Eisenhower Matrix",
    "productivity tool",
    "task organization",
    "priority matrix",
    "team collaboration",
    "quadrants",
    "todo list AI",
    "smart task scheduling"
  ],
  authors: [{ name: "Quadrants Team", url: "https://quadrants.ch" }],
  creator: "Quadrants",
  publisher: "Quadrants",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://quadrants.ch",
    title: "Quadrants: AI-Powered Task Management",
    description: "The simplest way to manage tasks with AI. Organize your life using the Eisenhower Matrix automatically.",
    siteName: "Quadrants",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Quadrants AI Task Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quadrants: AI Task Manager",
    description: "AI-powered task management. Minimal effort, maximum productivity.",
    images: ["/logo.png"],
    creator: "@quadrants",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  generator: 'Next.js',
}

import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // @ts-expect-error - routerPush/routerReplace are optional in Next.js App Router but types require them
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      {...(process.env.NODE_ENV === 'production' && {
        proxyUrl: "https://clerk.quadrants.ch",
        domain: "clerk.quadrants.ch",
        isSatellite: false,
      })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/projects"
      afterSignUpUrl="/dashboard"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#000000",
          colorText: "#000000",
          colorBackground: "#FFFFFF",
          colorNeutral: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#000000",
          borderRadius: "0px",
        },
        elements: {
          rootBox: "bg-white",
          card: "bg-white border-[3px] border-black shadow-bold rounded-2xl",
          main: "bg-white",
          body: "bg-white",
          navbar: "bg-white",
          page: "bg-white",
          pageScrollBox: "bg-white",
          footer: "bg-white",
          formButtonPrimary: "bg-black hover:bg-gray-800 text-white transition-all duration-200 font-bold rounded-xl shadow-bold hover:shadow-bold-hover",
          headerTitle: "text-black font-bold text-3xl",
          headerSubtitle: "text-gray-600",
          socialButtonsBlockButton: "border-[3px] border-black text-black hover:bg-gray-50 transition-all duration-200 rounded-xl font-bold shadow-bold-sm hover:shadow-bold",
          formFieldLabel: "text-black font-bold",
          formFieldInput: "border-[3px] border-black focus:border-black transition-all duration-200 bg-white rounded-xl",
          formFieldInputShowPasswordButton: "text-black",
          footerActionLink: "text-black hover:text-gray-600 transition-colors duration-200 font-bold underline",
          identityPreviewText: "text-black",
          identityPreviewEditButton: "text-black font-bold",
          alternativeMethodsBlockButton: "border-[3px] border-black text-black hover:bg-gray-50 rounded-xl font-bold shadow-bold-sm",
          otpCodeFieldInput: "border-[3px] border-black focus:border-black rounded-xl",
        },
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "blockButton",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${libreBaskerville.variable} antialiased`} suppressHydrationWarning>
          {children}
          <Toaster />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
