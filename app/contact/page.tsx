import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Quadrants team for support, feedback, or business inquiries.",
}

export default function ContactPage() {
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
      <header className="relative bg-white/90 backdrop-blur-md z-50 shadow-sm">
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
      <main className="pt-16 pb-20 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-black text-black leading-[1.1] mb-8">
              Get in <span className="text-highlight-yellow">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-medium">
              Have questions? We&apos;d love to hear from you.
            </p>
          </div>

          {/* Contact Card */}
          <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 md:p-16 shadow-bold-lg text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>



            <p className="text-lg text-gray-700 leading-relaxed mb-8 font-medium">
              For support, questions, or feedback, send us an email.
            </p>

            <a
              href="mailto:contact@quadrants.ch"
              className="inline-block bg-black hover:bg-gray-800 text-white px-12 py-6 text-xl rounded-2xl font-bold transition-all duration-300 shadow-bold-lg hover-lift-shadow"
            >
              contact@quadrants.ch
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
