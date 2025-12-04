"use client"

import { useState, useCallback } from "react"
import { Mic, Camera, Volume2, Send, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PROGRAMMING_LANGUAGES } from "@/config/pricing"
import { ResponseDisplay } from "./ResponseDisplay"
import type { AIResponse, ProgrammingLanguage } from "@/types"

interface AssistantPanelProps {
  tokens: number
  onTokenUpdate?: (newTokens: number) => void
}

export function AssistantPanel({ tokens, onTokenUpdate }: AssistantPanelProps) {
  const [inputType, setInputType] = useState<"text" | "mic" | "screenshot">("text")
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript")
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || tokens <= 0) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          language,
          inputType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get response")
      }

      const data = await res.json()
      setResponse(data.response)
      onTokenUpdate?.(data.tokensRemaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [question, language, inputType, tokens, onTokenUpdate])

  const handleClear = () => {
    setQuestion("")
    setResponse(null)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === " ") {
      e.preventDefault()
      handleSubmit()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Tab") {
      e.preventDefault()
      handleClear()
    }
  }

  return (
    <div className="space-y-4">
      {/* Input Type Tabs */}
      <Tabs defaultValue="text" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="text" onClick={() => setInputType("text")}>
              Text
            </TabsTrigger>
            <TabsTrigger value="mic" onClick={() => setInputType("mic")}>
              <Mic className="h-4 w-4 mr-1" />
              Microphone
            </TabsTrigger>
            <TabsTrigger value="screenshot" onClick={() => setInputType("screenshot")}>
              <Camera className="h-4 w-4 mr-1" />
              Screenshot
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select
              options={PROGRAMMING_LANGUAGES.map((l) => ({
                value: l.value,
                label: l.label,
              }))}
              value={language}
              onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
              className="w-40"
            />
            <Badge variant="outline" className="px-3">
              {tokens} tokens
            </Badge>
          </div>
        </div>

        {/* Text Input */}
        <TabsContent value="text" className="mt-4">
          <Card className="p-4">
            <Textarea
              placeholder="Type your coding question here... (CMD/CTRL + SPACE to submit)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] resize-none border-0 focus-visible:ring-0 p-0"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">CMD/CTRL + SPACE</kbd>
                <span>Submit</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">CMD/CTRL + TAB</kbd>
                <span>Clear</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClear} disabled={isLoading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isLoading || !question.trim() || tokens <= 0}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Microphone Input */}
        <TabsContent value="mic" className="mt-4">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Mic className="h-10 w-10 text-violet-500" />
              </div>
              <p className="text-muted-foreground">
                Microphone input is available in the desktop app
              </p>
              <Button variant="outline">
                <Volume2 className="h-4 w-4 mr-2" />
                Download Desktop App
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Screenshot Input */}
        <TabsContent value="screenshot" className="mt-4">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Camera className="h-10 w-10 text-violet-500" />
              </div>
              <p className="text-muted-foreground">
                Screenshot capture is available in the desktop app
              </p>
              <p className="text-sm text-muted-foreground">
                Or you can paste an image URL below:
              </p>
              <Textarea
                placeholder="Paste image URL here..."
                className="max-w-md"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <Button
                variant="gradient"
                onClick={handleSubmit}
                disabled={isLoading || !question.trim() || tokens <= 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Analyze Image
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Response Display */}
      {response && <ResponseDisplay response={response} />}

      {/* No Tokens Warning */}
      {tokens <= 0 && (
        <Card className="p-4 border-yellow-500 bg-yellow-500/10">
          <p className="text-yellow-500 text-sm">
            You have no tokens remaining. Please upgrade your plan to continue using the assistant.
          </p>
        </Card>
      )}
    </div>
  )
}
