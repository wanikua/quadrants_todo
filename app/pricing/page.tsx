"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for individuals getting started",
    features: [
      "1 project",
      "Unlimited tasks",
      "Basic support",
      "Mobile app access",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    priceYearly: "$120",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY || "",
    description: "For professionals managing multiple projects",
    features: [
      "10 projects",
      "Unlimited tasks",
      "Up to 5 team members",
      "Priority support",
      "Export data",
      "Advanced analytics",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    priceYearly: "$290",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM_MONTHLY || "",
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TEAM_YEARLY || "",
    description: "For teams that need unlimited everything",
    features: [
      "Unlimited projects",
      "Unlimited tasks",
      "Unlimited team members",
      "24/7 support",
      "Advanced analytics",
      "Custom integrations",
      "API access",
    ],
    cta: "Upgrade to Team",
    highlighted: false,
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId?: string, priceIdYearly?: string) => {
    if (!priceId) {
      toast.error("Please sign in to subscribe")
      return
    }

    const selectedPriceId = billingCycle === "yearly" ? priceIdYearly : priceId

    setLoading(selectedPriceId || "")

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId: selectedPriceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose the perfect plan for your team
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Start for free, upgrade when you need more
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-gray-700 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
              <span className="ml-2 text-sm text-green-600 dark:text-green-400">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.highlighted ? "border-2 border-blue-500 shadow-xl" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {billingCycle === "yearly" && plan.priceYearly ? plan.priceYearly : plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{billingCycle === "yearly" ? "year" : "month"}
                  </span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={!plan.priceId || loading === plan.priceId || loading === plan.priceIdYearly}
                  onClick={() => handleSubscribe(plan.priceId, plan.priceIdYearly)}
                >
                  {loading === plan.priceId || loading === plan.priceIdYearly
                    ? "Loading..."
                    : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            All plans include 14-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  )
}
