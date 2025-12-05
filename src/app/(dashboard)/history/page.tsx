"use client"

import { useState } from "react"
import { History, Search, Trash2, Code, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Mock data - will be replaced with database queries
const mockHistory = [
  {
    id: "1",
    question: "How do I implement a binary search in JavaScript?",
    language: "javascript",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    tokensUsed: 1,
  },
  {
    id: "2",
    question: "Explain the difference between async/await and Promises",
    language: "javascript",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    tokensUsed: 1,
  },
  {
    id: "3",
    question: "Write a Python function to reverse a linked list",
    language: "python",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    tokensUsed: 1,
  },
]

export default function HistoryPage() {
  const [history] = useState(mockHistory)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredHistory = history.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
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
            View your past questions and responses
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
            <p className="text-muted-foreground">No questions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start asking questions to build your history
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="hover:border-violet-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.question}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        {item.language}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.tokensUsed} token
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
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
