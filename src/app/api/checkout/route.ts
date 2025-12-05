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
      console.error("Product ID not found for plan:", planId, "Available:", POLAR_PRODUCTS)
      return NextResponse.json(
        { error: "Plan not configured. Please contact support." },
        { status: 400 }
      )
    }

    const polarToken = process.env.POLAR_ACCESS_TOKEN

    if (!polarToken) {
      // Polar not configured - redirect to contact/waitlist
      return NextResponse.json({
        success: true,
        checkoutUrl: "/settings/billing?setup=pending",
        message: "Payment system is being set up. Please check back soon!",
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techscreen-clone.vercel.app"

    // Create Polar checkout session using the v1 API
    const response = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${appUrl}/settings/billing?success=true`,
        customer_metadata: {
          clerk_id: userId,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Polar checkout error:", response.status, errorText)

      // Try to parse the error for more details
      let errorMessage = "Failed to create checkout session"
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorJson.message || errorMessage
      } catch {
        // Use default message
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    const checkout = await response.json()
    console.log("Polar checkout created:", checkout.id)

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
