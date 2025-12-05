"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useUser, useClerk } from "@clerk/nextjs"
import { Settings, Bell, Shield, Palette, User, Moon, Sun, Monitor, Key, Copy, Trash2, Plus, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsedAt: string | null
  createdAt: string
}

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [isDeletingKey, setIsDeletingKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  // Fetch API keys on mount
  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/keys")
      const data = await res.json()
      if (res.ok) {
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    }
  }

  const createApiKey = async () => {
    setIsCreatingKey(true)
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Desktop App" }),
      })
      const data = await res.json()
      if (res.ok && data.key) {
        setNewApiKey(data.key.key)
        fetchApiKeys()
      }
    } catch (error) {
      console.error("Failed to create API key:", error)
    } finally {
      setIsCreatingKey(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    setIsDeletingKey(keyId)
    try {
      const res = await fetch(`/api/keys?id=${keyId}`, { method: "DELETE" })
      if (res.ok) {
        fetchApiKeys()
      }
    } catch (error) {
      console.error("Failed to delete API key:", error)
    } finally {
      setIsDeletingKey(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const { openUserProfile } = useClerk()

  const handleOpenProfile = () => {
    openUserProfile()
  }

  const handleEnable2FA = () => {
    // Open user profile directly to the security section
    openUserProfile({
      appearance: {
        elements: {
          rootBox: "w-full"
        }
      }
    })
  }

  const handleViewSessions = () => {
    openUserProfile()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-violet-500" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-violet-500" />
            Profile
          </CardTitle>
          <CardDescription>
            Your profile is managed through Clerk authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="flex items-center gap-4 mb-4">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{user.fullName || user.firstName || "User"}</p>
                <p className="text-sm text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          )}
          <Button variant="outline" onClick={handleOpenProfile}>
            Manage Profile
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-violet-500" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-3">Theme</p>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-violet-500" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">
                Receive news and promotional content
              </p>
            </div>
            <Switch
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Keys for Desktop App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-violet-500" />
            API Keys
          </CardTitle>
          <CardDescription>
            Generate API keys to use the Desktop App without signing in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New API Key Alert */}
          {newApiKey && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-sm font-medium text-green-500 mb-2">
                Your new API key (save it now - you won&apos;t see it again):
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all">
                  {newApiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setNewApiKey(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Existing API Keys */}
          {apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.key}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteApiKey(key.id)}
                    disabled={isDeletingKey === key.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No API keys yet. Create one to use the Desktop App.
            </p>
          )}

          {/* Create New Key Button */}
          <Button
            variant="outline"
            onClick={createApiKey}
            disabled={isCreatingKey || apiKeys.length >= 3}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreatingKey ? "Creating..." : "Create API Key"}
          </Button>

          {apiKeys.length >= 3 && (
            <p className="text-xs text-muted-foreground">
              Maximum 3 API keys allowed. Delete one to create a new one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-500" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleEnable2FA}>
              Configure
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active Sessions</p>
              <p className="text-sm text-muted-foreground">
                Manage your active login sessions
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewSessions}>
              View
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password & Authentication</p>
              <p className="text-sm text-muted-foreground">
                Update your password and authentication methods
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenProfile}>
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleOpenProfile}>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
