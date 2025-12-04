// User types
export interface User {
  id: string
  clerkId: string
  email: string
  name: string | null
  imageUrl: string | null
  tokens: number
  subscriptionTier: SubscriptionTier
  subscriptionId: string | null
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionTier = "free" | "essential" | "professional" | "expert"

// Question/Session types
export interface Question {
  id: string
  userId: string
  inputType: InputType
  inputContent: string
  programmingLanguage: ProgrammingLanguage
  response: string | null
  tokensUsed: number
  createdAt: Date
}

export type InputType = "text" | "screenshot" | "audio" | "system_audio"

export type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "sql"
  | "flutter"
  | "html"
  | "css"
  | "other"

// Subscription types
export interface Subscription {
  id: string
  userId: string
  polarSubscriptionId: string
  plan: SubscriptionTier
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing"

// Token transaction types
export interface TokenTransaction {
  id: string
  userId: string
  amount: number
  type: TransactionType
  description: string
  createdAt: Date
}

export type TransactionType = "usage" | "purchase" | "subscription_reset" | "bonus"

// Pricing types
export interface PricingPlan {
  id: SubscriptionTier
  name: string
  description: string
  price: number
  tokens: number
  pricePerToken: string
  features: string[]
  popular?: boolean
}

// AI Response types
export interface AIResponse {
  thoughts: string
  code: string | null
  keyPoints: string[]
  language: ProgrammingLanguage
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Dashboard stats
export interface DashboardStats {
  tokensRemaining: number
  tokensUsed: number
  questionsAsked: number
  subscriptionTier: SubscriptionTier
  subscriptionRenewsAt: Date | null
}
