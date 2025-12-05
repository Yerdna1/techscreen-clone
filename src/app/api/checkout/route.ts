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

    // Use sandbox org ID if in sandbox mode, otherwise use live org ID
    const polarOrgId = isSandbox
      ? (process.env.POLAR_ORG_ID_SANDBOX || process.env.NEXT_PUBLIC_POLAR_ORG_ID)
      : process.env.NEXT_PUBLIC_POLAR_ORG_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://techscreen-clone.vercel.app"

    console.log("Checkout - Config:", { isSandbox, polarOrgId, hasToken: !!polarToken })

    // First, check if user already has an ACTIVE subscription in Polar
    // Look up customer by clerk_id
    const customersApiUrl = isSandbox
      ? `https://sandbox-api.polar.sh/v1/customers?organization_id=${polarOrgId}&metadata[clerk_id]=${userId}`
      : `https://api.polar.sh/v1/customers?organization_id=${polarOrgId}&metadata[clerk_id]=${userId}`

    let existingCustomerId: string | null = null
    let hasActiveSubscription = false

    try {
      const customersResponse = await fetch(customersApiUrl, {
        headers: {
          "Authorization": `Bearer ${polarToken}`,
          "Content-Type": "application/json",
        },
      })

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        console.log("Checkout - Customer lookup:", JSON.stringify(customersData, null, 2))

        if (customersData.items && customersData.items.length > 0) {
          existingCustomerId = customersData.items[0].id

          // Check if this customer has any ACTIVE subscriptions
          const subscriptionsApiUrl = isSandbox
            ? `https://sandbox-api.polar.sh/v1/subscriptions?organization_id=${polarOrgId}&customer_id=${existingCustomerId}`
            : `https://api.polar.sh/v1/subscriptions?organization_id=${polarOrgId}&customer_id=${existingCustomerId}`

          const subscriptionsResponse = await fetch(subscriptionsApiUrl, {
            headers: {
              "Authorization": `Bearer ${polarToken}`,
              "Content-Type": "application/json",
            },
          })

          if (subscriptionsResponse.ok) {
            const subscriptionsData = await subscriptionsResponse.json()
            console.log("Checkout - Subscriptions lookup:", JSON.stringify(subscriptionsData, null, 2))

            // Check for any active subscription
            const activeSubscription = subscriptionsData.items?.find(
              (sub: { status: string }) => sub.status === "active"
            )

            if (activeSubscription) {
              hasActiveSubscription = true
              console.log("Checkout - User has active subscription:", activeSubscription.id)
            } else {
              console.log("Checkout - No active subscription found (may have cancelled/expired ones)")
            }
          }
        }
      }
    } catch (err) {
      console.error("Error checking existing subscriptions:", err)
      // Continue with checkout attempt
    }

    // If user has an active subscription, redirect to portal to manage it
    if (hasActiveSubscription && existingCustomerId) {
      const portalApiUrl = isSandbox
        ? "https://sandbox-api.polar.sh/v1/customer-portal/sessions"
        : "https://api.polar.sh/v1/customer-portal/sessions"

      try {
        const portalResponse = await fetch(portalApiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${polarToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: existingCustomerId,
          }),
        })

        if (portalResponse.ok) {
          const portalSession = await portalResponse.json()
          console.log("Checkout - Portal session created:", portalSession)
          return NextResponse.json({
            success: true,
            checkoutUrl: portalSession.customer_portal_url,
            message: "You have an active subscription. Redirecting to manage it...",
          })
        }
      } catch (portalErr) {
        console.error("Portal session error:", portalErr)
      }

      // Fallback to Polar portal
      const polarOrgSlug = "PT-yerdna"
      const polarPortalUrl = isSandbox
        ? `https://sandbox.polar.sh/${polarOrgSlug}/portal`
        : `https://polar.sh/${polarOrgSlug}/portal`

      return NextResponse.json({
        success: true,
        checkoutUrl: polarPortalUrl,
        message: "You have an active subscription. Manage it in the Polar portal.",
      })
    }

    // No active subscription - create a new checkout
    const polarApiUrl = isSandbox
      ? "https://sandbox-api.polar.sh/v1/checkouts/"
      : "https://api.polar.sh/v1/checkouts/"

    const checkoutBody: Record<string, unknown> = {
      product_id: productId,
      success_url: `${appUrl}/settings/billing?success=true`,
      customer_metadata: {
        clerk_id: userId,
      },
    }

    // If we have an existing customer ID, use it for the checkout
    // This allows re-subscribing with the same customer
    if (existingCustomerId) {
      checkoutBody.customer_id = existingCustomerId
    }

    console.log("Checkout - Creating checkout:", JSON.stringify(checkoutBody, null, 2))

    const response = await fetch(polarApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Polar checkout error:", response.status, errorText)

      // Try to parse the error for more details
      let errorMessage = "Failed to create checkout session"
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.detail || errorJson.message || errorMessage

        // If Polar still says "already subscribed" even though we checked,
        // it might be a different product - redirect to portal
        if (errorMessage.toLowerCase().includes("active subscription") ||
            errorMessage.toLowerCase().includes("already") ||
            errorJson.type === "AlreadySubscribed") {

          if (existingCustomerId) {
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
                customer_id: existingCustomerId,
              }),
            })

            if (portalResponse.ok) {
              const portalSession = await portalResponse.json()
              return NextResponse.json({
                success: true,
                checkoutUrl: portalSession.customer_portal_url,
                message: "You already have a subscription. Redirecting to manage it...",
              })
            }
          }

          // Fallback
          const polarOrgSlug = "PT-yerdna"
          const polarPortalUrl = isSandbox
            ? `https://sandbox.polar.sh/${polarOrgSlug}/portal`
            : `https://polar.sh/${polarOrgSlug}/portal`

          return NextResponse.json({
            success: true,
            checkoutUrl: polarPortalUrl,
            message: "You already have a subscription. Manage it in the Polar portal.",
          })
        }
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
