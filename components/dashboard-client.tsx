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
import { ArrowLeft, Save, User, Mail, CreditCard, Crown, LogOut, Sparkles } from "lucide-react"
import { useStripe } from "@/hooks/use-stripe"
import { STRIPE_CONFIG } from "@/lib/stripe"

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
      const response = await fetch('/api/auth/signout', { method: 'POST' })
      if (response.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error('Sign out error:', error)
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
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-20 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Original Logo Symbol.png"
              alt="Logo"
              width={64}
              height={64}
              className="w-16 h-16 object-contain"
            />
            <span className="text-xl font-semibold text-black">Quadrants</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" className="text-black hover:text-[#F45F00] transition-all duration-200 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
            <Button onClick={handleSignOut} variant="outline" className="border border-gray-200 text-black hover:bg-gray-50 transition-all duration-200 font-medium">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 md:px-20 py-12">
        <h1 className="text-4xl font-bold text-black mb-12">Settings</h1>
        <div className="space-y-8">
          {/* Profile Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20 text-2xl">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(initialUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{initialUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{initialUser.email}</p>
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
                  className="bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="w-5 h-5" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Plan */}
              <div className="p-4 bg-muted rounded-lg">
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
                    ? 'You have access to all premium features including priority support and advanced analytics.'
                    : 'You are currently on the free plan with unlimited projects and tasks.'}
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>Unlimited tasks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span>Team collaboration</span>
                  </li>
                  {isProUser && (
                    <>
                      <li className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-[#F45F00] rounded-full"></span>
                        <span className="text-[#F45F00] font-medium">Unlimited projects (no limits!)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-[#F45F00] rounded-full"></span>
                        <span className="text-[#F45F00] font-medium">Priority support</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-[#F45F00] rounded-full"></span>
                        <span className="text-[#F45F00] font-medium">Advanced analytics</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-[#F45F00] rounded-full"></span>
                        <span className="text-[#F45F00] font-medium">Custom integrations</span>
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
                <div className="p-6 border-2 border-[#F45F00]/20 bg-gradient-to-br from-orange-50 to-white rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-6 h-6 text-[#F45F00]" />
                    <h4 className="font-semibold text-lg">Upgrade to Pro</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get unlimited projects, priority support, advanced analytics, and custom integrations for just $9.90/month.
                  </p>
                  {stripeError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-4">
                      {stripeError}
                    </div>
                  )}
                  <Button
                    onClick={() => createCheckoutSession(STRIPE_CONFIG.prices.pro_monthly)}
                    disabled={stripeLoading}
                    className="w-full bg-[#F45F00] hover:bg-[#d64f00] text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {stripeLoading ? 'Loading...' : 'Upgrade to Pro - $9.90/month'}
                  </Button>
                </div>
              ) : (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <CreditCard className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Manage your billing information, update payment methods, or cancel your subscription.
                  </p>
                  {stripeError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-4">
                      {stripeError}
                    </div>
                  )}
                  <Button
                    onClick={manageBilling}
                    disabled={stripeLoading}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    {stripeLoading ? 'Loading...' : 'Manage Billing'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID:</span>
                  <span className="font-mono text-xs">{initialUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since:</span>
                  <span>{new Date(initialUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
