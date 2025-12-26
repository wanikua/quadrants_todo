"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Grid3x3, Zap, Users, CheckCircle2 } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center animate-fade-out" style={{ animationDelay: '1.5s' }}>
          <div className="relative">
            <Image
              src="/Original Logo Symbol.png"
              alt="Loading"
              width={120}
              height={120}
              className="w-[120px] h-[120px] object-contain animate-pulse-scale"
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
          </div>
        </div>
      )}

      {/* 新的背景设计 - 保留 */}
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-200/40 via-purple-200/30 to-transparent rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-yellow-200/30 via-orange-200/20 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-purple-100/20 to-transparent rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-0" style={{
        backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Gradient fade near header */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white via-white to-transparent pointer-events-none z-10"></div>

      {/* 原有的Header样式 - 恢复 */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b-[3px] border-black/10">
        <div className="w-full px-[4%] md:px-[10%]">
          <div className="h-24 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <Image
                  src="/Original Logo Symbol.png"
                  alt="Logo"
                  width={70}
                  height={70}
                  className="w-[70px] h-[70px] md:h-[70px] object-contain transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-3"
                />
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-3 md:gap-4">
              {isLoaded && isSignedIn ? (
                <Link href="/projects">
                  <Button
                    size="default"
                    className="bg-black hover:bg-gray-800 text-white transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-bold shadow-lg hover:shadow-2xl h-auto px-6 md:px-8 py-3 md:py-4 rounded-[15px] md:rounded-[20px] hover:scale-[1.05] text-base md:text-lg"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="default"
                      className="text-black hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-bold text-base md:text-lg px-4 md:px-6 h-auto rounded-[15px]"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button
                      size="default"
                      className="bg-black hover:bg-gray-800 text-white transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] font-bold shadow-lg hover:shadow-2xl h-auto px-6 md:px-8 py-3 md:py-4 rounded-[15px] md:rounded-[20px] hover:scale-[1.05] text-base md:text-lg"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - 恢复原样式 */}
      <main className="pt-48 pb-32 px-[4%] md:px-[10%]">
        <div className="max-w-7xl mx-auto">
          {/* Heading */}
          <div className="text-center space-y-10 mb-24 relative z-10">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] animate-on-load animate-slide-up">
              <span className="text-gray-900">
                Minimal Effort,{" "}
              </span>
              <span className="text-highlight-yellow">
                Maximum Productivity
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-on-load animate-fade-in-up animation-delay-200">
              The simplest todo management. Yet the most <span className="text-highlight-purple">powerful</span>.
            </p>
          </div>

          {/* CTA Buttons - 恢复原样式 */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32 animate-on-load animate-fade-scale animation-delay-400 relative z-10">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-black hover:bg-gray-800 text-white px-12 py-8 text-xl rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease] shadow-lg hover:shadow-2xl hover:scale-[1.02]"
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="border-[3px] border-black text-black hover:bg-black hover:text-white px-12 py-8 text-xl rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease] hover:scale-[1.02]"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid - 保留彩色设计 */}
          <section id="features" className="mb-32">
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Everything you need to stay focused
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, powerful features designed to help you work on what truly matters.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {[
                {
                  icon: Grid3x3,
                  title: "Visual Overview",
                  description: "See all your tasks at a glance in the intuitive matrix view.",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Zap,
                  title: "AI Smart Organize",
                  description: "Let AI automatically categorize and prioritize your tasks.",
                  gradient: "from-yellow-500 to-orange-500"
                },
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description: "Work together in real-time with your team members.",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: CheckCircle2,
                  title: "Quick Capture",
                  description: "Add multiple tasks instantly with natural language input.",
                  gradient: "from-purple-500 to-pink-500"
                },
              ].map((feature, i) => (
                <div key={i} className="group text-center bg-white/50 backdrop-blur-sm rounded-[20px] p-8 hover:bg-white transition-all duration-300 hover:shadow-lg">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* User Experience Section - 恢复原样式 */}
          <div className="mt-48 space-y-32">
            {/* Section 1: Stop Wasting Time */}
            <ScrollReveal animation="fade-in-up">
              <div className="text-center max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                  Stop wasting time <span className="text-underline-curve">deciding</span> what to do next
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Every task lands exactly where it should. Your next move is always <span className="text-highlight-yellow">obvious</span>.
                </p>
              </div>
            </ScrollReveal>

            {/* Section 2: Visual Clarity */}
            <ScrollReveal animation="fade-scale" delay={100}>
              <div className="relative bg-white rounded-[20px] p-16 md:p-24 overflow-hidden border-[3px] border-black shadow-xl">
                {/* Decorative shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-gray-100/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/30 to-gray-100/30 rounded-full blur-3xl"></div>

                {/* SVG Illustration */}
                <div className="absolute top-8 right-8 w-32 h-32 opacity-20">
                  <Image
                    src="/assets/decor_sitting.png"
                    alt="Decoration"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                    See your <span className="text-highlight-yellow">entire workload</span> in one glance
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    No endless scrolling. No hidden tasks. Everything visible on one screen.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 3: Smart Features */}
            <ScrollReveal animation="fade-scale" delay={100}>
              <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[20px] p-16 md:p-24 overflow-hidden border-[3px] border-black shadow-xl">
                {/* Decorative shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-200/30 to-yellow-200/30 rounded-full blur-3xl"></div>

                {/* SVG Illustration */}
                <div className="absolute bottom-8 left-8 w-32 h-32 opacity-30">
                  <Image
                    src="/assets/decor_peeking.png"
                    alt="Decoration"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                    Intelligence that <span className="text-highlight-yellow">adapts to you</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                    AI learns your task patterns and preferences. Paste multiple tasks at once—AI analyzes and assigns optimal urgency and importance for each one.
                    <span className="text-highlight-purple"> Your priorities stay intact. Preview, accept, or revert. You're always in control.</span>
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Section 4: Team Collaboration */}
            <ScrollReveal animation="fade-in-up" delay={100}>
              <div className="text-center max-w-4xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold text-black leading-[1.1]">
                  Built for <span className="text-highlight-purple">teams</span>, perfect for solo
                </h2>
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                  Assign tasks with colors. Track who&apos;s doing what. <span className="text-highlight-yellow">Share projects</span>.
                  Or use it for personal productivity.
                </p>
              </div>
            </ScrollReveal>

            {/* Section 5: No Learning Curve */}
            <ScrollReveal animation="slide-up" delay={100}>
              <div className="relative bg-black rounded-[20px] p-16 md:p-24 text-center overflow-hidden shadow-2xl">
                <div className="max-w-4xl mx-auto space-y-10">
                  <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1]">
                    No tutorials needed. <span className="text-highlight-yellow">Start in seconds.</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                    Long-press to create. Click to edit.
                  </p>
                  <div className="pt-8">
                    <Link href="/sign-up">
                      <Button
                        size="lg"
                        className="bg-white text-black hover:bg-gray-100 px-12 py-8 text-xl rounded-[20px] font-bold transition-all duration-[1200ms] ease-[ease] shadow-xl hover:shadow-2xl hover:scale-[1.02]"
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

      <Footer />
    </div>
  )
}
