import { Header } from "@/components/header"
import { ComparisonPanel } from "@/components/comparison-panel"
import { CTASection } from "@/components/cta-section"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Experience the Speed of Flashblocks</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See the dramatic difference between Flashblocks and traditional blocks. Watch transactions
            confirm faster with Base Flashblocks.
          </p>
        </div>

        {/* Main Comparison */}
        <ComparisonPanel />

        {/* Call to Action */}
        <CTASection />

        {/* Footer Info */}
        <Card>
          <CardContent className="p-6 text-center text-sm text-gray-600">
            <p>
              This demo showcases Base Flashblocks technology. Flashblocks provide faster confirmation times compared to
              traditional blocks, enabling near-instant transaction experiences.
            </p>
            <p className="mt-2">Built with Next.js, Viem, and Quicknode infrastructure.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
