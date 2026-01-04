import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { Footer } from "@/components/footer"

export default function PricingPage() {
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
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 shadow-sm">
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
      <main className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-black text-black leading-[1.1] mb-8">
              Plans for everyone
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Start free. Upgrade when you need.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg hover:-translate-y-2 transition-all duration-300">
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
                    <span className="text-gray-700 text-lg">Up to 2 projects</span>
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
                    <Check className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">Community support</span>
                  </li>
                </ul>

                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-white border-3 border-black text-black hover:bg-black hover:text-white transition-all duration-300 font-bold py-6 text-lg rounded-2xl shadow-bold">
                    Start Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-black text-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg hover:-translate-y-2 transition-all duration-300 relative">
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold mb-3">Pro</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-6xl font-bold">$9.9</span>
                    <span className="text-gray-300 text-xl">/month</span>
                  </div>
                  <p className="text-gray-300 text-lg">For power users and teams</p>
                </div>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-lg">Unlimited projects</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-lg">Unlimited tasks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-lg">Advanced collaboration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                    <span className="text-lg">Priority support</span>
                  </li>
                </ul>

                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-white text-black hover:bg-gray-100 transition-all duration-300 font-bold py-6 text-lg rounded-2xl shadow-bold">
                    Get Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-32 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-black text-center mb-16">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 shadow-bold-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Can I cancel anytime?</h3>
                <p className="text-gray-700 text-lg leading-relaxed font-medium">
                  Yes! You can cancel your Pro subscription at any time. Your Pro features will remain active until the end of your billing period.
                </p>
              </div>

              <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 shadow-bold-lg">
                <h3 className="text-2xl font-bold text-black mb-4">What happens to my data if I downgrade?</h3>
                <p className="text-gray-700 text-lg leading-relaxed font-medium">
                  Your data is always safe. Free users can have up to 2 projects. If you downgrade with more projects, you&apos;ll need to upgrade to create new ones.
                </p>
              </div>

              <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 shadow-bold-lg">
                <h3 className="text-2xl font-bold text-black mb-4">Do you offer team pricing?</h3>
                <p className="text-gray-700 text-lg leading-relaxed font-medium">
                  Currently, each team member needs their own Pro subscription. We&apos;re working on team pricing and will announce it soon!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
