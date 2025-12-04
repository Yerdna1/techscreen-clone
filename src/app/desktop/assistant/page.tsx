"use client"

import { useState, useEffect, useCallback } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { AIResponse, ProgrammingLanguage } from "@/types"

type InputStatus = "waiting" | "recording" | "processing"

interface StatusIndicator {
  mic: InputStatus
  screenshot: InputStatus
}

export default function DesktopAssistantPage() {
  const [status, setStatus] = useState<StatusIndicator>({
    mic: "waiting",
    screenshot: "waiting",
  })
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript")

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      // Use public desktop API endpoint (no auth required)
      const res = await fetch("/api/desktop/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          language,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResponse(data.response)
      } else {
        setError(data.error || "Failed to get response")
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [question, language])

  const handleClear = useCallback(() => {
    setQuestion("")
    setResponse(null)
    setError(null)
  }, [])

  // Listen for Electron IPC events
  useEffect(() => {
    const handleShortcut = (event: CustomEvent<string>) => {
      const action = event.detail
      switch (action) {
        case "microphone":
          setStatus((s) => ({
            ...s,
            mic: s.mic === "waiting" ? "recording" : "waiting",
          }))
          break
        case "screenshot":
          setStatus((s) => ({ ...s, screenshot: "processing" }))
          setTimeout(() => setStatus((s) => ({ ...s, screenshot: "waiting" })), 1000)
          break
        case "clear":
          handleClear()
          break
        case "submit":
          handleSubmit()
          break
      }
    }

    const handleScreenshot = (event: CustomEvent<string>) => {
      setQuestion(`[Screenshot captured]\n${event.detail}`)
      setStatus((s) => ({ ...s, screenshot: "waiting" }))
    }

    // Listen for electron events through window
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      ;(window as any).electronAPI.onShortcut((action: string) => {
        window.dispatchEvent(new CustomEvent("electron-shortcut", { detail: action }))
      })
      ;(window as any).electronAPI.onScreenshot((data: string) => {
        window.dispatchEvent(new CustomEvent("electron-screenshot", { detail: data }))
      })
    }

    window.addEventListener("electron-shortcut", handleShortcut as EventListener)
    window.addEventListener("electron-screenshot", handleScreenshot as EventListener)

    return () => {
      window.removeEventListener("electron-shortcut", handleShortcut as EventListener)
      window.removeEventListener("electron-screenshot", handleScreenshot as EventListener)
    }
  }, [handleClear, handleSubmit])

  // Keyboard shortcuts for web testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "Space") {
        e.preventDefault()
        handleSubmit()
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyC") {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSubmit, handleClear])

  const getStatusText = (s: InputStatus) => {
    switch (s) {
      case "waiting":
        return "Waiting"
      case "recording":
        return "Recording..."
      case "processing":
        return "Processing..."
    }
  }

  const getStatusColor = (s: InputStatus) => {
    switch (s) {
      case "waiting":
        return "text-gray-400"
      case "recording":
        return "text-red-500"
      case "processing":
        return "text-yellow-500"
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a] select-none">
      {/* Draggable Title Bar */}
      <div
        className="h-8 flex items-center justify-center bg-[#2a2a2a] border-b border-[#3a3a3a]"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 absolute left-3">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-[#3a3a3a]">
        <div className="flex items-center gap-6">
          {/* Microphone Status */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm font-medium">Microphone:</span>
            <span className={`text-sm ${getStatusColor(status.mic)}`}>
              {getStatusText(status.mic)}
            </span>
            <kbd className="px-1.5 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CMD+2
            </kbd>
          </div>

          {/* Screenshot Status */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm font-medium">Screenshot:</span>
            <span className={`text-sm ${getStatusColor(status.screenshot)}`}>
              {getStatusText(status.screenshot)}
            </span>
            <kbd className="px-1.5 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CMD+4
            </kbd>
          </div>
        </div>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
          className="px-2 py-1 text-sm bg-[#3a3a3a] border border-[#4a4a4a] rounded text-gray-300 focus:outline-none focus:border-violet-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="ruby">Ruby</option>
          <option value="php">PHP</option>
          <option value="swift">Swift</option>
          <option value="kotlin">Kotlin</option>
          <option value="sql">SQL</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input Area (hidden when response exists) */}
        {!response && (
          <div className="space-y-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question or paste code here..."
              className="w-full h-32 p-3 bg-[#252525] border border-[#3a3a3a] rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:border-violet-500 placeholder-gray-500"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>CMD+SHIFT+SPACE to submit | CMD+SHIFT+C to clear</span>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !question.trim()}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm transition-colors"
              >
                {isLoading ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Response */}
        {response && !isLoading && (
          <div className="space-y-4">
            {/* Thoughts Section */}
            {response.thoughts && (
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">Thoughts</h2>
                <ul className="space-y-1.5 text-gray-300 text-sm">
                  {response.thoughts.split("\n").filter(Boolean).map((thought, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-500 mt-0.5">•</span>
                      <span>{thought.replace(/^[•\-\*]\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code Section */}
            {response.code && (
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">Code</h2>
                <div className="rounded-lg overflow-hidden border border-[#3a3a3a]">
                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "0.875rem",
                      background: "#282c34",
                    }}
                    showLineNumbers
                  >
                    {response.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}

            {/* Key Points Section */}
            {response.keyPoints && response.keyPoints.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-200 mb-2">Key Points</h2>
                <ul className="space-y-1.5 text-gray-300 text-sm">
                  {response.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-violet-500 mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded text-gray-300 text-sm transition-colors"
            >
              Clear (CMD+SHIFT+C)
            </button>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-4 py-2 bg-[#252525] border-t border-[#3a3a3a] text-xs text-gray-500 flex items-center justify-between">
        <span>TechScreen AI</span>
        <span>CMD+9 to hide/show</span>
      </div>
    </div>
  )
}
