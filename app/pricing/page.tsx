import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Footer } from "@/components/footer"

export default function PricingPage() {
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
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b-[3px] border-black/10">
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
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-bold text-black leading-[1.1] mb-8">
              Plans for everyone 
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Start free. Upgrade when you need.
            </p>
          </div>

          {/* Promo Code Notice */}
          <div className="text-center mb-8">
            <p classN  </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border-[3px] border-black rounded-[20px] p-10 hover:shadow-2xl transition-all duration-[600ms] hover:-translate-y-2">
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold text-black mb-3">Free</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-6xl font-bold text-black">$0</span>
                    <span className="text-gray-600 text-xl">/month</span>
                  </div>
                  <p className="text-gray-600 text-lg">Perfect for getting started</p>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">Up to 3 projects</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">Unlimited tasks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">Basic collaboration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    
                    
                  </li>
                </ul>

                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-white border-[3px] border-black text-black hover:bg-black hover:text-white transition-all duration-[600ms] font-bold py-6 text-lg rounded-[15px]">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-black text-white border-[3px] border-black rounded-[20px] p-10 hover:shadow-2xl transition-all duration-[600ms] hover:-translate-y-2 relative">
 flex items-ba            <span className="text-lg">Unlimited tasks</span>
                POPULAR
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-lg">Advanced collaboration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-lg">Priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    
                    
                  </li>
                </ul>

                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-white text-black hover:bg-gray-100 transition-all duration-[600ms] font-bold py-6 text-lg rounded-[15px]">
                    Get Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
