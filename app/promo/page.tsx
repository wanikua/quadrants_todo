"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Check, Sparkles } from "lucide-react"
import { PageBackground } from "@/components/page-background"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

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
    <div className="min-h-screen bg-white relative overflow-hidden font-sans selection:bg-yellow-200">
      <PageBackground />
      <SiteHeader />

      <main className="pt-16 pb-20 px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-yellow-300 border-3 border-black rounded-2xl shadow-bold mb-6">
              <Sparkles className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-black mb-4 tracking-tight">
              Redeem <span className="text-highlight-yellow">Promo</span> Code
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              Get free access to premium features
            </p>
          </div>

          <div className="bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-10 shadow-bold-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black">Enter Your Promo Code</h2>
              <p className="text-gray-600 font-medium mt-1">
                Use a promo code to unlock premium features without payment
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">Promo Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="uppercase border-3 border-black rounded-xl h-12 text-lg bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black transition-all"
                  />
                  <Button
                    variant="outline"
                    onClick={validateCode}
                    disabled={!code || validating}
                    className="h-12 bg-white text-black border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow hover:bg-black hover:text-white transition-all"
                  >
                    {validating ? "Checking..." : "Validate"}
                  </Button>
                </div>
              </div>

              {codeInfo && (
                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-green-900">
                        Valid Code!
                      </p>
                      <ul className="text-sm text-green-700 font-medium mt-1 space-y-1">
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
                <label className="text-sm font-bold mb-2 block">User ID</label>
                <Input
                  placeholder="Enter your user ID (temporary for testing)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="border-3 border-black rounded-xl h-12 text-lg bg-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-black transition-all"
                />
                <p className="text-xs text-gray-500 font-medium mt-1">
                  For now, use any unique ID (e.g., &quot;test-user-123&quot;)
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full h-12 bg-black text-white border-3 border-black rounded-xl font-bold shadow-bold hover-lift-shadow transition-all"
                onClick={redeemCode}
                disabled={!code || !userId || loading}
              >
                {loading ? "Redeeming..." : "Redeem Code"}
              </Button>
            </div>
          </div>

          <div className="mt-8 bg-white border-3 border-black rounded-[2.5rem] p-8 md:p-10 shadow-bold-lg">
            <h3 className="text-xl font-bold mb-4">Available Promo Codes (For Testing)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black/10">
                <code className="font-mono font-bold">FREEPRO</code>
                <span className="text-gray-600 font-medium">Pro (Lifetime, Unlimited)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black/10">
                <code className="font-mono font-bold">WELCOME2024</code>
                <span className="text-gray-600 font-medium">Pro (12 months, Unlimited)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black/10">
                <code className="font-mono font-bold">TEAM50</code>
                <span className="text-gray-600 font-medium">Team (6 months, 50 uses)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border-2 border-black/10">
                <code className="font-mono font-bold">LIFETIME</code>
                <span className="text-gray-600 font-medium">Team (Lifetime, 10 uses)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
