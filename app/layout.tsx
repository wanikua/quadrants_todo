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
  title: "Quadrant Task Manager",
  description: "Manage your tasks with the Eisenhower Matrix",
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      proxyUrl="https://clerk.quadrants.ch"
      domain="clerk.quadrants.ch"
      isSatellite={false}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/projects"
      afterSignUpUrl="/projects"
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
      <html lang="en">
        <body className={`${inter.variable} ${libreBaskerville.variable} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
