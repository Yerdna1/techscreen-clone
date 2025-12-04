import {
  EyeOff,
  Keyboard,
  Layers,
  Zap,
  Mic,
  Code2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const features = [
  {
    icon: EyeOff,
    title: "Completely Invisible",
    description:
      "Tech Screen is completely invisible to screen-sharing software on platforms like Zoom, Google Meet, CoderPad, Discord and more. Get real-time AI assistance without leaving any trace.",
  },
  {
    icon: Keyboard,
    title: "Easy-to-Use Shortcuts",
    description:
      "Tech Screen offers seamless, easy-to-use shortcuts that let you access AI assistance instantly—without breaking focus. Navigate coding challenges effortlessly.",
  },
  {
    icon: Layers,
    title: "Always On Top",
    description:
      "Tech Screen works seamlessly on top of your active applications, eliminating the need to Alt+Tab or switch windows. It's always ready to assist without any extra clicks.",
  },
  {
    icon: Zap,
    title: "Instant Responses",
    description:
      "Tech Screen delivers instant, precise answers to any technical question, ensuring you never waste time waiting. Get real-time support so you can stay focused.",
  },
  {
    icon: Mic,
    title: "Multi-Input Support",
    description:
      "Tech Screen intelligently processes various input types, including computer audio, microphone input, and on-screen content. Our AI adapts to provide seamless assistance.",
  },
  {
    icon: Code2,
    title: "Multi-Language Support",
    description:
      "Tech Screen understands and assists with multiple programming languages. Whether it's Python, Java, C++, JavaScript, or any other language, get accurate help tailored to your needs.",
  },
]

export function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">Features</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to ace your technical interviews with confidence
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="bg-card/50 border-border/50 hover:border-violet-500/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                    <feature.icon className="h-6 w-6 text-violet-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
