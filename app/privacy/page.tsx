import { Metadata } from "next"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read about how Quadrants collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />

      <SiteHeader />

      {/* Main Content */}
      <main className="pt-16 pb-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <h1 className="text-5xl md:text-7xl font-black text-black leading-[1.1] mb-8">
              Privacy <span className="text-highlight-purple">Policy</span>
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Last updated: January 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12">
            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Information We <span className="text-highlight-yellow">Collect</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes your name, email address, and task data you create within Quadrants.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                How We <span className="text-highlight-purple">Use</span> Your Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4 font-medium">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 font-medium">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Data <span className="text-highlight-yellow">Security</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                We take reasonable measures to help protect your information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted in transit and at rest.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Your <span className="text-highlight-purple">Rights</span>
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us directly.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 shadow-bold-lg">
              <h2 className="text-2xl font-bold text-black mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                If you have any questions about this Privacy Policy, please contact us at{" "}
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
