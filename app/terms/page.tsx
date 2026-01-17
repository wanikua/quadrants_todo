import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-blue-100/40 rounded-full blur-[100px] animate-float opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-yellow-100/40 rounded-full blur-[100px] animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.4]" style={{
          backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-10 left-0 right-0 bg-white/90 backdrop-blur-md z-50 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="group relative flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl border-2 border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-black/10">
              <Image
                src="/logo.png"
                alt="Logo"
                width={50}
                height={50}
                className="w-10 h-10 object-contain transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              />
            </div>
            <span className="text-2xl font-black text-black tracking-tight">Quadrants</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-black hover:bg-gray-100 font-bold text-base px-4 h-auto rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow font-bold rounded-xl px-6 py-2 h-auto text-base transition-all">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-black text-black leading-[1.1] mb-8">
              Terms of <span className="text-highlight-yellow">Service</span>
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12">
            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Acceptance of <span className="text-highlight-purple">Terms</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                By accessing and using Quadrants, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Use <span className="text-highlight-yellow">License</span>
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4 font-medium">
                Quadrants grants you a personal, non-transferable, non-exclusive license to use the service. You may not:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 font-medium">
                <li>Modify or copy the materials</li>
                <li>Use the materials for commercial purposes</li>
                <li>Attempt to reverse engineer any software</li>
                <li>Transfer the materials to another person</li>
              </ul>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                User <span className="text-highlight-purple">Accounts</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Service <span className="text-highlight-yellow">Modifications</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                We reserve the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Limitation of <span className="text-highlight-purple">Liability</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                Quadrants shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Contact <span className="text-highlight-yellow">Information</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:contact@quadrants.ch" className="font-bold text-black hover:text-purple-600 transition-colors">
                  contact@quadrants.ch
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
