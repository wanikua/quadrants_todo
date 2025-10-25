import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-20">
          <div className="h-20 flex items-center justify-between">
            {/* Logo - Left aligned with perfect vertical centering */}
            <Link href="/" className="flex items-center gap-3 group -ml-1">
              <div className="relative">
                <Image
                  src="/Original Logo Symbol.png"
                  alt="Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
              <span className="text-xl font-semibold text-black tracking-tight hidden sm:block transition-colors duration-200 group-hover:text-[#F45F00]">
                Quadrants
              </span>
            </Link>

            {/* Navigation - Right aligned with balanced spacing */}
            <nav className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="default"
                  className="text-black hover:text-[#F45F00] hover:bg-[#F45F00]/5 transition-all duration-200 font-medium h-10 px-5 rounded-lg"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="default"
                  className="bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md h-10 px-6 rounded-lg hover:scale-[1.02]"
                >
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-48 pb-20 px-6 md:px-20">
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <div className="text-center space-y-6 mb-16 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black leading-tight">
              Minimal Effort,{" "}
              <span className="text-[#F45F00]">Maximum Focus</span>
            </h1>

            <p className="text-lg md:text-xl text-[#575757] max-w-2xl mx-auto leading-relaxed">
              The simplest todo management. Yet the most powerful.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-fade-in animation-delay-200">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-[#F45F00] hover:bg-[#d64f00] text-white px-8 py-6 text-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="border border-black text-black hover:bg-black hover:text-white px-8 py-6 text-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-32">
            <div className="space-y-3 animate-scale-in animation-delay-400">
              <div className="w-12 h-12 rounded-full bg-[#F45F00]/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#F45F00] animate-pulse-slow"></div>
              </div>
              <h3 className="text-xl font-semibold text-black">Overview</h3>
              <p className="text-[#575757] leading-relaxed">
                See everything at once. Priority is clear.
              </p>
            </div>

            <div className="space-y-3 animate-scale-in animation-delay-500">
              <div className="w-12 h-12 rounded-full bg-[#F45F00]/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#F45F00] animate-pulse-slow"></div>
              </div>
              <h3 className="text-xl font-semibold text-black">Control</h3>
              <p className="text-[#575757] leading-relaxed">
                Drag, drop, done. Simple and full control.
              </p>
            </div>

            <div className="space-y-3 animate-scale-in animation-delay-600">
              <div className="w-12 h-12 rounded-full bg-[#F45F00]/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#F45F00] animate-pulse-slow"></div>
              </div>
              <h3 className="text-xl font-semibold text-black">Priority</h3>
              <p className="text-[#575757] leading-relaxed">
                First thing todo? The matrix decides for you.
              </p>
            </div>

            <div className="space-y-3 animate-scale-in animation-delay-700">
              <div className="w-12 h-12 rounded-full bg-[#F45F00]/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#F45F00] animate-pulse-slow"></div>
              </div>
              <h3 className="text-xl font-semibold text-black">Teamwork</h3>
              <p className="text-[#575757] leading-relaxed">
                Share projects. Assign tasks. Collaborate seamlessly.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-32">
        <div className="max-w-7xl mx-auto px-6 md:px-20 py-12">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/Original Logo Symbol.png"
                alt="Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain opacity-70"
              />
              <span className="text-sm text-[#A3A3A3]">© 2025 Quadrants. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
