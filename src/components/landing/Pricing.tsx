"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PRICING_PLANS } from "@/config/pricing"
import { cn } from "@/lib/utils"

export function Pricing() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) {
      router.push("/sign-up")
      return
    }

    if (planId === "free") {
      router.push("/dashboard")
      return
    }

    setLoadingPlan(planId)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()
      console.log("Checkout response:", data)

      if (data.checkoutUrl) {
        if (data.checkoutUrl.startsWith("http")) {
          window.location.href = data.checkoutUrl
        } else {
          router.push(data.checkoutUrl)
        }
      } else if (data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
        alert(errorMsg)
      } else {
        alert("Unexpected response from server. Please try again.")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Our Pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started with a Free account and 5 tokens for testing. Upgrade for more tokens!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            1 token = 1 resolved question.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.popular && "border-violet-500 shadow-lg shadow-violet-500/20"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600">
                  Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[60px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">
                    {plan.price > 0 ? " / month" : " / forever"}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  {plan.pricePerToken}~ / token
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.popular ? "gradient" : "outline"}
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : plan.price === 0 ? (
                    "Start Free"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Prices in USD. Taxes may apply.
        </p>
      </div>
    </section>
  )
}
