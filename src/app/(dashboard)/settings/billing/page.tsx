"use client"

import Link from "next/link"
import { CreditCard, Coins, TrendingUp, Receipt, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function BillingPage() {
  // Mock data - will be replaced with actual billing data
  const billing = {
    plan: "free",
    tokens: 3,
    nextReset: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      tokens: "3 tokens/month",
      current: billing.plan === "free",
    },
    {
      name: "Pro",
      price: "$19/mo",
      tokens: "100 tokens/month",
      current: billing.plan === "pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$49/mo",
      tokens: "Unlimited",
      current: billing.plan === "enterprise",
    },
  ]

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
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">{billing.plan}</p>
                <p className="text-sm text-muted-foreground">
                  {billing.tokens} tokens remaining
                </p>
              </div>
            </div>
            <Badge variant={billing.plan === "free" ? "outline" : "default"}>
              {billing.plan === "free" ? "Free Tier" : "Active"}
            </Badge>
          </div>
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
              {plan.current ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Link href="/pricing">
                  <Button variant={plan.popular ? "gradient" : "outline"} className="w-full">
                    Upgrade
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
              <span className="font-medium">0 / 3</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: "0%" }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Resets on {billing.nextReset.toLocaleDateString()}
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
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No billing history yet
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
