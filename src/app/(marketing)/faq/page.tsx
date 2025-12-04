import { Navbar } from "@/components/landing/Navbar"
import { FAQ } from "@/components/landing/FAQ"
import { Footer } from "@/components/landing/Footer"

export const metadata = {
  title: "FAQ - TechScreen AI",
  description: "Frequently asked questions about TechScreen AI",
}

export default function FAQPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-24">
        <FAQ />
      </div>
      <Footer />
    </main>
  )
}
