import { SignUp } from '@clerk/nextjs'
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />
      <SiteHeader showNav={false} />

      <main className="relative z-10 flex items-center justify-center px-6 py-12 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#000000",
                colorText: "#000000",
                colorBackground: "#FFFFFF",
                colorInputBackground: "#FFFFFF",
                colorInputText: "#000000",
                borderRadius: "14px",
              },
              elements: {
                rootBox: "mx-auto",
                card: "bg-white border-[3px] border-black shadow-bold-lg rounded-[2rem] p-8",
                headerTitle: "text-black font-bold text-3xl",
                headerSubtitle: "text-gray-700 text-lg",
                socialButtonsBlockButton: "border-[3px] border-black text-black hover:bg-black hover:text-white rounded-xl font-bold transition-all",
                formFieldLabel: "text-black font-bold text-base",
                formFieldInput: "border-[3px] border-black bg-white text-black focus:border-black rounded-xl text-lg p-4 font-medium",
                formButtonPrimary: "bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-lg py-4 transition-all shadow-bold hover:shadow-bold-lg",
                footerActionLink: "text-black hover:text-gray-600 font-bold underline",
                dividerLine: "bg-black h-[2px]",
                dividerText: "text-black font-bold",
              },
            }}
          />
        </div>
      </main>
    </div>
  )
}
