import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Bot,
  Coins,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Download,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TokenBadge } from "@/components/dashboard/TokenBadge"

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // TODO: Fetch actual data from database
  const stats = {
    tokens: 3,
    questionsAsked: 0,
    subscriptionTier: "free" as const,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user.firstName || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your account
          </p>
        </div>
        <TokenBadge tokens={stats.tokens} />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tokens Remaining</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tokens}</div>
            <p className="text-xs text-muted-foreground">
              {stats.subscriptionTier === "free" ? "Free tier" : "Resets monthly"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questionsAsked}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.subscriptionTier}</div>
            <Link href="/pricing" className="text-xs text-violet-500 hover:underline">
              Upgrade plan
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Desktop App</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Available</Badge>
            <p className="text-xs text-muted-foreground mt-1">
              For invisible mode
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" />
              Start AI Assistant
            </CardTitle>
            <CardDescription>
              Get real-time help with coding questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/assistant">
              <Button variant="gradient" className="w-full">
                Open Assistant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-violet-500" />
              Download Desktop App
            </CardTitle>
            <CardDescription>
              Use invisible mode during real interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Mac (Apple Silicon)
              </Button>
              <Button variant="outline" className="flex-1">
                Windows
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Tips to make the most of TechScreen AI</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 text-sm font-medium">
                1
              </span>
              <div>
                <p className="font-medium">Use the Web Assistant for practice</p>
                <p className="text-sm text-muted-foreground">
                  Practice with the web version before your interview
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 text-sm font-medium">
                2
              </span>
              <div>
                <p className="font-medium">Download the Desktop App</p>
                <p className="text-sm text-muted-foreground">
                  The desktop app is invisible to screen sharing software
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 text-sm font-medium">
                3
              </span>
              <div>
                <p className="font-medium">Learn the keyboard shortcuts</p>
                <p className="text-sm text-muted-foreground">
                  Use CMD/CTRL + 2 for mic, CMD/CTRL + 4 for screenshot
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
