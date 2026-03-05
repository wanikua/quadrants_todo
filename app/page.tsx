"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Grid3x3, Zap, Users, CheckCircle2, Bot, Sparkles, Timer, BarChart3 } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Footer } from "@/components/footer"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import QuadrantPlayground from "@/components/QuadrantPlayground"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const { isSignedIn, isLoaded } = useUser()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Quadrants",
    "description": "AI-powered task management using the Eisenhower Matrix. Minimal effort, maximum productivity.",
    "url": "https://quadrants.ch",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, macOS, Windows",
    "offers": [
      { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free plan" },
      { "@type": "Offer", "price": "9.99", "priceCurrency": "USD", "description": "Pro plan" }
    ],
    "featureList": [
      "Eisenhower Matrix visualization",
      "AI task prioritization",
      "Natural language bulk input",
      "Team collaboration",
      "Desktop app (macOS/Windows)",
      "Chatbot integration"
    ],
    "logo": "https://quadrants.ch/logo.png",
    "creator": { "@type": "Organization", "name": "Quadrants", "url": "https://quadrants.ch" }
  }

  return (
    <>
      <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center animate-fade-out" style={{ animationDelay: '1.2s' }}>
            <div className="relative animate-bounce-gentle">
              <Image src="/logo.png" alt="Loading" width={100} height={100} className="w-24 h-24 object-contain" />
            </div>
          </div>
        )}

        {/* Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-blue-100/40 rounded-full blur-[100px] animate-float opacity-70" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-yellow-100/40 rounded-full blur-[100px] animate-float opacity-70" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-[0.4]" style={{
            backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Header */}
        <header className="relative bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="group relative flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-xl border-2 border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-black/10">
                <Image src="/logo.png" alt="Quadrants Logo" width={40} height={40}
                  className="w-10 h-10 object-contain rounded-lg transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
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

        <main className="pt-16 pb-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">

            {/* Hero */}
            <div className="flex flex-col items-center text-center space-y-8 mb-4 lg:mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-full px-5 py-2 animate-slide-up">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-700">Now with AI Chatbot Integration</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-black leading-[1.1] tracking-tight animate-slide-up max-w-5xl">
                Minimal Effort, <br className="hidden md:block" />
                <span className="text-highlight-yellow inline-block mt-2 transform -rotate-1">Maximum Productivity</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
                The smartest way to manage tasks. AI organizes your priorities on the
                <span className="font-bold text-black"> Eisenhower Matrix</span> — so you always know what to do next.
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

              {/* Tagline */}
              <p className="text-sm text-gray-400 pt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                Free forever for personal use • No credit card required
              </p>

              {/* Hero Mockups */}
              <div className="mt-12 relative w-full max-w-4xl mx-auto hidden md:block animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-white to-transparent z-20" />
                <div className="relative z-10 flex items-center justify-center gap-6 p-8">
                  {/* Left Card - Bulk Input */}
                  <div className="bg-white border-3 border-black rounded-3xl p-8 shadow-bold rotate-[-2deg] hover:rotate-0 transition-transform duration-500 w-[320px]">
                    <div className="flex items-center gap-4 mb-5 border-b-2 border-dashed border-gray-100 pb-4">
                      <div className="w-4 h-4 rounded-full bg-red-400 border border-black" />
                      <div className="w-4 h-4 rounded-full bg-yellow-400 border border-black" />
                    </div>
                    <div className="space-y-4 font-mono text-xs leading-tight text-gray-400">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <span className="text-black font-bold">Fix API bug</span> <span className="text-red-500">urgent</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <span className="text-black font-bold">Plan Q2 roadmap</span> <span className="text-blue-500">important</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <span className="text-black font-bold">Update team docs</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full border border-purple-200 text-[10px] font-bold">✨ AI analyzing priorities...</span>
                      </div>
                    </div>
                  </div>
                  {/* Right Card - Matrix Preview */}
                  <div className="bg-white border-3 border-black rounded-3xl p-8 shadow-bold rotate-[2deg] hover:rotate-0 transition-transform duration-500 mt-12 w-[300px]">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <h3 className="font-bold text-xl">My Tasks</h3>
                      <span className="bg-yellow-100 text-black px-3 py-1.5 rounded-md text-sm border-2 border-black font-bold flex-shrink-0">Q1</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transform hover:-translate-y-1 transition-transform">
                        <div className="w-5 h-5 rounded-full border-2 border-red-500 flex-shrink-0" />
                        <span className="font-bold text-sm">Fix API bug</span>
                        <span className="ml-auto text-xs text-red-500 font-bold">90</span>
                      </div>
                      <div className="p-4 bg-white rounded-xl border-2 border-black/10 flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex-shrink-0" />
                        <span className="font-medium text-sm">Plan Q2 roadmap</span>
                        <span className="ml-auto text-xs text-blue-500 font-bold">85</span>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border-2 border-black/10 flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-black bg-black flex-shrink-0" />
                        <span className="font-medium line-through text-gray-400 text-sm">Team standup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid - 8 features */}
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
                  { icon: Grid3x3, title: "Eisenhower Matrix", description: "See all tasks mapped by urgency × importance. Your next move is always obvious.", color: "bg-blue-100", iconColor: "text-blue-600" },
                  { icon: Zap, title: "AI Smart Organize", description: "Paste tasks in natural language — AI assigns urgency & importance automatically.", color: "bg-yellow-100", iconColor: "text-yellow-600" },
                  { icon: Users, title: "Team Collaboration", description: "Share projects, assign members with colors, track who's doing what in real-time.", color: "bg-green-100", iconColor: "text-green-600" },
                  { icon: CheckCircle2, title: "Bulk Capture", description: "Add 10 tasks in 10 seconds. Type them all at once, AI handles the rest.", color: "bg-pink-100", iconColor: "text-pink-600" },
                  { icon: Bot, title: "AI Chatbot", description: "Manage tasks via chat — \"add a task: fix login bug\" just works.", color: "bg-indigo-100", iconColor: "text-indigo-600" },
                  { icon: Timer, title: "Focus Mode", description: "Work through Q1 tasks one by one. No distractions, just execution.", color: "bg-orange-100", iconColor: "text-orange-600" },
                  { icon: BarChart3, title: "Analytics", description: "Track completion rates, time distribution, and productivity trends.", color: "bg-teal-100", iconColor: "text-teal-600" },
                  { icon: Sparkles, title: "Learns From You", description: "AI remembers your preferences and gets better at predicting priorities.", color: "bg-violet-100", iconColor: "text-violet-600" },
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

              {/* Interactive Demo */}
              <ScrollReveal animation="fade-in-up">
                <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-16 shadow-bold-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100/50 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight">
                        Stop wasting time <span className="text-highlight-yellow">deciding</span> what to do next
                      </h2>
                      <p className="text-xl text-gray-700 leading-relaxed font-medium">
                        Every task lands exactly where it should. Drag to reprioritize. AI learns from your adjustments.
                      </p>
                      <ul className="space-y-3 pt-4">
                        {['Auto-prioritization by AI', 'Drag & drop to reprioritize', 'One-click task completion', 'Keyboard shortcuts (Cmd+N, Cmd+F)'].map((item) => (
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

              {/* AI Chatbot Section (NEW) */}
              <ScrollReveal animation="fade-in-up">
                <div className="bg-gradient-to-br from-indigo-950 to-black rounded-[2.5rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />
                  <div className="absolute top-10 right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                        <Bot className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-blue-300">NEW: AI Chatbot</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                        Manage tasks by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">talking</span>
                      </h2>
                      <p className="text-xl text-gray-300 leading-relaxed">
                        Type in chat, get it done. Works in Discord, Signal, or right inside Quadrants.
                      </p>
                      <div className="space-y-3 pt-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm">
                          <span className="text-blue-400">You:</span> <span className="text-gray-300">&quot;Add task: fix login bug, urgent&quot;</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm">
                          <span className="text-purple-400">AI:</span> <span className="text-gray-300">✅ Created in Q1 (urgency: 90, importance: 85)</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm">
                          <span className="text-blue-400">You:</span> <span className="text-gray-300">&quot;What should I do today?&quot;</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <div className="w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-sm font-medium text-zinc-200">Quadrants AI</span>
                        </div>
                        <div className="p-4 space-y-3 h-64">
                          <div className="flex justify-start"><div className="bg-zinc-800 px-3 py-2 rounded-xl rounded-bl-md text-sm text-zinc-200 max-w-[85%]">👋 How can I help?</div></div>
                          <div className="flex justify-end"><div className="bg-blue-600 px-3 py-2 rounded-xl rounded-br-md text-sm text-white max-w-[85%]">Show Q1 tasks</div></div>
                          <div className="flex justify-start"><div className="bg-zinc-800 px-3 py-2 rounded-xl rounded-bl-md text-sm text-zinc-200 max-w-[85%]">🔴 3 urgent+important tasks:<br/>1. Fix API bug<br/>2. Deploy v2.0<br/>3. Client meeting prep</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* AI Learning Section */}
              <ScrollReveal animation="fade-in-up">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-3xl blur-2xl opacity-50 transform rotate-3" />
                    <div className="relative bg-white border-3 border-black rounded-3xl p-8 shadow-bold hover:rotate-1 transition-transform duration-500 overflow-hidden">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 border-2 border-purple-300 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-bold text-lg">AI Priority Engine</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-sm font-mono flex-1">&quot;Fix login crash&quot;</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex gap-1">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">U:92</span>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">I:88</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-sm font-mono flex-1">&quot;Update docs&quot;</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex gap-1">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">U:25</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">I:72</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                            <span className="text-sm font-mono flex-1">&quot;Buy coffee&quot;</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex gap-1">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">U:15</span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">I:10</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Accuracy improves with every task you adjust ↗</p>
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
                      AI learns from every drag-and-drop. Move a task? AI remembers your preference and adjusts future predictions.
                    </p>
                    <p className="text-lg text-gray-600 italic border-l-4 border-purple-300 pl-4">
                      Your priorities, your rules. AI just makes it faster.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Teams Section */}
              <ScrollReveal animation="fade-in-up">
                <div className="text-center max-w-4xl mx-auto space-y-8 bg-gray-50 border-3 border-black rounded-[2.5rem] p-12">
                  <h2 className="text-4xl md:text-6xl font-black text-black leading-[1.1]">
                    Built for <span className="text-highlight-green">teams</span>, perfect for solo
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium">
                    Assign tasks with colors. Track who&apos;s doing what. <span className="text-highlight-yellow">Share projects</span> with one link.
                  </p>
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <div className="flex -space-x-3">
                      {["Felix", "Aneka", "Luna", "Oscar"].map((name, i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-3 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 transition-transform hover:scale-110 hover:z-10">
                          <Image src={`https://api.dicebear.com/9.x/avataaars/png?seed=${name}`} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Desktop App Section (NEW) */}
              <ScrollReveal animation="fade-in-up">
                <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-16 shadow-bold-lg relative overflow-hidden">
                  <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200 rounded-full px-4 py-2">
                      <span className="text-sm font-bold text-green-700">🖥️ Desktop App</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-black leading-tight">
                      Native on <span className="text-highlight-blue">macOS & Windows</span>
                    </h2>
                    <p className="text-xl text-gray-600">
                      Global shortcuts (Cmd+N), native menus, window state persistence. Built with Tauri — fast, lightweight, no Electron bloat.
                    </p>
                    <div className="flex justify-center gap-6 pt-4">
                      {['Cmd+N New Task', 'Cmd+Shift+F Focus', 'Cmd+Shift+O Organize'].map((shortcut) => (
                        <div key={shortcut} className="bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-2">
                          <code className="text-sm font-mono font-bold text-gray-700">{shortcut}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Final CTA */}
              <ScrollReveal animation="slide-up">
                <div className="relative bg-black rounded-[2.5rem] p-16 md:p-24 text-center overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0" />
                  <div className="absolute top-0 left-0 w-32 h-32 border-4 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 border-4 border-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
                  <div className="relative z-10 max-w-4xl mx-auto space-y-10">
                    <h2 className="text-4xl md:text-6xl font-bold text-white leading-[1.1]">
                      No tutorials needed. <span className="text-highlight-yellow">Start in seconds.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-light">
                      Long-press to create. Drag to prioritize. AI handles the rest.
                    </p>
                    <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
                      <Link href="/sign-up">
                        <Button size="lg" className="bg-white text-black hover:bg-gray-100 hover:scale-105 px-12 py-8 text-xl rounded-2xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] border-4 border-white">
                          Try it now <ArrowRight className="ml-3 h-6 w-6" />
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
    </>
  )
}
