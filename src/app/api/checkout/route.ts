import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Polar product IDs - Configure these after creating products in Polar
const POLAR_PRODUCTS: Record<string, string> = {
  professional: process.env.POLAR_PRODUCT_PROFESSIONAL || "",
  enterprise: process.env.POLAR_PRODUCT_ENTERPRISE || "",
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to subscribe" },
        { status: 401 }
      )
    }

    const { planId } = await request.json()

    if (!planId || planId === "free") {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const productId = POLAR_PRODUCTS[planId]

    if (!productId) {
      return NextResponse.json(
        { error: "Plan not configured. Please contact support." },
        { status: 400 }
      )
    }

    const polarToken = process.env.POLAR_ACCESS_TOKEN
    const polarOrgId = process.env.NEXT_PUBLIC_POLAR_ORG_ID

    if (!polarToken || !polarOrgId) {
      // Polar not configured - redirect to contact/waitlist
      return NextResponse.json({
        success: true,
        checkoutUrl: "/settings/billing?setup=pending",
        message: "Payment system is being set up. Please check back soon!",
      })
    }

    // Create Polar checkout session
    const response = await fetch("https://api.polar.sh/api/v1/checkouts/custom", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        metadata: {
          clerk_id: userId,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Polar checkout error:", error)
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      )
    }

    const checkout = await response.json()

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.url,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    )
  }
}
