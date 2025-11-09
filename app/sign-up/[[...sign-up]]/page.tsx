import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-[4%]">
      {/* Soft Gradient Background - Daisy AI Style */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-blue-200/40 via-purple-200/40 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#000000",
              colorText: "#000000",
              colorBackground: "#FFFFFF",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#000000",
              borderRadius: "20px",
            },
            elements: {
              rootBox: "mx-auto",
              card: "bg-white border-[3px] border-black shadow-2xl rounded-[20px] p-8",
              headerTitle: "text-black font-bold text-3xl",
              headerSubtitle: "text-gray-700 text-lg",
              socialButtonsBlockButton: "border-[3px] border-black text-black hover:bg-black hover:text-white rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease]",
              formFieldLabel: "text-black font-bold text-base",
              formFieldInput: "border-[3px] border-black bg-white text-black focus:border-black rounded-[20px] text-lg p-4 font-medium",
              formButtonPrimary: "bg-black hover:bg-gray-800 text-white rounded-[20px] font-bold text-lg py-4 transition-all duration-[1200ms] ease-[ease] shadow-lg hover:shadow-2xl hover:scale-[1.02]",
              footerActionLink: "text-black hover:text-gray-600 font-bold underline",
              dividerLine: "bg-black h-[2px]",
              dividerText: "text-black font-bold",
            },
          }}
        />
      </div>
    </div>
  )
}
