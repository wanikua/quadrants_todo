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
    alert(`提交了: "${inputValue}" (第${submitCount + 1}次)`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>输入框测试页面</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="test-input" className="block text-sm font-medium mb-2">
              测试输入框：
            </label>
            <OptimizedInput
              id="test-input"
              placeholder="请输入一些文字..."
              value={inputValue}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="text-sm text-gray-600">
            <p>当前值: &quot;{inputValue}&quot;</p>
            <p>提交次数: {submitCount}</p>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!inputValue.trim()}
            className="w-full"
          >
            提交测试
          </Button>
          
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            <p>测试说明：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>输入文字后等待300ms会更新状态</li>
              <li>输入过程中页面不应该闪烁</li>
              <li>点击提交按钮测试表单功能</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
