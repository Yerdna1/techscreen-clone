import { Navbar } from "@/components/landing/Navbar"
import { Pricing } from "@/components/landing/Pricing"
import { Footer } from "@/components/landing/Footer"

export const metadata = {
  title: "Pricing - LiveHelpEasy",
  description: "Choose the plan that fits your interview preparation needs",
}

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-24">
        <Pricing />
      </div>
      <Footer />
    </main>
  )
}
