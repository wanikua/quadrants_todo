"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import OptimizedInput from "@/components/OptimizedInput"

export default function TestPage() {
  const [inputValue, setInputValue] = useState("")
  const [submitCount, setSubmitCount] = useState(0)

  const handleInputChange = (value: string) => {
    console.log("Input changed to:", value)
    setInputValue(value)
  }

  const handleSubmit = () => {
    console.log("Submitting:", inputValue)
    setSubmitCount(prev => prev + 1)
    alert(`Submitted: "${inputValue}" (${submitCount + 1}${submitCount === 0 ? 'st' : submitCount === 1 ? 'nd' : submitCount === 2 ? 'rd' : 'th'} time)`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Input Field Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="test-input" className="block text-sm font-medium mb-2">
              Test Input Field:
            </label>
            <OptimizedInput
              id="test-input"
              placeholder="Enter some text..."
              value={inputValue}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Current value: &quot;{inputValue}&quot;</p>
            <p>Submit count: {submitCount}</p>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="w-full"
          >
            Submit Test
          </Button>
          
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            <p>Test Instructions:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>After typing, wait 300ms for the state to update</li>
              <li>The page should not flicker during input</li>
              <li>Click the submit button to test form functionality</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
