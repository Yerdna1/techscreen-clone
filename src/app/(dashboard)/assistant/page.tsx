"use client"

import { useState, useEffect } from "react"
import { AssistantPanel } from "@/components/assistant/AssistantPanel"
import { TokenBadge } from "@/components/dashboard/TokenBadge"
import { KEYBOARD_SHORTCUTS } from "@/config/pricing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Keyboard, Loader2 } from "lucide-react"

export default function AssistantPage() {
  const [tokens, setTokens] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch real token balance from API
  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await fetch("/api/billing")
        if (response.ok) {
          const data = await response.json()
          // Tokens are nested inside user object
          setTokens(data.user?.tokens ?? 0)
        }
      } catch (error) {
        console.error("Failed to fetch tokens:", error)
        setTokens(0)
      } finally {
        setLoading(false)
      }
    }
    fetchTokens()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Get real-time help with coding questions
          </p>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          <TokenBadge tokens={tokens ?? 0} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Assistant Panel */}
        <div className="lg:col-span-2">
          <AssistantPanel tokens={tokens ?? 0} onTokenUpdate={setTokens} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-violet-500" />
                Keyboard Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">
                      {shortcut.key}
                    </kbd>
                    <span className="text-muted-foreground">{shortcut.action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">•</span>
                  <span>Be specific with your questions for better answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">•</span>
                  <span>Select the correct programming language</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">•</span>
                  <span>Include context about what you&apos;ve tried</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">•</span>
                  <span>Use the desktop app for invisible mode</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* System Audio Warning */}
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-4">
              <p className="text-sm text-yellow-500">
                <strong>Note:</strong> System audio recording works unstable on some devices.
                This is a known limitation and is not refundable.
                Please test before your interview.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
