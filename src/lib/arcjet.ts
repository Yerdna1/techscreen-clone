import arcjet, { shield, tokenBucket, detectBot } from "@arcjet/next"

// Base arcjet instance for general API routes
export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Shield protects against common attacks
    shield({
      mode: "LIVE",
    }),
    // Bot detection
    detectBot({
      mode: "LIVE",
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        "CATEGORY:PREVIEW",
      ],
    }),
    // Rate limiting - 100 requests per 60 seconds
    tokenBucket({
      mode: "LIVE",
      refillRate: 100,
      interval: 60,
      capacity: 100,
    }),
  ],
})

// Stricter rate limit for AI endpoints
export const ajAI = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    // Much stricter rate limit for AI - 10 requests per minute
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 60,
      capacity: 10,
    }),
  ],
})
