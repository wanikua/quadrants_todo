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

        {/* Header — matches app header style */}
        <header className="relative bg-white/90 backdrop-blur-md z-50 border-b-2 border-black">
          <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="bg-white p-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px]">
                <Image src="/logo.png" alt="Quadrants Logo" width={32} height={32}
                  className="w-8 h-8 object-contain rounded" />
              </div>
              <span className="text-xl font-black text-black tracking-tight">Quadrants</span>
            </Link>
            <nav className="flex items-center gap-3">
              {isLoaded && isSignedIn ? (
                <Link href="/projects">
                  <Button className="bg-black text-white hover:bg-black/90 border-2 border-black rounded-xl px-5 py-1.5 h-auto text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="text-black hover:bg-gray-100 font-bold text-sm px-4 h-auto rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="bg-black text-white hover:bg-black/90 border-2 border-black rounded-xl px-5 py-1.5 h-auto text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="pt-16 pb-20 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">

            {/* Hero */}
            <div className="flex flex-col items-center text-center space-y-6 mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 border-2 border-black rounded-full px-4 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-slide-up">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-xs font-bold text-black">Now with AI Chatbot</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-black leading-[1.1] tracking-tight animate-slide-up max-w-4xl">
                Minimal Effort, <br className="hidden md:block" />
                <span className="bg-yellow-200 px-2 inline-block mt-2 border-2 border-black rounded-lg -rotate-1">Maximum Productivity</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
                AI organizes your priorities on the
                <span className="font-bold text-black"> Eisenhower Matrix</span> — so you always know what to do next.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/sign-up" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-12 px-8 text-base bg-black text-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all font-bold flex items-center justify-center gap-2 group">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all font-bold">
                    Sign In
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-400 pt-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                Free for personal use
              </p>

              {/* Hero Mockups */}
              <div className="mt-10 relative w-full max-w-3xl mx-auto hidden md:block animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-white to-transparent z-20" />
                <div className="relative z-10 flex items-center justify-center gap-6 p-6">
                  {/* Left Card - Bulk Input */}
                  <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] hover:rotate-0 transition-transform duration-500 w-[280px]">
                    <div className="flex items-center gap-3 mb-4 border-b-2 border-dashed border-gray-200 pb-3">
                      <div className="w-3 h-3 rounded-full bg-red-400 border border-black" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
                    </div>
                    <div className="space-y-3 font-mono text-xs text-gray-400">
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-black font-bold">Fix API bug</span> <span className="text-red-500">urgent</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-black font-bold">Plan Q2 roadmap</span> <span className="text-blue-500">important</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-black font-bold">Update team docs</span>
                      </div>
                      <div className="mt-2">
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200 text-[10px] font-bold">✨ AI analyzing...</span>
                      </div>
                    </div>
                  </div>
                  {/* Right Card - Task List */}
                  <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[2deg] hover:rotate-0 transition-transform duration-500 mt-10 w-[260px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">My Tasks</h3>
                      <span className="bg-yellow-200 text-black px-2.5 py-1 rounded-lg text-xs border-2 border-black font-bold">Q1</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="p-3 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-red-500 flex-shrink-0" />
                        <span className="font-bold text-sm">Fix API bug</span>
                        <span className="ml-auto text-xs text-red-500 font-bold">90</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border-2 border-black/20 flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex-shrink-0" />
                        <span className="font-medium text-sm">Plan Q2 roadmap</span>
                        <span className="ml-auto text-xs text-blue-500 font-bold">85</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border-2 border-black/10 flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-black bg-black flex-shrink-0" />
                        <span className="font-medium line-through text-gray-400 text-sm">Team standup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <section className="pt-8 pb-20">
              <div className="text-center mb-12 max-w-2xl mx-auto space-y-3">
                <span className="bg-purple-100 text-black px-3 py-1 rounded-full font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                  Features
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-black">
                  Everything you need to stay focused
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Grid3x3, title: "Eisenhower Matrix", desc: "Tasks mapped by urgency × importance. Your next move is always obvious.", color: "bg-blue-100" },
                  { icon: Zap, title: "AI Smart Organize", desc: "Paste tasks in natural language — AI assigns urgency & importance.", color: "bg-yellow-200" },
                  { icon: Users, title: "Team Collaboration", desc: "Share projects, assign members with colors, track progress.", color: "bg-green-100" },
                  { icon: CheckCircle2, title: "Bulk Capture", desc: "Add 10 tasks in 10 seconds. Type them all, AI handles the rest.", color: "bg-pink-100" },
                  { icon: Bot, title: "AI Chatbot", desc: "Manage tasks via chat. \"Add task: fix login bug\" just works.", color: "bg-indigo-100" },
                  { icon: Timer, title: "Focus Mode", desc: "Work through Q1 tasks one by one. No distractions.", color: "bg-orange-100" },
                  { icon: BarChart3, title: "Analytics", desc: "Track completion rates and productivity trends.", color: "bg-teal-100" },
                  { icon: Sparkles, title: "Learns From You", desc: "AI remembers your preferences and gets better over time.", color: "bg-violet-100" },
                ].map((f, i) => (
                  <div key={i} className="group bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                    <div className={`w-10 h-10 ${f.color} border-2 border-black rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform`}>
                      <f.icon className="w-5 h-5 text-black" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-base font-bold text-black mb-2">{f.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Deep Dive Sections */}
            <div className="space-y-20 py-16">

              {/* Interactive Demo */}
              <ScrollReveal animation="fade-in-up">
                <div className="bg-white border-2 border-black rounded-2xl p-6 md:p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <h2 className="text-3xl md:text-4xl font-black text-black leading-tight">
                        Stop wasting time <span className="bg-yellow-200 px-1 border-b-2 border-black">deciding</span>
                      </h2>
                      <p className="text-gray-600 leading-relaxed">
                        Every task lands exactly where it should. Drag to reprioritize. AI learns from your adjustments.
                      </p>
                      <ul className="space-y-2 pt-2">
                        {['Auto-prioritization by AI', 'Drag & drop to reprioritize', 'One-click task completion', 'Keyboard shortcuts'].map((item) => (
                          <li key={item} className="flex items-center gap-2 font-bold text-sm text-black">
                            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 size={12} />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="relative h-[280px] md:h-[360px] bg-gray-50 rounded-2xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2">
                      <QuadrantPlayground />
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* AI Chatbot Section */}
              <ScrollReveal animation="fade-in-up">
                <div className="bg-black border-2 border-black rounded-2xl p-6 md:p-12 text-white relative overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
                        <Bot className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-bold text-blue-300">AI Chatbot</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black leading-tight">
                        Manage tasks by talking
                      </h2>
                      <p className="text-gray-400 leading-relaxed">
                        Type in chat, get it done. Works right inside Quadrants.
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-sm">
                          <span className="text-blue-400">You:</span> <span className="text-gray-300">&quot;Add task: fix login bug, urgent&quot;</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-sm">
                          <span className="text-purple-400">AI:</span> <span className="text-gray-300">✅ Created in Q1 (U:90, I:85)</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 font-mono text-sm">
                          <span className="text-blue-400">You:</span> <span className="text-gray-300">&quot;What should I do today?&quot;</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <div className="w-64 bg-zinc-900 border-2 border-zinc-600 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-800 border-b border-zinc-700">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-sm font-bold text-zinc-200">Quadrants AI</span>
                        </div>
                        <div className="p-3 space-y-2.5 h-56">
                          <div className="flex justify-start"><div className="bg-zinc-800 px-3 py-2 rounded-xl rounded-bl-sm text-sm text-zinc-200">👋 How can I help?</div></div>
                          <div className="flex justify-end"><div className="bg-blue-600 px-3 py-2 rounded-xl rounded-br-sm text-sm text-white">Show Q1 tasks</div></div>
                          <div className="flex justify-start"><div className="bg-zinc-800 px-3 py-2 rounded-xl rounded-bl-sm text-sm text-zinc-200">🔴 3 urgent tasks:<br/>1. Fix API bug<br/>2. Deploy v2.0<br/>3. Meeting prep</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* AI Learning Section */}
              <ScrollReveal animation="fade-in-up">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="order-2 md:order-1">
                    <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-purple-100 border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-bold">AI Priority Engine</span>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { task: '"Fix login crash"', u: '92', i: '88', uc: 'bg-red-100 text-red-700', ic: 'bg-orange-100 text-orange-700' },
                          { task: '"Update docs"', u: '25', i: '72', uc: 'bg-green-100 text-green-700', ic: 'bg-blue-100 text-blue-700' },
                          { task: '"Buy coffee"', u: '15', i: '10', uc: 'bg-gray-100 text-gray-600', ic: 'bg-gray-100 text-gray-600' },
                        ].map((row) => (
                          <div key={row.task} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-sm font-mono flex-1">{row.task}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.uc}`}>U:{row.u}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.ic}`}>I:{row.i}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-3">Gets better with every adjustment ↗</p>
                    </div>
                  </div>
                  <div className="order-1 md:order-2 space-y-4 md:pl-6">
                    <span className="bg-purple-100 text-black px-3 py-1 rounded-full font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                      Smart AI
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-black leading-tight">
                      Intelligence that <span className="bg-purple-200 px-1 border-b-2 border-black">adapts to you</span>
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                      AI learns from every drag-and-drop. Move a task? AI remembers and adjusts future predictions.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Teams Section */}
              <ScrollReveal animation="fade-in-up">
                <div className="text-center max-w-3xl mx-auto space-y-4 bg-gray-50 border-2 border-black rounded-2xl p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-3xl md:text-4xl font-black text-black leading-tight">
                    Built for <span className="bg-green-200 px-1 border-b-2 border-black">teams</span>, perfect for solo
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Assign tasks with colors. Track who&apos;s doing what. Share projects with one link.
                  </p>
                  <div className="flex justify-center pt-2">
                    <div className="flex -space-x-2">
                      {["Felix", "Aneka", "Luna", "Oscar"].map((name, i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 hover:scale-110 hover:z-10 transition-transform">
                          <Image src={`https://api.dicebear.com/9.x/avataaars/png?seed=${name}`} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Desktop App Section */}
              <ScrollReveal animation="fade-in-up">
                <div className="bg-white border-2 border-black rounded-2xl p-6 md:p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-center max-w-2xl mx-auto space-y-4">
                    <span className="bg-green-100 text-black px-3 py-1 rounded-full font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                      🖥️ Desktop App
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-black leading-tight">
                      Native on <span className="bg-blue-200 px-1 border-b-2 border-black">macOS & Windows</span>
                    </h2>
                    <p className="text-gray-600">
                      Global shortcuts, native menus, window state persistence. Built with Tauri — fast & lightweight.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {['⌘N New Task', '⌘⇧F Focus', '⌘⇧O Organize'].map((shortcut) => (
                        <div key={shortcut} className="bg-gray-100 border-2 border-black rounded-xl px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <code className="text-xs font-mono font-bold text-black">{shortcut}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Final CTA */}
              <ScrollReveal animation="slide-up">
                <div className="bg-black border-2 border-black rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
                  <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                      No tutorials needed. <span className="bg-yellow-200 text-black px-2 rounded-lg border-2 border-black">Start in seconds.</span>
                    </h2>
                    <p className="text-lg text-white/80 leading-relaxed">
                      Long-press to create. Drag to prioritize. AI handles the rest.
                    </p>
                    <div className="pt-4">
                      <Link href="/sign-up">
                        <Button className="bg-white text-black hover:bg-gray-100 px-10 py-6 text-lg rounded-xl font-bold border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
                          Try it now <ArrowRight className="ml-2 h-5 w-5" />
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
