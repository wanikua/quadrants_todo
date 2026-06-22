import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission behind Quadrants and how we're simplifying task management with AI.",
}

export default function AboutPage() {
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
              About <span className="text-highlight-purple">Quadrants</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-medium">
              We believe productivity should be simple, not complicated.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-16">
            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 md:p-16 shadow-bold-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Our <span className="text-highlight-yellow">Mission</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                Quadrants was built to help people focus on what truly matters. We use the proven Eisenhower Matrix framework to help you prioritize tasks based on urgency and importance—without the complexity of traditional project management tools.
              </p>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 md:p-16 shadow-bold-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Why <span className="text-highlight-purple">Quadrants</span>?
              </h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed font-medium">
                <p>
                  Most task managers overwhelm you with features you don&apos;t need. Quadrants is different—it&apos;s designed to be minimal, intuitive, and powerful.
                </p>
                <p>
                  With a simple drag-and-drop interface and visual quadrants, you can instantly see what needs your attention right now, what can wait, and what you should delegate or eliminate.
                </p>
              </div>
            </div>

            <div className="bg-white border-3 border-black rounded-[2.5rem] p-10 md:p-16 shadow-bold-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Built for <span className="text-highlight-yellow">Everyone</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed font-medium">
                Whether you&apos;re a solo entrepreneur, a student managing assignments, or a team collaborating on projects—Quadrants adapts to your workflow without getting in the way.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center pt-8">
              <Link href="/sign-up">
                <Button className="bg-black text-white hover:bg-black/90 border-3 border-black rounded-2xl shadow-bold hover-lift-shadow font-bold h-16 px-12 text-xl transition-all">
                  Start Using Quadrants
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
