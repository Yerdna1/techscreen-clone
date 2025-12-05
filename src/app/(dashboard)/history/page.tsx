"use client"

import { useState, useEffect } from "react"
import { History, Search, Trash2, Code, Clock, Loader2, FileText, Mic, Image } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HistoryItem {
  id: string
  inputType: "text" | "audio" | "screenshot"
  inputContent: string
  programmingLanguage: string
  response: string | null
  tokensUsed: number
  createdAt: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history")
      if (!response.ok) {
        throw new Error("Failed to fetch history")
      }
      const data = await response.json()
      setHistory(data.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    setDeletingId(questionId)
    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      })
      if (response.ok) {
        setHistory(history.filter((item) => item.id !== questionId))
      }
    } catch (err) {
      console.error("Failed to delete question:", err)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredHistory = history.filter((item) =>
    item.inputContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.programmingLanguage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getInputTypeIcon = (inputType: string) => {
    switch (inputType) {
      case "audio":
        return <Mic className="h-3 w-3" />
      case "screenshot":
        return <Image className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-violet-500" />
            Question History
          </h1>
          <p className="text-muted-foreground mt-1">
            View your past questions and responses
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="h-8 w-8 text-violet-500" />
            Question History
          </h1>
          <p className="text-muted-foreground mt-1">
            View your past questions and responses ({history.length} total)
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your history..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-violet-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {history.length === 0 ? "No questions yet" : "No questions found"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {history.length === 0
                ? "Start asking questions to build your history"
                : "Try a different search term"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="hover:border-violet-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {truncateContent(item.inputContent)}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {getInputTypeIcon(item.inputType)}
                        {item.inputType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        {item.programmingLanguage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.tokensUsed} token{item.tokensUsed !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {item.response && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {truncateContent(item.response, 200)}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteQuestion(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
