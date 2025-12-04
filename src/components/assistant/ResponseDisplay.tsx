"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AIResponse } from "@/types"

interface ResponseDisplayProps {
  response: AIResponse
}

export function ResponseDisplay({ response }: ResponseDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (response.code) {
      await navigator.clipboard.writeText(response.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Thoughts Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Thoughts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {response.thoughts}
          </p>
        </CardContent>
      </Card>

      {/* Code Section */}
      {response.code && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Code</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="code-block overflow-x-auto">
              <code>{response.code}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Key Points Section */}
      {response.keyPoints && response.keyPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {response.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-violet-500 mt-1">•</span>
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
