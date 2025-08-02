"use client"

import React, { useCallback } from "react"
import { Input } from "@/components/ui/input"

interface OptimizedInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  type?: string
}

const OptimizedInput = React.memo(function OptimizedInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
  type = "text",
}: OptimizedInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  return (
    <Input
      id={id}
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
})

export default OptimizedInput
