"use client"

import { Download, Apple, Monitor, Shield, Keyboard, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DownloadPage() {
  const GITHUB_REPO = "Yerdna1/techscreen-clone"
  const VERSION = "1.0.0"

  const downloads = [
    {
      platform: "macOS (Apple Silicon)",
      icon: Apple,
      fileName: `TechScreen-AI-${VERSION}-arm64.dmg`,
      description: "For M1, M2, M3 Macs",
      badge: "Recommended",
    },
    {
      platform: "macOS (Intel)",
      icon: Apple,
      fileName: `TechScreen-AI-${VERSION}-x64.dmg`,
      description: "For Intel-based Macs",
    },
    {
      platform: "Windows",
      icon: Monitor,
      fileName: `TechScreen-AI-${VERSION}-Setup.exe`,
      description: "Windows 10/11 64-bit",
    },
  ]

  const features = [
    {
      icon: Eye,
      title: "Invisible Mode",
      description: "The app is completely invisible to screen sharing software",
    },
    {
      icon: Keyboard,
      title: "Global Shortcuts",
      description: "Control everything with keyboard shortcuts even when app is hidden",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays on your device, nothing is stored on our servers",
    },
  ]

  const handleDownload = (fileName: string) => {
    // For now, show instructions - in production, link to GitHub releases
    alert(`To download the desktop app:\n\n1. Go to the GitHub repository\n2. Navigate to Releases\n3. Download ${fileName}\n\nNote: Desktop builds will be available in the next release.`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Download className="h-8 w-8 text-violet-500" />
          Download Desktop App
        </h1>
        <p className="text-muted-foreground mt-2">
          Get the invisible desktop app for real interviews. The app stays hidden from screen sharing software.
        </p>
      </div>

      {/* Download Options */}
      <div className="grid gap-4 md:grid-cols-3">
        {downloads.map((download) => (
          <Card key={download.platform} className="relative">
            {download.badge && (
              <Badge className="absolute -top-2 -right-2 bg-violet-500">
                {download.badge}
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-2">
                <download.icon className="h-8 w-8 text-violet-500" />
              </div>
              <CardTitle className="text-lg">{download.platform}</CardTitle>
              <CardDescription>{download.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => handleDownload(download.fileName)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Build from Source */}
      <Card>
        <CardHeader>
          <CardTitle>Build from Source</CardTitle>
          <CardDescription>
            Build the desktop app yourself from the source code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p className="text-muted-foreground"># Clone and build the Electron app</p>
            <p>git clone https://github.com/{GITHUB_REPO}.git</p>
            <p>cd techscreen-clone/electron</p>
            <p>npm install</p>
            <p>npm start</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Requires Node.js 18+ and npm installed on your system.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-center">Why Use the Desktop App?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
                  <feature.icon className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-violet-500" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>
            Control the app without touching your mouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">Toggle visibility</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">CMD/CTRL + 9</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">Start/stop microphone</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">CMD/CTRL + 2</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">Capture PC audio</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">CMD/CTRL + 3</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">Take screenshot</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">CMD/CTRL + 4</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">Submit question</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">CMD/CTRL + SHIFT + SPACE</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted">
              <span className="text-sm">Clear input</span>
              <kbd className="px-2 py-1 bg-background rounded text-xs">CMD/CTRL + SHIFT + C</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
