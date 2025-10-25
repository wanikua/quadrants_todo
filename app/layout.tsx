import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
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
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#F45F00",
          colorText: "#000000",
          colorBackground: "#FFFFFF",
          colorNeutral: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#000000",
          borderRadius: "0.5rem",
        },
        elements: {
          rootBox: "bg-white",
          card: "bg-white border border-gray-200 shadow-sm",
          main: "bg-white",
          body: "bg-white",
          navbar: "bg-white",
          page: "bg-white",
          pageScrollBox: "bg-white",
          footer: "bg-white",
          formButtonPrimary: "bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium",
          headerTitle: "text-black font-semibold",
          headerSubtitle: "text-[#575757]",
          socialButtonsBlockButton: "border border-gray-200 text-black hover:bg-gray-50 transition-all duration-200",
          formFieldLabel: "text-black font-medium",
          formFieldInput: "border border-gray-200 focus:border-[#F45F00] transition-all duration-200 bg-white",
          formFieldInputShowPasswordButton: "text-[#F45F00]",
          footerActionLink: "text-[#F45F00] hover:text-[#d64f00] transition-colors duration-200",
          identityPreviewText: "text-black",
          identityPreviewEditButton: "text-[#F45F00]",
          alternativeMethodsBlockButton: "border border-gray-200 text-black hover:bg-gray-50",
          otpCodeFieldInput: "border border-gray-200 focus:border-[#F45F00]",
        },
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "blockButton",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
