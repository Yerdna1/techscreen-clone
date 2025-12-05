import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Polar product IDs - Configure these after creating products in Polar
// Uses sandbox or live products based on POLAR_SANDBOX env var
const isSandbox = process.env.POLAR_SANDBOX === "true"

const POLAR_PRODUCTS: Record<string, string> = {
  professional: isSandbox
    ? (process.env.POLAR_PRODUCT_PROFESSIONAL_SANDBOX || "")
    : (process.env.POLAR_PRODUCT_PROFESSIONAL || ""),
  enterprise: isSandbox
    ? (process.env.POLAR_PRODUCT_ENTERPRISE_SANDBOX || "")
    : (process.env.POLAR_PRODUCT_ENTERPRISE || ""),
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

    const polarToken = isSandbox
      ? process.env.POLAR_ACCESS_TOKEN_SANDBOX
      : process.env.POLAR_ACCESS_TOKEN

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
    // Use sandbox-api.polar.sh for testing, api.polar.sh for production
    const polarApiUrl = process.env.POLAR_SANDBOX === "true"
      ? "https://sandbox-api.polar.sh/v1/checkouts/"
      : "https://api.polar.sh/v1/checkouts/"

    const response = await fetch(polarApiUrl, {
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
      let hasActiveSubscription = false
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorJson.message || errorMessage
        // Check if user already has an active subscription
        if (errorMessage.toLowerCase().includes("active subscription") ||
            errorMessage.toLowerCase().includes("already") ||
            errorJson.type === "AlreadySubscribed") {
          hasActiveSubscription = true
        }
      } catch {
        // Use default message
      }

      // If user already has a subscription, try to find their Polar customer and create portal session
      if (hasActiveSubscription) {
        const polarOrgId = process.env.NEXT_PUBLIC_POLAR_ORG_ID

        // First, try to find the customer by metadata (clerk_id)
        const customersApiUrl = isSandbox
          ? `https://sandbox-api.polar.sh/v1/customers?organization_id=${polarOrgId}&metadata[clerk_id]=${userId}`
          : `https://api.polar.sh/v1/customers?organization_id=${polarOrgId}&metadata[clerk_id]=${userId}`

        try {
          // Look up customer by clerk_id in metadata
          const customersResponse = await fetch(customersApiUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${polarToken}`,
              "Content-Type": "application/json",
            },
          })

          if (customersResponse.ok) {
            const customersData = await customersResponse.json()
            console.log("Polar customers lookup:", customersData)

            if (customersData.items && customersData.items.length > 0) {
              const customerId = customersData.items[0].id

              // Create customer portal session with the customer ID
              const portalApiUrl = isSandbox
                ? "https://sandbox-api.polar.sh/v1/customer-portal/sessions"
                : "https://api.polar.sh/v1/customer-portal/sessions"

              const portalResponse = await fetch(portalApiUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${polarToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  customer_id: customerId,
                }),
              })

              if (portalResponse.ok) {
                const portalSession = await portalResponse.json()
                console.log("Polar customer portal session created:", portalSession)
                return NextResponse.json({
                  success: true,
                  checkoutUrl: portalSession.customer_portal_url,
                  message: "Redirecting to manage your subscription...",
                })
              } else {
                const portalError = await portalResponse.text()
                console.error("Polar portal error:", portalError)
              }
            }
          } else {
            const customersError = await customersResponse.text()
            console.error("Polar customers lookup error:", customersError)
          }
        } catch (portalErr) {
          console.error("Portal session error:", portalErr)
        }

        // Fallback: direct to Polar's customer portal URL with org slug
        const polarOrgSlug = "PT-yerdna" // Your organization slug
        const polarPortalUrl = isSandbox
          ? `https://sandbox.polar.sh/${polarOrgSlug}/portal`
          : `https://polar.sh/${polarOrgSlug}/portal`

        return NextResponse.json({
          success: true,
          checkoutUrl: polarPortalUrl,
          message: "You already have an active subscription. Manage it in the Polar portal.",
        })
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
