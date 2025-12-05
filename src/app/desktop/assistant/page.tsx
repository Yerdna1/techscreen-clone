"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useUser, SignInButton, UserButton } from "@clerk/nextjs"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { AIResponse, ProgrammingLanguage } from "@/types"

type InputStatus = "waiting" | "recording" | "processing"

interface StatusIndicator {
  mic: InputStatus
  pcAudio: InputStatus
  screenshot: InputStatus
}

export default function DesktopAssistantPage() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [status, setStatus] = useState<StatusIndicator>({
    mic: "waiting",
    pcAudio: "waiting",
    screenshot: "waiting",
  })
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript")
  const [error, setError] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null) // Base64 image data
  const [tokensRemaining, setTokensRemaining] = useState<number | null>(null)

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // PC Audio (system audio) recording refs
  const pcAudioRecorderRef = useRef<MediaRecorder | null>(null)
  const pcAudioChunksRef = useRef<Blob[]>([])
  const pcAudioStreamRef = useRef<MediaStream | null>(null)

  const handleSubmit = useCallback(async () => {
    // Allow submit if we have a question OR a screenshot
    if (!question.trim() && !screenshot) return

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/desktop/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          language,
          screenshot, // Include screenshot for vision AI
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResponse(data.response)
        if (data.tokensRemaining !== undefined) {
          setTokensRemaining(data.tokensRemaining)
        }
      } else {
        setError(data.error || "Failed to get response")
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [question, language, screenshot])

  const handleClear = useCallback(() => {
    setQuestion("")
    setResponse(null)
    setError(null)
    setScreenshot(null)
  }, [])

  // Start microphone recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

        // Set status to processing
        setStatus((s) => ({ ...s, mic: "processing" }))

        // Send to transcription API
        try {
          const formData = new FormData()
          formData.append("audio", audioBlob, "recording.webm")

          const res = await fetch("/api/desktop/transcribe", {
            method: "POST",
            body: formData,
          })

          const data = await res.json()

          if (res.ok && data.success) {
            // Append transcribed text to question
            setQuestion((prev) => {
              const newText = data.text.trim()
              if (prev.trim()) {
                return prev + "\n" + newText
              }
              return newText
            })
          } else {
            setError(data.error || "Transcription failed")
          }
        } catch (err) {
          console.error("Transcription error:", err)
          setError("Failed to transcribe audio")
        } finally {
          setStatus((s) => ({ ...s, mic: "waiting" }))
        }
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setStatus((s) => ({ ...s, mic: "recording" }))
    } catch (err) {
      console.error("Microphone error:", err)
      setError("Failed to access microphone. Please grant permission.")
      setStatus((s) => ({ ...s, mic: "waiting" }))
    }
  }, [])

  // Stop microphone recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Toggle microphone recording
  const toggleMicrophone = useCallback(() => {
    if (status.mic === "waiting") {
      startRecording()
    } else if (status.mic === "recording") {
      stopRecording()
    }
    // Don't do anything if processing
  }, [status.mic, startRecording, stopRecording])

  // Start PC Audio (system audio) recording
  const startPcAudioRecording = useCallback(async () => {
    try {
      // Check if running in Electron
      const isElectron = typeof window !== "undefined" && (window as any).electronAPI

      let stream: MediaStream

      if (isElectron) {
        // Use Electron's desktopCapturer API
        const sources = await (window as any).electronAPI.getDesktopSources()

        // Find the "Entire Screen" or first screen source
        const screenSource = sources.find((s: any) => s.name.includes("Entire Screen") || s.name.includes("Screen"))
          || sources[0]

        if (!screenSource) {
          setError("No screen source available")
          return
        }

        // Use getUserMedia with Electron's chromeMediaSourceId
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            // @ts-ignore - Electron-specific constraints
            mandatory: {
              chromeMediaSource: "desktop",
            },
          },
          video: {
            // @ts-ignore - Electron-specific constraints
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: screenSource.id,
            },
          },
        })

        // Stop video tracks - we only need audio
        stream.getVideoTracks().forEach((track) => track.stop())

        // Check if we got audio
        if (stream.getAudioTracks().length === 0) {
          setError("No system audio captured. On macOS, you may need to install a virtual audio driver like BlackHole.")
          return
        }
      } else {
        // Fallback for browser: Use getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })

        // Check if we got audio tracks
        const audioTracks = stream.getAudioTracks()
        if (audioTracks.length === 0) {
          stream.getTracks().forEach((track) => track.stop())
          setError("No audio available. Make sure to check 'Share audio' when selecting the screen.")
          return
        }

        // Stop video tracks
        stream.getVideoTracks().forEach((track) => track.stop())
      }

      // Create audio-only stream
      const audioStream = new MediaStream(stream.getAudioTracks())
      pcAudioStreamRef.current = stream

      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm",
      })

      pcAudioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          pcAudioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        pcAudioStreamRef.current?.getTracks().forEach((track) => track.stop())

        // Create audio blob
        const audioBlob = new Blob(pcAudioChunksRef.current, { type: "audio/webm" })

        // Set status to processing
        setStatus((s) => ({ ...s, pcAudio: "processing" }))

        // Send to transcription API
        try {
          const formData = new FormData()
          formData.append("audio", audioBlob, "pc-audio.webm")

          const res = await fetch("/api/desktop/transcribe", {
            method: "POST",
            body: formData,
          })

          const data = await res.json()

          if (res.ok && data.success) {
            // Append transcribed text to question with label
            setQuestion((prev) => {
              const newText = `[PC Audio] ${data.text.trim()}`
              if (prev.trim()) {
                return prev + "\n" + newText
              }
              return newText
            })
          } else {
            setError(data.error || "Transcription failed")
          }
        } catch (err) {
          console.error("Transcription error:", err)
          setError("Failed to transcribe PC audio")
        } finally {
          setStatus((s) => ({ ...s, pcAudio: "waiting" }))
        }
      }

      mediaRecorder.start()
      pcAudioRecorderRef.current = mediaRecorder
      setStatus((s) => ({ ...s, pcAudio: "recording" }))
    } catch (err) {
      console.error("PC Audio error:", err)
      const errMsg = err instanceof Error ? err.message : "Unknown error"
      if (errMsg.includes("audio")) {
        setError("System audio capture failed. On macOS, you need a virtual audio driver like BlackHole to capture system audio.")
      } else {
        setError(`Failed to capture system audio: ${errMsg}`)
      }
      setStatus((s) => ({ ...s, pcAudio: "waiting" }))
    }
  }, [])

  // Stop PC Audio recording
  const stopPcAudioRecording = useCallback(() => {
    if (pcAudioRecorderRef.current && pcAudioRecorderRef.current.state === "recording") {
      pcAudioRecorderRef.current.stop()
    }
  }, [])

  // Toggle PC Audio recording
  const togglePcAudio = useCallback(() => {
    if (status.pcAudio === "waiting") {
      startPcAudioRecording()
    } else if (status.pcAudio === "recording") {
      stopPcAudioRecording()
    }
    // Don't do anything if processing
  }, [status.pcAudio, startPcAudioRecording, stopPcAudioRecording])

  // Listen for Electron IPC events
  useEffect(() => {
    const handleShortcut = (event: CustomEvent<string>) => {
      const action = event.detail
      switch (action) {
        case "microphone":
          toggleMicrophone()
          break
        case "pc-audio":
          togglePcAudio()
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
      // Store the base64 screenshot image data
      setScreenshot(event.detail)
      setQuestion((prev) => {
        if (prev.trim()) {
          return prev + "\n[Screenshot captured - see preview below]"
        }
        return "[Screenshot captured - see preview below]"
      })
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
  }, [handleClear, handleSubmit, toggleMicrophone, togglePcAudio])

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
      // CMD+2 for microphone toggle
      if ((e.metaKey || e.ctrlKey) && e.code === "Digit2") {
        e.preventDefault()
        toggleMicrophone()
      }
      // CMD+3 for PC audio toggle
      if ((e.metaKey || e.ctrlKey) && e.code === "Digit3") {
        e.preventDefault()
        togglePcAudio()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSubmit, handleClear, toggleMicrophone, togglePcAudio])

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
        return "text-red-500 animate-pulse"
      case "processing":
        return "text-yellow-500"
    }
  }

  // Window control handlers
  const handleClose = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.closeWindow) {
      (window as any).electronAPI.closeWindow()
    }
  }

  const handleMinimize = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.minimizeWindow) {
      (window as any).electronAPI.minimizeWindow()
    }
  }

  const handleMaximize = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.maximizeWindow) {
      (window as any).electronAPI.maximizeWindow()
    }
  }

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="h-screen flex flex-col bg-[#1a1a1a] select-none">
        <div
          className="h-8 flex items-center justify-center bg-[#2a2a2a] border-b border-[#3a3a3a]"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 absolute left-3" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
            <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all" title="Close" />
            <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all" title="Minimize" />
            <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all" title="Maximize" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isSignedIn) {
    return (
      <div className="h-screen flex flex-col bg-[#1a1a1a] select-none">
        {/* Draggable Title Bar */}
        <div
          className="h-8 flex items-center justify-center bg-[#2a2a2a] border-b border-[#3a3a3a]"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 absolute left-3" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
            <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all" title="Close" />
            <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all" title="Minimize" />
            <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all" title="Maximize" />
          </div>
        </div>

        {/* Login Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">LiveHelpEasy</h1>
            <p className="text-gray-400 text-sm max-w-xs">
              Sign in to access your invisible interview assistant. Your questions will be saved to your history.
            </p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition-colors">
                Sign In to Continue
              </button>
            </SignInButton>
            <p className="text-gray-500 text-xs">
              Don&apos;t have an account?{" "}
              <a href="/sign-up" className="text-violet-400 hover:text-violet-300">
                Sign up
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#252525] border-t border-[#3a3a3a] text-xs text-gray-500 flex items-center justify-center">
          <span>CMD+9 to hide/show</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1a1a] select-none">
      {/* Draggable Title Bar */}
      <div
        className="h-8 flex items-center justify-between bg-[#2a2a2a] border-b border-[#3a3a3a] px-3"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-90 transition-all" title="Close" />
          <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-90 transition-all" title="Minimize" />
          <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-90 transition-all" title="Maximize" />
        </div>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          {tokensRemaining !== null && (
            <span className="text-xs text-gray-400">{tokensRemaining} tokens</span>
          )}
          <UserButton afterSignOutUrl="/desktop/assistant" />
        </div>
      </div>

      {/* Status Bar - Input Sources */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-[#3a3a3a]">
        <div className="flex items-center gap-4">
          {/* Microphone Status - Clickable */}
          <button
            onClick={toggleMicrophone}
            disabled={status.mic === "processing"}
            className="flex items-center gap-2 hover:bg-[#3a3a3a] px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            <span className="text-gray-300 text-xs font-medium">Microphone:</span>
            <span className={`text-xs ${getStatusColor(status.mic)}`}>
              {getStatusText(status.mic)}
            </span>
            <kbd className="px-1 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CTRL+2
            </kbd>
          </button>

          {/* PC Audio Status - Clickable (for system audio like Google Meet) */}
          <button
            onClick={togglePcAudio}
            disabled={status.pcAudio === "processing"}
            className="flex items-center gap-2 hover:bg-[#3a3a3a] px-2 py-1 rounded transition-colors disabled:opacity-50"
          >
            <span className="text-gray-300 text-xs font-medium">PC Audio:</span>
            <span className={`text-xs ${getStatusColor(status.pcAudio)}`}>
              {getStatusText(status.pcAudio)}
            </span>
            <kbd className="px-1 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CTRL+3
            </kbd>
          </button>

          {/* Screenshot Status */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-xs font-medium">Screenshot:</span>
            <span className={`text-xs ${getStatusColor(status.screenshot)}`}>
              {getStatusText(status.screenshot)}
            </span>
            <kbd className="px-1 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CTRL+4
            </kbd>
          </div>
        </div>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as ProgrammingLanguage)}
          className="px-2 py-1 text-xs bg-[#3a3a3a] border border-[#4a4a4a] rounded text-gray-300 focus:outline-none focus:border-violet-500"
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

      {/* Second Status Bar - App Controls & AI Status */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f1f1f] border-b border-[#3a3a3a]">
        <div className="flex items-center gap-4">
          {/* App Interact */}
          <div className="flex items-center gap-2">
            <span className="text-violet-400 text-xs font-medium">App:</span>
            <span className="text-gray-400 text-xs">Interact</span>
            <kbd className="px-1 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CTRL+9
            </kbd>
          </div>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="flex items-center gap-2 hover:bg-[#3a3a3a] px-2 py-1 rounded transition-colors"
          >
            <span className="text-gray-300 text-xs font-medium">Clear:</span>
            <kbd className="px-1 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
              CTRL+TAB
            </kbd>
          </button>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-xs font-medium">AI:</span>
          <span className={`text-xs ${isLoading ? "text-yellow-500 animate-pulse" : "text-gray-400"}`}>
            {isLoading ? "Processing request..." : "Waiting for request"}
          </span>
          <kbd className="px-1 py-0.5 text-xs bg-[#3a3a3a] rounded text-gray-400 border border-[#4a4a4a]">
            CTRL+SPACE
          </kbd>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input Area (hidden when response exists) */}
        {!response && (
          <div className="space-y-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question, paste code, use CMD+2 for mic, or CMD+3 for PC audio (Google Meet)..."
              className="w-full h-32 p-3 bg-[#252525] border border-[#3a3a3a] rounded-lg text-gray-200 text-sm resize-none focus:outline-none focus:border-violet-500 placeholder-gray-500"
              disabled={isLoading}
            />

            {/* Screenshot Preview */}
            {screenshot && (
              <div className="relative">
                <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
                  <span>Screenshot Preview (CMD+4 to capture)</span>
                  <button
                    onClick={() => setScreenshot(null)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove screenshot"
                  >
                    X
                  </button>
                </div>
                <div className="border border-[#3a3a3a] rounded-lg overflow-hidden bg-[#252525]">
                  <img
                    src={screenshot}
                    alt="Screenshot preview"
                    className="w-full h-auto max-h-48 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>CMD+SHIFT+SPACE submit | 2=mic | 3=PC audio | 4=screenshot | SHIFT+C clear</span>
              <button
                onClick={handleSubmit}
                disabled={isLoading || (!question.trim() && !screenshot)}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm transition-colors"
              >
                {isLoading ? "Processing..." : screenshot ? "Analyze Screenshot" : "Submit"}
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
                      <span className="text-gray-500 mt-0.5">-</span>
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
                      <span className="text-violet-500 mt-0.5">-</span>
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
        <span>LiveHelpEasy - {user?.emailAddresses?.[0]?.emailAddress || "Signed In"}</span>
        <span>CMD+9 to hide/show</span>
      </div>
    </div>
  )
}
