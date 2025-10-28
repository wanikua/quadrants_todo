import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Grid Pattern - Daisy AI 24-column system */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0"></div>

      {/* Soft Gradient Background - Daisy AI Style */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Large soft gradient blobs */}
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-transparent rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-blue-200/40 via-purple-200/40 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-1/4 left-1/3 w-[700px] h-[700px] bg-gradient-to-tr from-pink-200/30 via-orange-200/30 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>

      </div>

      {/* Header - Daisy AI transparent with backdrop blur */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-50 border-b-[3px] border-black/10">
        <div className="w-full px-[4%] md:px-[10%]">
          <div className="h-24 flex items-center justify-between">
            {/* Logo - Left aligned */}
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <Image
                  src="/Original Logo Symbol.png"
                  alt="Logo"
                  width={70}
                  height={70}
                  className="w-[70px] h-[70px] md:h-[70px] object-contain transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </Link>

            {/* Navigation - Right aligned */}
            <nav className="flex items-center gap-3 md:gap-4">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="default"
                  className="text-black hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-bold text-base md:text-lg px-4 md:px-6 h-auto rounded-[15px]"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="default"
                  className="bg-black hover:bg-gray-800 text-white transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-bold shadow-lg hover:shadow-2xl h-auto px-6 md:px-8 py-3 md:py-4 rounded-[15px] md:rounded-[20px] hover:scale-[1.05] text-base md:text-lg"
                >
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-48 pb-32 px-[4%] md:px-[10%]">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="text-center space-y-10 mb-24 relative z-10">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] animate-on-load animate-slide-up">
              <span className="text-gray-900">
                Minimal Effort,{" "}
              </span>
              <span className="text-highlight-yellow inline-block">
                Maximum Productivity
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-on-load animate-fade-in-up animation-delay-200">
              The simplest todo management. Yet the most powerful.
              <br />
              <span className="text-gray-900 font-semibold">Drag. Drop. Done.</span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32 animate-on-load animate-fade-scale animation-delay-400 relative z-10">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 text-white px-12 py-8 text-xl rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease] shadow-lg hover:shadow-2xl hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="border-[3px] border-black text-black hover:bg-black hover:text-white px-12 py-8 text-xl rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease] hover:scale-[1.02]"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-32">
            <div className="group space-y-6 animate-on-load animate-fade-scale animation-delay-600 p-10 rounded-[20px] bg-white border-[3px] border-black hover:shadow-2xl transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3 hover:border-purple-500 cursor-pointer relative overflow-hidden">
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-pink-50/0 group-hover:from-purple-50/80 group-hover:to-pink-50/80 transition-all duration-[600ms] rounded-[17px]"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-black flex items-center justify-center group-hover:bg-purple-600 transition-all duration-[600ms] group-hover:scale-110 group-hover:rotate-3">
                  <div className="w-8 h-8 rounded-[10px] bg-white group-hover:animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-black leading-tight mt-6">Overview</h3>
                <p className="text-gray-700 leading-relaxed text-lg mt-6">
                  See everything at once. <span className="text-highlight-purple">Priority is clear.</span>
                </p>
              </div>
            </div>

            <div className="group space-y-6 animate-on-load animate-fade-scale animation-delay-700 p-10 rounded-[20px] bg-white border-[3px] border-black hover:shadow-2xl transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3 hover:border-blue-500 cursor-pointer relative overflow-hidden">
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/80 group-hover:to-purple-50/80 transition-all duration-[600ms] rounded-[17px]"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-black flex items-center justify-center group-hover:bg-blue-600 transition-all duration-[600ms] group-hover:scale-110 group-hover:rotate-3">
                  <div className="w-8 h-8 rounded-[10px] bg-white group-hover:animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-black leading-tight mt-6">Control</h3>
                <p className="text-gray-700 leading-relaxed text-lg mt-6">
                  Drag, drop, done. <span className="text-highlight-purple">Simple and full control.</span>
                </p>
              </div>
            </div>

            <div className="group space-y-6 animate-on-load animate-fade-scale animation-delay-800 p-10 rounded-[20px] bg-white border-[3px] border-black hover:shadow-2xl transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3 hover:border-yellow-500 cursor-pointer relative overflow-hidden">
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/0 to-orange-50/0 group-hover:from-yellow-50/80 group-hover:to-orange-50/80 transition-all duration-[600ms] rounded-[17px]"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-black flex items-center justify-center group-hover:bg-yellow-500 transition-all duration-[600ms] group-hover:scale-110 group-hover:rotate-3">
                  <div className="w-8 h-8 rounded-[10px] bg-white group-hover:animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-black leading-tight mt-6">Priority</h3>
                <p className="text-gray-700 leading-relaxed text-lg mt-6">
                  First thing todo? <span className="text-highlight-yellow">The matrix decides for you.</span>
                </p>
              </div>
            </div>

            <div className="group space-y-6 animate-on-load animate-fade-scale animation-delay-900 p-10 rounded-[20px] bg-white border-[3px] border-black hover:shadow-2xl transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-3 hover:border-pink-500 cursor-pointer relative overflow-hidden">
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/0 to-purple-50/0 group-hover:from-pink-50/80 group-hover:to-purple-50/80 transition-all duration-[600ms] rounded-[17px]"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-[20px] bg-black flex items-center justify-center group-hover:bg-pink-600 transition-all duration-[600ms] group-hover:scale-110 group-hover:rotate-3">
                  <div className="w-8 h-8 rounded-[10px] bg-white group-hover:animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-black leading-tight mt-6">Teamwork</h3>
                <p className="text-gray-700 leading-relaxed text-lg mt-6">
                  Share projects. <span className="text-highlight-yellow">Assign tasks. Collaborate seamlessly.</span>
                </p>
              </div>
            </div>
          </div>

          {/* User Experience Section */}
          <div className="mt-48 space-y-32">
            {/* Section 1: Stop Wasting Time */}
            <ScrollReveal animation="fade-in-up">
              <div className="text-center max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                  Stop wasting time <span className="text-underline-curve">deciding</span> what to do next
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Every task lands exactly where it should. <span className="text-highlight-purple">Urgent in the top right.</span> Important but not urgent on the left.
                  Your next move is always obvious.
                </p>
              </div>
            </ScrollReveal>

            {/* Section 2: Visual Clarity */}
            <ScrollReveal animation="fade-scale" delay={100}>
              <div className="relative bg-white rounded-[20px] p-16 md:p-24 overflow-hidden border-[3px] border-black shadow-xl">
                {/* Decorative shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                    See your <span className="text-highlight-yellow">entire workload</span> in one glance
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    No endless scrolling. No hidden tasks. Everything visible on one screen.
                    The Eisenhower Matrix gives you instant clarity on what matters most.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 3: Team Collaboration */}
            <ScrollReveal animation="fade-in-up" delay={100}>
              <div className="text-center max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                  Built for <span className="text-highlight-purple">teams</span>, perfect for solo
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Assign tasks with colors. Track who&apos;s doing what. Share projects instantly.
                  Or use it alone—it&apos;s just as powerful for personal productivity.
                </p>
              </div>
            </ScrollReveal>

            {/* Section 4: No Learning Curve */}
            <ScrollReveal animation="slide-up" delay={100}>
              <div className="relative bg-black rounded-[20px] p-16 md:p-24 text-center overflow-hidden shadow-2xl">
                {/* Decorative shapes */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1]">
                    No tutorials needed. <span className="text-highlight-yellow">Start in seconds.</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                    Long-press to create. Click to edit. That&apos;s it.
                  </p>
                  <div className="pt-8">
                    <Link href="/sign-up">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-100 px-12 py-8 text-xl rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease] shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                      >
                        Try it now—it&apos;s free
                        <ArrowRight className="ml-3 h-6 w-6" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>

      {/* Big Footer - Daisy AI Style */}
      <footer className="border-t-[3px] border-black mt-48 bg-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-100/50 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="px-[4%] md:px-[10%] py-24 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            {/* Links - Centered horizontal layout */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <Link href="/pricing" className="text-gray-700 hover:text-black transition-colors duration-300 text-base font-medium">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-black transition-colors duration-300 text-base font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-black transition-colors duration-300 text-base font-medium">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-700 hover:text-black transition-colors duration-300 text-base font-medium">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-700 hover:text-black transition-colors duration-300 text-base font-medium">
                Terms
              </Link>
            </div>

            {/* Logo and Copyright */}
            <div className="flex flex-col items-center gap-6 pt-8 border-t-[3px] border-black w-full max-w-2xl">
              <Link href="/" className="inline-block group">
                <Image
                  src="/Original Logo Symbol.png"
                  alt="Quadrants Logo"
                  width={60}
                  height={60}
                  className="w-[60px] h-[60px] object-contain transition-transform duration-500 group-hover:scale-110"
                />
              </Link>
              <p className="text-base font-bold text-black">
                © 2025 Quadrants. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
