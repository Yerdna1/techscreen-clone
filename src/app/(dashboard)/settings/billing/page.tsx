"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CreditCard, Coins, TrendingUp, Receipt, ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BillingData {
  user: {
    id: string
    email: string
    tokens: number
    subscriptionTier: string
  }
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
  } | null
  transactions: Array<{
    id: string
    amount: number
    type: string
    description: string
    createdAt: string
  }>
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    tokens: "5 tokens",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$149/mo",
    tokens: "200 tokens/month",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199/mo",
    tokens: "500 tokens/month",
  },
]

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const fetchBillingData = async () => {
    try {
      const response = await fetch("/api/billing")
      if (!response.ok) {
        throw new Error("Failed to fetch billing data")
      }
      const data = await response.json()
      setBillingData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const syncSubscription = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch("/api/billing/sync", { method: "POST" })
      const data = await response.json()
      if (response.ok) {
        setSyncMessage(data.message || "Subscription synced successfully!")
        // Refresh billing data
        await fetchBillingData()
      } else {
        setSyncMessage(`Error: ${data.error || "Failed to sync"}`)
      }
    } catch (err) {
      setSyncMessage("Failed to sync subscription")
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchBillingData()
  }, [])

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
            <CreditCard className="h-8 w-8 text-violet-500" />
            Billing
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing
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

  const currentPlan = billingData?.user.subscriptionTier || "free"
  const tokens = billingData?.user.tokens || 0
  const subscription = billingData?.subscription
  const transactions = billingData?.transactions || []

  // Calculate token usage percentage
  const planConfig = plans.find(p => p.id === currentPlan)
  const maxTokens = currentPlan === "free" ? 5 : currentPlan === "professional" ? 200 : 500
  const usedTokens = maxTokens - tokens
  const usagePercent = Math.min((usedTokens / maxTokens) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-violet-500" />
          Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={syncSubscription}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {syncMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              syncMessage.startsWith("Error")
                ? "bg-red-500/10 text-red-500"
                : "bg-green-500/10 text-green-500"
            }`}>
              {syncMessage}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{currentPlan}</p>
                <p className="text-sm text-muted-foreground">
                  {tokens} tokens remaining
                </p>
              </div>
            </div>
            <Badge variant={currentPlan === "free" ? "outline" : "default"}>
              {subscription?.status === "active" ? "Active" : currentPlan === "free" ? "Free Tier" : subscription?.status || "Free Tier"}
            </Badge>
          </div>
          {subscription && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.popular ? "border-violet-500 ring-1 ring-violet-500" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge variant="default" className="bg-violet-500">
                    Popular
                  </Badge>
                )}
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{plan.tokens}</p>
              {currentPlan === plan.id ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Link href="/pricing">
                  <Button variant={plan.popular ? "gradient" : "outline"} className="w-full">
                    {plan.id === "free" ? "Downgrade" : "Upgrade"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-500" />
            Usage
          </CardTitle>
          <CardDescription>Your token usage this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Tokens Used</span>
              <span className="font-medium">{usedTokens} / {maxTokens}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {tokens} tokens remaining
              {subscription && (
                <> · Resets on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-violet-500" />
            Billing History
          </CardTitle>
          <CardDescription>Your past transactions and token usage</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No billing history yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()} · {transaction.type}
                    </p>
                  </div>
                  <Badge variant={transaction.amount > 0 ? "default" : "secondary"}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount} tokens
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
