'use client'

import { SignIn } from '@clerk/nextjs'
import { WeChatLoginButton } from '@/components/wechat-login-button'
import { LanguageToggle } from '@/components/language-toggle'
import { PageBackground } from '@/components/page-background'
import { SiteHeader } from '@/components/site-header'

export default function SignInPage() {
  const hasWeChat = !!process.env.NEXT_PUBLIC_WECHAT_APP_ID

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />
      <SiteHeader showNav={false} />

      {/* Language Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <main className="relative z-10 flex items-center justify-center px-6 py-12 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          <SignIn
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

          {/* WeChat Login - Below Clerk */}
          {hasWeChat && (
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-black/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500 font-medium">OR</span>
                </div>
              </div>
              <WeChatLoginButton />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
