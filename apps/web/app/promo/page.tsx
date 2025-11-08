"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Check, Sparkles } from "lucide-react"

export default function PromoCodePage() {
  const [code, setCode] = useState("")
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [codeInfo, setCodeInfo] = useState<any>(null)

  const validateCode = async () => {
    if (!code) return

    setValidating(true)
    try {
      const response = await fetch(`/api/promo/redeem?code=${code}`)
      const data = await response.json()

      if (data.valid) {
        setCodeInfo(data)
        toast.success("Valid promo code!")
      } else {
        setCodeInfo(null)
        toast.error(data.error || "Invalid promo code")
      }
    } catch (error) {
      toast.error("Failed to validate code")
    } finally {
      setValidating(false)
    }
  }

  const redeemCode = async () => {
    if (!code || !userId) {
      toast.error("Please enter both code and user ID")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Promo code redeemed successfully!")
        setCode("")
        setCodeInfo(null)
      } else {
        toast.error(data.error || "Failed to redeem code")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Redeem Promo Code
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Get free access to premium features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Your Promo Code</CardTitle>
            <CardDescription>
              Use a promo code to unlock premium features without payment
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Promo Code</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button
                  variant="outline"
                  onClick={validateCode}
                  disabled={!code || validating}
                >
                  {validating ? "Checking..." : "Validate"}
                </Button>
              </div>
            </div>

            {codeInfo && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Valid Code!
                    </p>
                    <ul className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                      <li>• Plan: {codeInfo.plan.toUpperCase()}</li>
                      <li>• Duration: {codeInfo.durationMonths ? `${codeInfo.durationMonths} months` : 'Lifetime'}</li>
                      {codeInfo.remainingUses && (
                        <li>• Remaining uses: {codeInfo.remainingUses}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">User ID</label>
              <Input
                placeholder="Enter your user ID (temporary for testing)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                For now, use any unique ID (e.g., &quot;test-user-123&quot;)
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              onClick={redeemCode}
              disabled={!code || !userId || loading}
            >
              {loading ? "Redeeming..." : "Redeem Code"}
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-4">Available Promo Codes (For Testing)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-white dark:bg-gray-700 rounded">
              <code className="font-mono">FREEPRO</code>
              <span className="text-gray-600 dark:text-gray-300">Pro (Lifetime, Unlimited)</span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-gray-700 rounded">
              <code className="font-mono">WELCOME2024</code>
              <span className="text-gray-600 dark:text-gray-300">Pro (12 months, Unlimited)</span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-gray-700 rounded">
              <code className="font-mono">TEAM50</code>
              <span className="text-gray-600 dark:text-gray-300">Team (6 months, 50 uses)</span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-gray-700 rounded">
              <code className="font-mono">LIFETIME</code>
              <span className="text-gray-600 dark:text-gray-300">Team (Lifetime, 10 uses)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
