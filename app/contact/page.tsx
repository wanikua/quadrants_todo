import { Metadata } from "next"
import { Mail } from "lucide-react"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Quadrants team for support, feedback, or business inquiries.",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />

      <SiteHeader />

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
