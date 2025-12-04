import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Changelog - TechScreen AI",
  description: "See what's new in TechScreen AI",
}

const changelog = [
  {
    version: "0.1.4",
    date: "December 2024",
    platform: ["Mac", "Windows"],
    type: "Major Update",
    added: [
      "Instant generation (response streaming)",
      "Smarter reasoning model",
      "Minor UI improvements",
    ],
    fixed: [
      "Code display issue",
      "Long generation time",
    ],
  },
  {
    version: "0.1.3",
    date: "November 2024",
    platform: ["Mac", "Windows"],
    type: "Update",
    added: ["PHP support"],
    fixed: [],
  },
  {
    version: "0.1.2",
    date: "October 2024",
    platform: ["Server"],
    type: "Update",
    added: [],
    fixed: [
      "Migrated to more powerful model (GPT-5)",
      "AI Responses are now ~10% faster",
      "Better initial prompt, AI responses should become better",
    ],
  },
  {
    version: "0.1.2",
    date: "October 2024",
    platform: ["Mac", "Windows"],
    type: "Update",
    added: [
      "SQL support",
      "Flutter support",
    ],
    fixed: [
      "Language selection dropdown not being invisible",
      "Better initial prompt, AI responses should become better",
    ],
  },
  {
    version: "0.1.1",
    date: "September 2024",
    platform: ["Mac", "Windows"],
    type: "Update",
    added: [
      "Keyboard shortcuts",
      "Screenshot capture",
      "Microphone input",
    ],
    fixed: [
      "Window positioning issues",
      "Memory optimization",
    ],
  },
  {
    version: "0.1.0",
    date: "August 2024",
    platform: ["Mac", "Windows"],
    type: "Initial Release",
    added: [
      "Invisible overlay window",
      "AI-powered code assistance",
      "Multiple programming languages",
      "Token-based pricing",
    ],
    fixed: [],
  },
]

export default function ChangelogPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Changelog</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              See what&apos;s new in TechScreen AI
            </p>
          </div>

          <div className="space-y-6">
            {changelog.map((entry, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">
                        {entry.type}
                      </CardTitle>
                      <div className="flex gap-2">
                        {entry.platform.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      v{entry.version}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.date}</p>
                </CardHeader>
                <CardContent>
                  {entry.added.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-500 mb-2">Added:</h4>
                      <ul className="space-y-1">
                        {entry.added.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-green-500">+</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {entry.fixed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-500 mb-2">Fixed:</h4>
                      <ul className="space-y-1">
                        {entry.fixed.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-blue-500">~</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
