"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Eye,
  Target,
  ArrowRight,
  Sparkles
} from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Announcement Badge */}
          <Link href="/changelog">
            <Badge
              variant="outline"
              className="mb-6 px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Sparkles className="mr-2 h-4 w-4 text-violet-500" />
              Major update: Instant Generation | Smartest Models | UI Improvements
              <ArrowRight className="ml-2 h-4 w-4" />
            </Badge>
          </Link>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="gradient-text">Tech Screen AI</span>
          </h1>
          <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">
            Your Invisible Interview Assistant
          </h2>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Don&apos;t Let a Tough Question Cost You Your Dream Job.
            <br />
            <span className="text-foreground font-medium">Try For Free Today</span>
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button variant="gradient" size="xl" className="animate-pulse-glow">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="xl">
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
              <Eye className="h-4 w-4 text-violet-500" />
              <span className="text-sm">Invisible on any interview</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Fast responses</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm">Accurate responses</span>
            </div>
          </div>
        </div>

        {/* Preview Image/Demo */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="relative mx-auto max-w-5xl rounded-xl border border-border/50 bg-card shadow-2xl overflow-hidden">
            {/* Mock App Interface */}
            <div className="bg-muted/30 p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded bg-muted">Microphone: Waiting</span>
                  <span className="px-2 py-1 rounded bg-muted">PC Audio: Waiting</span>
                  <span className="px-2 py-1 rounded bg-muted">Screenshot: Waiting</span>
                  <span className="px-2 py-1 rounded bg-violet-600 text-white">JavaScript</span>
                </div>
              </div>
            </div>
            <div className="p-8 min-h-[300px] bg-gradient-to-br from-card to-muted/20">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Thoughts</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500">•</span>
                    The task is to implement a bubble sort function in JavaScript.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500">•</span>
                    Bubble sort is a simple sorting algorithm that repeatedly steps through the list.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500">•</span>
                    It&apos;s O(n²) time complexity, good for understanding sorting concepts.
                  </li>
                </ul>
                <h3 className="text-lg font-semibold mt-6">Code</h3>
                <pre className="code-block text-sm">
{`function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
