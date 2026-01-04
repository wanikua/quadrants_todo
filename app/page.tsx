"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Grid3x3, Zap, Users, CheckCircle2 } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { ProductHuntBadge } from "@/components/product-hunt-badge"
import QuadrantPlayground from "@/components/QuadrantPlayground"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn, isLoaded } = useUser()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Quadrants",
    "description": "AI-powered task management. Minimal effort, maximum productivity.",
    "url": "https://quadrants.ch",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    },
    "logo": {
      "@type": "ImageObject",
      "url": "https://quadrants.ch/logo.png",
      "width": 1200,
      "height": 1200
    },
    "screenshot": "https://quadrants.ch/logo.png",
    "creator": {
      "@type": "Organization",
      "name": "Quadrants",
      "url": "https://quadrants.ch"
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center animate-fade-out" style={{ animationDelay: '1.2s' }}>
          <div className="relative animate-bounce-gentle">
            <Image
              src="/logo.png"
              alt="Loading"
              width={100}
              height={100}
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>
      )}

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
            <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-black/10">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              />
            </div>
            <span className="text-2xl font-black text-black tracking-tight">Quadrants</span>
          </Link>

          <nav className="flex items-center gap-4">
            {isLoaded && isSignedIn ? (
              <Link href="/projects">
                <Button className="bg-black text-white hover:bg-black/90 border-2 border-black shadow-bold-sm hover-lift-shadow font-bold rounded-xl px-6 py-2 h-auto text-base transition-all">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
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
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* Hero Section */}
          <div className="flex flex-col items-center text-center space-y-8 mb-4 lg:mb-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black leading-[1.1] tracking-tight animate-slide-up max-w-5xl">
              Minimal Effort, <br className="hidden md:block" />
              <span className="text-highlight-yellow inline-block mt-2 transform -rotate-1">Maximum Productivity</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The simplest todo management. Yet the most <span className="font-bold text-black relative inline-block">powerful<span className="absolute bottom-1 left-0 w-full h-3 bg-purple-200/50 -z-10 -rotate-1 rounded-sm"></span></span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-16 px-10 text-xl bg-black text-white border-3 border-black rounded-2xl shadow-bold hover-lift-shadow transition-all font-bold flex items-center justify-center gap-2 group">
                  Get Started Free
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-16 px-10 text-xl bg-white text-black border-3 border-black rounded-2xl shadow-bold hover-lift-shadow transition-all font-bold">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Hero Image / Decoration */}
            <div className="mt-16 relative w-full max-w-4xl mx-auto aspect-[16/9] hidden md:block animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-white to-transparent z-20"></div>
              <div className="relative z-10 flex items-center justify-center gap-6 p-8">
                {/* Floating Mockup Card Left - Bulk Add Simulation */}
                <div className="bg-white border-3 border-black rounded-3xl p-8 shadow-bold rotate-[-2deg] hover:rotate-0 transition-transform duration-500 w-[320px]">
                  <div className="flex items-center gap-4 mb-5 border-b-2 border-dashed border-gray-100 pb-4">
                    <div className="w-4 h-4 rounded-full bg-red-400 border border-black"></div>
                    <div className="w-4 h-4 rounded-full bg-yellow-400 border border-black"></div>
                  </div>
                  <div className="space-y-4 font-mono text-xs leading-tight text-gray-400">
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <span className="text-black font-bold">Fix API bug</span> <span className="text-red-500">urgent</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <span className="text-black font-bold">Buy groceries</span> <span className="text-blue-500">today</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200 text-[10px] font-bold">AI Parsing...</span>
                    </div>
                  </div>
                </div>
                {/* Floating Mockup Card Right */}
                <div className="bg-white border-3 border-black rounded-3xl p-8 shadow-bold rotate-[2deg] hover:rotate-0 transition-transform duration-500 mt-12 w-[300px]">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <h3 className="font-bold text-xl">My Tasks</h3>
                    <span className="bg-yellow-100 text-black px-3 py-1.5 rounded-md text-sm border-2 border-black font-bold flex-shrink-0">Urgent</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transform hover:-translate-y-1 transition-transform">
                      <div className="w-5 h-5 rounded-full border-2 border-black flex-shrink-0"></div>
                      <span className="font-bold text-sm">Code review</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border-2 border-black/10 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-black bg-black flex-shrink-0"></div>
                      <span className="font-medium line-through text-gray-400 text-sm">Gym workout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <section className="pt-8 pb-24 relative">
            <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
              <span className="bg-purple-100 text-purple-900 px-4 py-1.5 rounded-full font-bold text-sm border-2 border-purple-200 inline-block mb-2">
                Powerful Features
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-black">
                Everything you need to <span className="relative inline-block">stay focused<svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-300 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" /></svg></span>
              </h2>
              <p className="text-xl text-gray-600">
                Simple, powerful features designed to help you work on what truly matters.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Grid3x3,
                  title: "Visual Overview",
                  description: "See all your tasks at a glance in the intuitive matrix view.",
                  color: "bg-blue-100",
                  iconColor: "text-blue-600"
                },
                {
                  icon: Zap,
                  title: "AI Smart Organize",
                  description: "Let AI automatically categorize and prioritize your tasks.",
                  color: "bg-yellow-100",
                  iconColor: "text-yellow-600"
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description: "Work together in real-time with your team members.",
                  color: "bg-green-100",
                  iconColor: "text-green-600"
                },
                {
                  icon: CheckCircle2,
                  title: "Quick Capture",
                  description: "Add multiple tasks instantly with natural language input.",
                  color: "bg-pink-100",
                  iconColor: "text-pink-600"
                },
              ].map((feature, i) => (
                <div key={i} className="group bg-white border-3 border-black rounded-3xl p-8 hover:shadow-bold transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-14 h-14 ${feature.color} border-3 border-black rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Deep Dive Sections */}
          <div className="space-y-32 py-24">

            {/* Section 1 */}
            <ScrollReveal animation="fade-in-up">
              <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-16 shadow-bold-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight">
                      Stop wasting time <span className="text-highlight-yellow">deciding</span> what to do next
                    </h2>
                    <p className="text-xl text-gray-700 leading-relaxed font-medium">
                      Every task lands exactly where it should. Your next move is always obvious.
                    </p>
                    <ul className="space-y-3 pt-4">
                      {['Auto-prioritization', 'Clear next steps', 'Focus mode'].map((item) => (
                        <li key={item} className="flex items-center gap-3 font-bold text-gray-800">
                          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">
                            <CheckCircle2 size={14} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative h-[300px] md:h-[400px] bg-gray-50 rounded-3xl p-2 shadow-bold-sm rotate-1 group-hover:rotate-0 transition-transform duration-500">
                    <QuadrantPlayground />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 2 */}
            <ScrollReveal animation="fade-in-up">
              <div className="bg-black rounded-[2.5rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden text-center">
                <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                    See your <span className="text-yellow-400">entire workload</span> in one glance
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                    No endless scrolling. No hidden tasks. Everything visible on one screen.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 3 */}
            <ScrollReveal animation="fade-in-up">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-3xl blur-2xl opacity-50 transform rotate-3"></div>
                  <div className="relative bg-white border-3 border-black rounded-3xl p-8 shadow-bold hover:rotate-1 transition-transform duration-500 overflow-hidden">
                    <Image
                      src="/assets/feature_smart.png"
                      alt="AI Intelligence"
                      width={400}
                      height={300}
                      className="w-full h-auto object-contain relative z-10"
                      onError={(e) => {
                        // Fallback if image fails, showing a placeholder UI
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Fallback geometric if image missing (ensures layout stability) */}
                    <div className="absolute inset-0 bg-yellow-50 flex flex-row items-start justify-center px-6 pt-48 pb-4 gap-4">
                      <div className="flex-1 bg-white border-2 border-black rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Input</span>
                        </div>
                        <p className="font-mono text-sm">"Meeting with Tom at 2pm"</p>
                      </div>
                      <ArrowRight className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 bg-purple-100 border-2 border-purple-300 rounded-xl p-4 shadow-sm flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">AI Sorted</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-white rounded border border-purple-200 text-xs font-bold">Important</span>
                          <span className="px-2 py-1 bg-white rounded border border-purple-200 text-xs font-bold">14:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2 space-y-6 pl-0 md:pl-8">
                  <div className="inline-block bg-purple-100 text-purple-700 px-4 py-1 rounded-full font-bold text-sm border-2 border-purple-200">
                    Smart AI
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight">
                    Intelligence that <span className="text-highlight-purple">adapts to you</span>
                  </h2>
                  <p className="text-xl text-gray-700 leading-relaxed font-medium">
                    AI learns your task patterns and preferences. Paste multiple tasks at once—AI analyzes and assigns optimal urgency and importance for each one.
                  </p>
                  <p className="text-lg text-gray-600 italic border-l-4 border-purple-300 pl-4">
                    Your priorities stay intact. Preview, accept, or revert. You're always in control.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 4 */}
            <ScrollReveal animation="fade-in-up">
              <div className="text-center max-w-4xl mx-auto space-y-8 bg-gray-50 border-3 border-black rounded-[2.5rem] p-12">
                <h2 className="text-4xl md:text-6xl font-black text-black leading-[1.1]">
                  Built for <span className="text-highlight-green">teams</span>, perfect for solo
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium">
                  Assign tasks with colors. Track who&apos;s doing what. <span className="text-highlight-yellow">Share projects</span>.
                  Or use it for personal productivity.
                </p>
                <div className="flex flex-col items-center gap-3 pt-4">
                  <div className="flex -space-x-3">
                    {[
                      { seed: "Felix" },
                      { seed: "Aneka" },
                      { seed: "Luna" },
                      { seed: "Oscar" }
                    ].map((user, index) => (
                      <div key={index} className="w-12 h-12 rounded-full border-3 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 transition-transform hover:scale-110 hover:z-10">
                        <Image
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.seed}`}
                          alt={`Team member ${index + 1}`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-3 border-white bg-black text-white flex items-center justify-center font-bold shadow-md z-10 text-sm">
                      26+
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-bold text-black">+26 more</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Final CTA */}
            <ScrollReveal animation="slide-up">
              <div className="relative bg-black rounded-[2.5rem] p-16 md:p-24 text-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 border-4 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 border-4 border-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1]">
                    No tutorials needed. <span className="text-highlight-yellow">Start in seconds.</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-light">
                    Long-press to create. Click to edit.
                  </p>
                  <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
                    <Link href="/sign-up">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-100 hover:scale-105 px-12 py-8 text-xl rounded-2xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] border-4 border-white"
                      >
                        Try it now
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

      <ProductHuntBadge />

      <Footer />
    </div>
  )
}
