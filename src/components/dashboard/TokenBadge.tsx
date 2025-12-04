"use client"

import { Coins } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TokenBadgeProps {
  tokens: number
  className?: string
}

export function TokenBadge({ tokens, className }: TokenBadgeProps) {
  const variant = tokens <= 0 ? "destructive" : tokens <= 5 ? "warning" : "success"

  return (
    <Badge variant={variant} className={className}>
      <Coins className="mr-1 h-3 w-3" />
      {tokens} tokens
    </Badge>
  )
}
