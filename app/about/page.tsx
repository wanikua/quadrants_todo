import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
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
              About <span className="text-highlight-purple">Quadrants</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              We believe productivity should be simple, not complicated.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-16">
            <div className="bg-white border-[3px] border-black rounded-[20px] p-10 md:p-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Our <span className="text-highlight-yellow">Mission</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Quadrants was built to help people focus on what truly matters. We use the proven Eisenhower Matrix framework to help you prioritize tasks based on urgency and importance—without the complexity of traditional project management tools.
              </p>
            </div>

            <div className="bg-white border-[3px] border-black rounded-[20px] p-10 md:p-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Why <span className="text-highlight-purple">Quadrants</span>?
              </h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  Most task managers overwhelm you with features you don&apos;t need. Quadrants is different—it&apos;s designed to be minimal, intuitive, and powerful.
                </p>
                <p>
                  With a simple drag-and-drop interface and visual quadrants, you can instantly see what needs your attention right now, what can wait, and what you should delegate or eliminate.
                </p>
              </div>
            </div>

            <div className="bg-white border-[3px] border-black rounded-[20px] p-10 md:p-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Built for <span className="text-highlight-yellow">Everyone</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Whether you&apos;re a solo entrepreneur, a student managing assignments, or a team collaborating on projects—Quadrants adapts to your workflow without getting in the way.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center pt-8">
              <Link href="/sign-up">
                <Button className="bg-black hover:bg-gray-800 text-white px-12 py-6 text-xl rounded-[20px] font-bold transition-all duration-[600ms] shadow-xl hover:shadow-2xl hover:scale-[1.05]">
                  Start Using Quadrants
                </Button>
              </Link>
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
