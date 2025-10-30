"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, User, Mail, CreditCard, Crown, LogOut, Sparkles, Check, Home } from "lucide-react"
import { useStripe } from "@/hooks/use-stripe"
import { STRIPE_CONFIG } from "@/lib/stripe-config"
import { useClerk } from "@clerk/nextjs"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  name: string
  created_at: string
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  subscription_status?: string | null
  subscription_plan?: string | null
  subscription_period_end?: string | null
}

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user: initialUser }: DashboardClientProps) {
  const router = useRouter()
  const { signOut } = useClerk()
  const [name, setName] = useState(initialUser.name)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { createCheckoutSession, manageBilling, loading: stripeLoading, error: stripeError } = useStripe()

  const isProUser = initialUser.subscription_plan === 'pro' &&
                    initialUser.subscription_status === 'active'
  const isFreeUser = !isProUser

  async function handleSignOut() {
    try {
      await signOut({ redirectUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/user/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update name")
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b-[3px] border-black/10">
        <div className="w-full px-[4%] md:px-[10%]">
          <div className="h-24 flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <Image
                src="/Original Logo Symbol.png"
                alt="Logo"
                width={70}
                height={70}
                className="w-[70px] h-[70px] object-contain transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-3"
              />
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/projects")}
                className="text-black hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-[600ms] font-bold text-base px-4 rounded-[15px]"
              >
                Projects
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-black hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-[600ms] font-bold text-base px-4 rounded-[15px]"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24"></div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-[4%] md:px-[10%] py-16">
        <h1 className="text-5xl md:text-6xl font-bold text-black mb-16 leading-[1.1]">
          <span className="text-highlight-yellow inline-block">Settings</span>
        </h1>
        <div className="space-y-10">
          {/* Profile Section */}
          <Card className="border-[3px] border-black shadow-xl rounded-[20px] bg-white">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center space-x-3 text-3xl font-bold text-black">
                <User className="w-7 h-7" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription className="text-lg text-gray-700 mt-3">
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Avatar */}
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24 text-3xl border-[3px] border-black">
                  <AvatarFallback className="bg-black text-white font-bold">
                    {getInitials(initialUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold text-black">{initialUser.name}</h3>
                  <p className="text-lg text-gray-700 mt-1">{initialUser.email}</p>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Name</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isLoading}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={initialUser.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                    Name updated successfully!
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || name.trim() === initialUser.name}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center space-x-2 rounded-full"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="border-[3px] border-black shadow-xl rounded-[20px] bg-white">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center space-x-3 text-3xl font-bold text-black">
                <Crown className="w-7 h-7" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription className="text-lg text-gray-700 mt-3">
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              {/* Current Plan */}
              <div className="p-8 bg-gray-50 rounded-[20px] border-[3px] border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    {isProUser ? (
                      <>
                        <Crown className="w-5 h-5 text-[#F45F00]" />
                        Pro Plan
                      </>
                    ) : (
                      'Free Plan'
                    )}
                  </h4>
                  <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {isProUser
                    ? 'You have access to all premium features including priority support and advanced collaboration.'
                    : 'Perfect for getting started'}
                </p>
                <ul className="space-y-3 text-base">
                  {!isProUser ? (
                    <>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Up to 3 projects</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Unlimited tasks</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Basic collaboration</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-black mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Mobile access</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Unlimited projects</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Unlimited tasks</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Advanced collaboration</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Priority support</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Custom themes</span>
                      </li>
                    </>
                  )}
                </ul>
                {isProUser && initialUser.subscription_period_end && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-muted-foreground">
                      Renews on {new Date(initialUser.subscription_period_end).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {isFreeUser ? (
                <div className="p-8 border-[3px] border-black bg-yellow-100 rounded-[20px] shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-7 h-7 text-black" />
                    <h4 className="font-bold text-black text-2xl">Upgrade to Pro</h4>
                  </div>
                  <p className="text-lg text-gray-900 mb-6 leading-relaxed">
                    Get <span className="text-highlight-yellow">unlimited projects</span>, advanced collaboration, priority support, and custom themes for just <span className="font-bold">$9.90/month</span>.
                  </p>
                  {stripeError && (
                    <div className="text-base text-red-900 bg-red-100 p-4 rounded-[10px] border-[3px] border-red-600 mb-4 font-medium">
                      {stripeError}
                    </div>
                  )}
                  <Button
                    onClick={() => createCheckoutSession(STRIPE_CONFIG.prices.pro_monthly)}
                    disabled={stripeLoading}
                    className="w-full bg-black hover:bg-gray-800 text-white transition-all duration-[1200ms] ease-[ease] font-bold shadow-xl hover:shadow-2xl rounded-[20px] px-8 py-6 text-xl hover:scale-[1.02]"
                  >
                    <Crown className="w-6 h-6 mr-3" />
                    {stripeLoading ? 'Loading...' : 'Upgrade to Pro - $9.90/month'}
                  </Button>
                  <div className="mt-6 text-center">
                    <p className="text-base text-gray-600 font-medium">
                      Have a promo code? You can enter it on the payment page
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-[3px] border-black rounded-[20px] bg-white">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-black" />
                  <p className="text-lg text-gray-700 mb-6 text-center leading-relaxed">
                    Manage your billing information, update payment methods, or cancel your subscription.
                  </p>
                  {stripeError && (
                    <div className="text-base text-red-900 bg-red-100 p-4 rounded-[10px] border-[3px] border-red-600 mb-4 font-medium">
                      {stripeError}
                    </div>
                  )}
                  <Button
                    onClick={manageBilling}
                    disabled={stripeLoading}
                    className="w-full border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-[1200ms] ease-[ease] font-bold text-lg rounded-[20px] px-6 py-4"
                  >
                    {stripeLoading ? 'Loading...' : 'Manage Billing'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-[3px] border-black shadow-xl rounded-[20px] bg-white">
            <CardHeader className="p-8">
              <CardTitle className="text-3xl font-bold text-black">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4 text-lg">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-[10px]">
                  <span className="text-gray-700 font-medium">Account ID:</span>
                  <span className="font-mono text-base text-black font-bold">{initialUser.id}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-[10px]">
                  <span className="text-gray-700 font-medium">Member since:</span>
                  <span className="text-black font-bold">{new Date(initialUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
