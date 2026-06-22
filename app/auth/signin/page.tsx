"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { signIn } from "@/app/auth/actions"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        router.push("/projects")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Sign in error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />
      <SiteHeader showNav={false} />
      <main className="relative z-10 flex items-center justify-center px-6 py-12 min-h-[calc(100vh-80px)]">
        <div className="bg-white border-3 border-black rounded-[2.5rem] shadow-bold-lg p-8 md:p-10 w-full max-w-md">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-black text-black text-center">Sign In</h1>
            <p className="text-gray-600 text-center font-medium">
              Enter your email and password to access your account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-red-900 bg-red-100 p-4 rounded-xl border-3 border-red-900 font-bold">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-black">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-3 border-black rounded-xl h-12 text-lg bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-black">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-3 border-black rounded-xl h-12 text-lg bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg bg-black text-white border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-center text-gray-600 font-medium">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="font-bold underline text-black">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
