import { Metadata } from "next"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the terms and conditions for using the Quadrants AI task management service.",
}

export default function TermsPage() {
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
