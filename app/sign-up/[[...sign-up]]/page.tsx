import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#F45F00",
            colorText: "#000000",
            colorBackground: "#FFFFFF",
            colorInputBackground: "#F3F4F6",
            colorInputText: "#000000",
            borderRadius: "0.5rem",
          },
          elements: {
            rootBox: "mx-auto",
            card: "bg-white border-2 border-gray-300 shadow-lg",
            headerTitle: "text-black font-semibold",
            headerSubtitle: "text-gray-600",
            socialButtonsBlockButton: "border-2 border-gray-300 text-black hover:bg-gray-50",
            formFieldLabel: "text-black font-medium",
            formFieldInput: "border-2 border-gray-400 bg-gray-100 text-black focus:border-[#F45F00] focus:bg-white",
            formButtonPrimary: "bg-[#F45F00] hover:bg-[#d64f00] text-white",
            footerActionLink: "text-[#F45F00] hover:text-[#d64f00]",
            dividerLine: "bg-gray-300",
            dividerText: "text-gray-500",
          },
        }}
      />
    </div>
  )
}
