"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import OptimizedInput from "@/components/OptimizedInput"

interface AccessCodeFormProps {
  onAccessGranted: () => void
}

// You can change this access code to whatever you want
const VALID_ACCESS_CODE = "itsnotai"

const AccessCodeForm = React.memo(function AccessCodeForm({ onAccessGranted }: AccessCodeFormProps) {
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useIsMobile()

  const handleAccessCodeChange = useCallback((value: string) => {
    setAccessCode(value)
  }, [])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!accessCode.trim()) return
    
    setIsLoading(true)
    setError("")

    try {
      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (accessCode.trim() === VALID_ACCESS_CODE) {
        // Store access in localStorage
        localStorage.setItem("quadrant-access", "granted")
        onAccessGranted()
      } else {
        setError("Invalid access code. Please try again.")
        setIsLoading(false)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleButtonClick = useCallback(() => {
    handleSubmit()
  }, [accessCode])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className={`w-full ${isMobile ? "max-w-sm" : "max-w-md"}`}>
        <CardHeader className="text-center">
          <div
            className={`mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 ${isMobile ? "w-10 h-10" : "w-12 h-12"}`}
          >
            <Lock className={`text-blue-600 ${isMobile ? "w-5 h-5" : "w-6 h-6"}`} />
          </div>
          <CardTitle className={isMobile ? "text-xl" : "text-2xl"}>Access Required</CardTitle>
          <p className={`text-gray-600 ${isMobile ? "text-sm" : "text-base"}`}>Enter the access code to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="accessCode" className={isMobile ? "text-sm" : "text-base"}>
                Access Code
              </Label>
              <OptimizedInput
                id="accessCode"
                type="password"
                placeholder="Enter access code"
                value={accessCode}
                onChange={handleAccessCodeChange}
                disabled={isLoading}
                className={`mt-1 ${isMobile ? "h-12 text-base" : "h-10"}`}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className={isMobile ? "text-sm" : "text-base"}>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              onClick={handleButtonClick}
              className={`w-full ${isMobile ? "h-12 text-base" : "h-10"}`}
              disabled={isLoading || !accessCode.trim()}
            >
              {isLoading ? "Verifying..." : "Access App"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
})

export default AccessCodeForm
