import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, BookOpen, Play, Rocket } from "lucide-react"
import { QUICKNODE_LINKS } from "@/lib/constants"

export const CTASection: React.FC = () => {
  const links = [
    {
      title: "QuickNode Guide",
      description: "Complete guide to implementing Flashblocks",
      url: QUICKNODE_LINKS.GUIDE,
      icon: BookOpen,
    },
    {
      title: "Flashblocks Docs",
      description: "Technical documentation and API reference",
      url: QUICKNODE_LINKS.DOCS,
      icon: ExternalLink,
    },
    {
      title: "Video Tutorial",
      description: "Watch step-by-step implementation",
      url: QUICKNODE_LINKS.VIDEO,
      icon: Play,
    },
    {
      title: "Try with QuickNode",
      description: "Get started with your own endpoint",
      url: QUICKNODE_LINKS.SIGNUP,
      icon: Rocket,
      primary: true,
    },
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Ready to implement Flashblocks in your dApp?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Button
                key={link.title}
                variant={link.primary ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                asChild
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <Icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium">{link.title}</div>
                    <div className="text-xs opacity-80">{link.description}</div>
                  </div>
                </a>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
