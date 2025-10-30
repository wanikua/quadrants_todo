import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Grid Pattern */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0"></div>

      {/* Soft Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-transparent rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-blue-200/40 via-purple-200/40 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-50 border-b-[3px] border-black/10">
        <div className="w-full px-[4%] md:px-[10%]">
          <div className="h-24 flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <Image
                src="/Original Logo Symbol.png"
                alt="Logo"
                width={70}
                height={70}
                className="w-[70px] h-[70px] object-contain transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-3"
              />
            </Link>
            <nav className="flex items-center gap-3 md:gap-4">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-black hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-[600ms] font-bold text-base md:text-lg px-4 md:px-6 rounded-[15px]">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-black hover:bg-gray-800 text-white transition-all duration-[600ms] font-bold shadow-lg hover:shadow-2xl px-6 md:px-8 py-3 md:py-4 rounded-[15px] md:rounded-[20px] hover:scale-[1.05] text-base md:text-lg">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-48 pb-32 px-[4%] md:px-[10%] relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-bold text-black leading-[1.1] mb-8">
              Privacy <span className="text-highlight-purple">Policy</span>
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12">
            <div className="bg-white border-[3px] border-black rounded-[20px] p-10">
              <h2 className="text-2xl font-bold text-black mb-4">
                Information We <span className="text-highlight-yellow">Collect</span>
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, and task data you create within Quadrants.
              </p>
            </div>

            <div className="bg-white border-[3px] border-black rounded-[20px] p-10">
              <h2 className="text-2xl font-bold text-black mb-4">
                How We <span className="text-highlight-purple">Use</span> Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </div>

            <div className="bg-white border-[3px] border-black rounded-[20px] p-10">
              <h2 className="text-2xl font-bold text-black mb-4">
                Data <span className="text-highlight-yellow">Security</span>
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We take reasonable measures to help protect your information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted in transit and at rest.
              </p>
            </div>

            <div className="bg-white border-[3px] border-black rounded-[20px] p-10">
              <h2 className="text-2xl font-bold text-black mb-4">
                Your <span className="text-highlight-purple">Rights</span>
              </h2>
              <p className="text-gray-700 leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us directly.
              </p>
            </div>

            <div className="bg-white border-[3px] border-black rounded-[20px] p-10">
              <h2 className="text-2xl font-bold text-black mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:contact@quadrants.ch" className="font-bold text-black hover:text-purple-600 transition-colors">
                  contact@quadrants.ch
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black mt-48 bg-white relative">
        <div className="px-[4%] md:px-[10%] py-16">
          <div className="flex flex-col items-center gap-6">
            <Link href="/" className="inline-block group">
              <Image
                src="/Original Logo Symbol.png"
                alt="Logo"
                width={60}
                height={60}
                className="w-[60px] h-[60px] object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </Link>
            <p className="text-base font-bold text-black">© 2025 Quadrants. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
