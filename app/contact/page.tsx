import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default function ContactPage() {
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
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-bold text-black leading-[1.1] mb-8">
              Get in <span className="text-highlight-yellow">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Have questions? We&apos;d love to hear from you.
            </p>
          </div>

          {/* Contact Card */}
          <div className="bg-white border-[3px] border-black rounded-[20px] p-10 md:p-16 text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              For support, questions, or feedback, send us an email.
            </p>

            <a
              href="mailto:hello@quadrants.app"
              className="inline-block bg-black hover:bg-gray-800 text-white px-12 py-6 text-xl rounded-[20px] font-bold transition-all duration-[600ms] shadow-xl hover:shadow-2xl hover:scale-[1.05]"
            >
              contact@quadrants.ch
            </a>
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
