import type React from "react"
import type { Metadata } from "next"
import { Inter, Libre_Baskerville } from "next/font/google"
import { Toaster } from "sonner"
import { ClerkProvider } from "@clerk/nextjs"
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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#000000",
          colorText: "#000000",
          colorBackground: "#FFFFFF",
          colorNeutral: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#000000",
          borderRadius: "20px",
        },
        elements: {
          rootBox: "bg-white",
          card: "bg-white border-[3px] border-black shadow-2xl rounded-[20px]",
          main: "bg-white",
          body: "bg-white",
          navbar: "bg-white",
          page: "bg-white",
          pageScrollBox: "bg-white",
          footer: "bg-white",
          formButtonPrimary: "bg-black hover:bg-gray-800 text-white transition-all duration-[1200ms] ease-[ease] font-bold rounded-[20px] shadow-lg hover:shadow-2xl hover:scale-[1.02]",
          headerTitle: "text-black font-bold text-3xl",
          headerSubtitle: "text-gray-700",
          socialButtonsBlockButton: "border-[3px] border-black text-black hover:bg-black hover:text-white transition-all duration-[1200ms] ease-[ease] rounded-[20px] font-bold",
          formFieldLabel: "text-black font-bold",
          formFieldInput: "border-[3px] border-black focus:border-black transition-all duration-[1200ms] ease-[ease] bg-white rounded-[20px] font-medium",
          formFieldInputShowPasswordButton: "text-black",
          footerActionLink: "text-black hover:text-gray-600 transition-colors duration-[1200ms] ease-[ease] font-bold underline",
          identityPreviewText: "text-black",
          identityPreviewEditButton: "text-black font-bold",
          alternativeMethodsBlockButton: "border-[3px] border-black text-black hover:bg-black hover:text-white rounded-[20px] font-bold",
          otpCodeFieldInput: "border-[3px] border-black focus:border-black rounded-[20px]",
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
