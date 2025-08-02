"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Sun, Moon, Coffee, Cherry, Zap } from "lucide-react"

type Theme = "day" | "night" | "coffee" | "sakura" | "cyberpunk"

const themes = {
  day: {
    name: "Day",
    icon: Sun,
    bg: "bg-white",
    cardBg: "bg-gray-50",
    text: "text-black",
    accent: "text-gray-600",
    border: "border-black",
    button: "bg-black text-white hover:bg-gray-800",
    input: "border-black bg-white text-black focus:ring-black",
    themeButton: "bg-gray-200 hover:bg-gray-300 text-black",
  },
  night: {
    name: "Night",
    icon: Moon,
    bg: "bg-black",
    cardBg: "bg-gray-900",
    text: "text-white",
    accent: "text-blue-400",
    border: "border-white",
    button: "bg-white text-black hover:bg-gray-200",
    input: "border-white bg-black text-white focus:ring-white",
    themeButton: "bg-gray-800 hover:bg-gray-700 text-white",
  },
  coffee: {
    name: "Coffee",
    icon: Coffee,
    bg: "bg-amber-50",
    cardBg: "bg-amber-100",
    text: "text-amber-900",
    accent: "text-amber-700",
    border: "border-amber-900",
    button: "bg-amber-900 text-amber-50 hover:bg-amber-800",
    input: "border-amber-900 bg-amber-50 text-amber-900 focus:ring-amber-900",
    themeButton: "bg-amber-200 hover:bg-amber-300 text-amber-900",
  },
  sakura: {
    name: "Sakura",
    icon: Cherry,
    bg: "bg-pink-50",
    cardBg: "bg-pink-100",
    text: "text-pink-900",
    accent: "text-pink-700",
    border: "border-pink-900",
    button: "bg-pink-900 text-pink-50 hover:bg-pink-800",
    input: "border-pink-900 bg-pink-50 text-pink-900 focus:ring-pink-900",
    themeButton: "bg-pink-200 hover:bg-pink-300 text-pink-900",
  },
  cyberpunk: {
    name: "Cyberpunk",
    icon: Zap,
    bg: "bg-gray-900",
    cardBg: "bg-black",
    text: "text-green-400",
    accent: "text-cyan-400",
    border: "border-green-400",
    button: "bg-green-400 text-black hover:bg-green-300",
    input: "border-green-400 bg-black text-green-400 focus:ring-green-400",
    themeButton: "bg-gray-800 hover:bg-gray-700 text-green-400",
  },
}

export default function Component() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("day")
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  })

  const theme = themes[currentTheme]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", { isLogin, formData })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ease-in-out ${theme.bg} ${theme.text} font-mono`}>
      {/* Theme Selector */}
      <div className="absolute top-4 right-4 flex gap-2">
        {Object.entries(themes).map(([key, themeData]) => {
          const IconComponent = themeData.icon
          return (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setCurrentTheme(key as Theme)}
              className={`${themeData.themeButton} transition-all duration-300 hover:scale-110 ${
                currentTheme === key ? "ring-2 ring-offset-2" : ""
              }`}
            >
              <IconComponent className="h-4 w-4" />
            </Button>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card
          className={`w-full max-w-md ${theme.cardBg} ${theme.border} border-2 transition-all duration-500 ease-in-out transform hover:scale-105`}
        >
          <CardHeader className="text-center">
            <CardTitle className={`text-2xl font-bold ${theme.text} transition-colors duration-300`}>
              {isLogin ? "LOGIN" : "SIGNUP"}
            </CardTitle>
            <CardDescription className={`${theme.accent} transition-colors duration-300`}>
              {isLogin ? "Access your account" : "Create new account"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2 animate-in slide-in-from-top duration-300">
                  <Label htmlFor="username" className={theme.text}>
                    USERNAME
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className={`${theme.input} transition-all duration-300 focus:scale-105`}
                    placeholder="Enter username"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className={theme.text}>
                  EMAIL
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`${theme.input} transition-all duration-300 focus:scale-105`}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className={theme.text}>
                  PASSWORD
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`${theme.input} pr-10 transition-all duration-300 focus:scale-105`}
                    placeholder="Enter password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`absolute right-0 top-0 h-full px-3 ${theme.text} hover:bg-transparent`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2 animate-in slide-in-from-top duration-300">
                  <Label htmlFor="confirmPassword" className={theme.text}>
                    CONFIRM PASSWORD
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`${theme.input} transition-all duration-300 focus:scale-105`}
                    placeholder="Confirm password"
                    required={!isLogin}
                  />
                </div>
              )}

              <Button
                type="submit"
                className={`w-full ${theme.button} transition-all duration-300 hover:scale-105 active:scale-95`}
              >
                {isLogin ? "LOGIN" : "CREATE ACCOUNT"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className={`${theme.text} hover:bg-transparent transition-all duration-300 hover:scale-105`}
              >
                {isLogin ? "Don't have an account? SIGNUP" : "Already have an account? LOGIN"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-10 left-10 w-4 h-4 ${theme.border} border-2 animate-pulse`} />
        <div className={`absolute top-20 right-20 w-6 h-6 ${theme.border} border-2 animate-bounce`} />
        <div className={`absolute bottom-20 left-20 w-3 h-3 ${theme.border} border-2 animate-ping`} />
        <div className={`absolute bottom-10 right-10 w-5 h-5 ${theme.border} border-2 animate-pulse`} />
      </div>
    </div>
  )
}
