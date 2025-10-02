import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Target, Zap, ArrowRight, Sparkles, Star, Rocket } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-6000" />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Radial Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-transparent via-black/50 to-black pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative">
          <div className="container mx-auto px-4 py-24 md:py-32">
            <div className="mx-auto max-w-5xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm backdrop-blur-sm animate-pulse-slow">
                <Sparkles className="h-4 w-4 text-purple-400 animate-spin-slow" />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">
                  The Ultimate Productivity System
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="mb-6 text-6xl font-black tracking-tight md:text-8xl">
                <span className="block bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent animate-text-shimmer">
                  Master Your Tasks
                </span>
                <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Own Your Time
                </span>
              </h1>

              <p className="mb-12 text-xl text-gray-400 md:text-2xl max-w-3xl mx-auto leading-relaxed">
                Transform chaos into clarity.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="group relative h-14 px-8 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-xy" />
                    <span className="relative z-10 flex items-center">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base font-semibold bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm transition-all duration-300 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10">Sign In</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-purple-400 to-pink-400 animate-pulse-slow" />
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-blue-400 to-cyan-400 animate-pulse-slow animation-delay-1000" />
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-pink-400 to-orange-400 animate-pulse-slow animation-delay-2000" />
                  </div>
                  <span>
                    <span className="text-white font-bold">10,000+</span> active users
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400 animate-pulse-slow"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <span>
                    <span className="text-white font-bold">4.9/5</span> rating
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse-glow" />
        </section>

        {/* Benefits Section */}
        <section className="relative py-24">
          {/* Section Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
              <div>
                <h2 className="mb-6 text-4xl font-bold md:text-5xl">
                  <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Why Top Performers
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    Choose Quadrants
                  </span>
                </h2>
                <p className="mb-12 text-lg text-gray-400 leading-relaxed">
                  Join thousands who've transformed their productivity.
                </p>

                <div className="space-y-8">
                  <div className="flex gap-4 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all duration-300 group-hover:scale-110">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold">Productivity Boost</h3>
                      <p className="text-gray-400">Focus on high-impact activities that actually move the needle.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50 group-hover:shadow-pink-500/70 transition-all duration-300 group-hover:scale-110">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold">Crystal Clear Priorities</h3>
                      <p className="text-gray-400">
                        Make decisions instantly with a system that tells you exactly what to do next.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-all duration-300 group-hover:scale-110">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold">Stress-Free Execution</h3>
                      <p className="text-gray-400">
                        Reduce overwhelm with a clear roadmap. Know what matters and what doesn't.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50 group-hover:shadow-green-500/70 transition-all duration-300 group-hover:scale-110">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl font-bold">Achieve Your Goals</h3>
                      <p className="text-gray-400">
                        Align daily tasks with long-term objectives. Turn ambitious visions into reality.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-6">
                  {/* Stats Cards */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-black backdrop-blur-sm p-8 shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105 animate-float-slow">
                      <div className="mb-2 text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        95%
                      </div>
                      <div className="text-sm text-gray-400">Better focus reported</div>
                    </div>
                    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-black backdrop-blur-sm p-8 shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105 animate-float-slow animation-delay-1000">
                      <div className="mb-2 text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        3x
                      </div>
                      <div className="text-sm text-gray-400">Productivity increase</div>
                    </div>
                  </div>
                  <div className="space-y-6 pt-12">
                    <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-950/40 to-black backdrop-blur-sm p-8 shadow-xl hover:border-green-500/50 transition-all duration-300 hover:scale-105 animate-float-slow animation-delay-2000">
                      <div className="mb-2 text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        10k+
                      </div>
                      <div className="text-sm text-gray-400">Active users</div>
                    </div>
                    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/40 to-black backdrop-blur-sm p-8 shadow-xl hover:border-orange-500/50 transition-all duration-300 hover:scale-105 animate-float-slow animation-delay-3000">
                      <div className="mb-2 text-5xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        4.9★
                      </div>
                      <div className="text-sm text-gray-400">Average rating</div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl -z-10 animate-pulse-glow" />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="relative py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Trusted by Thousands
                </span>
              </h2>
              <p className="text-gray-400">See what our users are saying</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-black backdrop-blur-sm p-6 hover:border-purple-500/40 transition-all duration-300 hover:scale-105 animate-float-slow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">
                  "This app completely transformed how I work. I'm finally focusing on what actually matters instead of
                  fighting fires all day."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 animate-pulse-slow" />
                  <div>
                    <div className="text-sm font-semibold">Sarah Chen</div>
                    <div className="text-xs text-gray-500">Product Manager</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-black backdrop-blur-sm p-6 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 animate-float-slow animation-delay-1000">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">
                  "Quadrants was a game-changer for me, and this tool makes it effortless."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 animate-pulse-slow animation-delay-500" />
                  <div>
                    <div className="text-sm font-semibold">Marcus Johnson</div>
                    <div className="text-xs text-gray-500">Entrepreneur</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-950/20 to-black backdrop-blur-sm p-6 hover:border-pink-500/40 transition-all duration-300 hover:scale-105 animate-float-slow animation-delay-2000">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">
                  "I've tried dozens of productivity tools. This is the only one that actually stuck. Simple, powerful,
                  effective."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 animate-pulse-slow animation-delay-1000" />
                  <div>
                    <div className="text-sm font-semibold">Emily Rodriguez</div>
                    <div className="text-xs text-gray-500">Designer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30" />
          <div className="container mx-auto px-4 text-center relative">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-5xl font-black md:text-6xl">
                <span className="block bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Ready to Take Control?
                </span>
                <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Start Your Journey Today
                </span>
              </h2>
              <p className="mb-12 text-xl text-gray-400">
                Join 10,000+ users who have transformed their productivity with Quadrants
              </p>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="group relative h-16 px-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-xy" />
                  <span className="relative z-10 flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
              
            </div>
          </div>

          {/* Bottom glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        </section>
      </div>
    </div>
  )
}
