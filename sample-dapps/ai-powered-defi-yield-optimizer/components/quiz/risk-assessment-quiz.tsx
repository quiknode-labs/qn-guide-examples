"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import type { RiskProfile } from "@/types/strategy"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface RiskAssessmentQuizProps {
  onComplete: (profile: RiskProfile) => void
  onBack: () => void
}

export function RiskAssessmentQuiz({ onComplete, onBack }: RiskAssessmentQuizProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState({
    investmentAmount: 5000,
    riskTolerance: "",
    timeHorizon: "",
    poolTypes: [] as string[],
    minTVL: 1000000,
  })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete quiz
      const profile: RiskProfile = {
        investmentAmount: answers.investmentAmount,
        riskTolerance: answers.riskTolerance as "conservative" | "moderate" | "aggressive",
        timeHorizon: answers.timeHorizon as "short" | "medium" | "long",
        minTVL: answers.minTVL,
        poolTypes: answers.poolTypes,
      }
      onComplete(profile)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      onBack()
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return answers.investmentAmount > 0
      case 2:
        return answers.riskTolerance !== ""
      case 3:
        return answers.timeHorizon !== ""
      case 4:
        return answers.poolTypes.length > 0
      case 5:
        return answers.minTVL > 0
      default:
        return false
    }
  }

  const handlePoolTypeChange = (poolType: string, checked: boolean) => {
    if (checked) {
      setAnswers((prev) => ({
        ...prev,
        poolTypes: [...prev.poolTypes, poolType],
      }))
    } else {
      setAnswers((prev) => ({
        ...prev,
        poolTypes: prev.poolTypes.filter((type) => type !== poolType),
      }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Risk Assessment Quiz</CardTitle>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How much are you looking to invest?</h3>
              <div className="space-y-4">
                <Slider
                  value={[answers.investmentAmount]}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, investmentAmount: value[0] }))}
                  max={100000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600">${answers.investmentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$1,000</span>
                  <span>$100,000+</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What's your risk tolerance?</h3>
              <RadioGroup
                value={answers.riskTolerance}
                onValueChange={(value) => setAnswers((prev) => ({ ...prev, riskTolerance: value }))}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="conservative" id="conservative" />
                  <Label htmlFor="conservative" className="flex-1 cursor-pointer">
                    <div className="font-medium">Conservative</div>
                    <div className="text-sm text-gray-600">I prefer stable returns with minimal risk</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                    <div className="font-medium">Moderate</div>
                    <div className="text-sm text-gray-600">I'm comfortable with some volatility for better returns</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="aggressive" id="aggressive" />
                  <Label htmlFor="aggressive" className="flex-1 cursor-pointer">
                    <div className="font-medium">Aggressive</div>
                    <div className="text-sm text-gray-600">I want maximum yield potential</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What's your investment time horizon?</h3>
              <RadioGroup
                value={answers.timeHorizon}
                onValueChange={(value) => setAnswers((prev) => ({ ...prev, timeHorizon: value }))}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="short" id="short" />
                  <Label htmlFor="short" className="flex-1 cursor-pointer">
                    <div className="font-medium">Short-term (1-3 months)</div>
                    <div className="text-sm text-gray-600">Quick returns, higher liquidity needs</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium" className="flex-1 cursor-pointer">
                    <div className="font-medium">Medium-term (3-6 months)</div>
                    <div className="text-sm text-gray-600">Balanced approach to growth and stability</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="long" id="long" />
                  <Label htmlFor="long" className="flex-1 cursor-pointer">
                    <div className="font-medium">Long-term (6+ months)</div>
                    <div className="text-sm text-gray-600">Maximum growth potential, can weather volatility</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Which pool types interest you?</h3>
              <div className="space-y-3">
                {[
                  { id: "stable", label: "Stable Pairs", desc: "USDC/USDbC, DAI/USDC - Lower risk, steady returns" },
                  { id: "major", label: "Major Tokens", desc: "ETH/USDC, WBTC/ETH - Moderate risk, good liquidity" },
                  {
                    id: "volatile",
                    label: "Volatile Pairs",
                    desc: "Altcoin pairs - Higher risk, higher potential returns",
                  },
                  {
                    id: "concentrated",
                    label: "Concentrated Liquidity",
                    desc: "Advanced strategies with focused price ranges",
                  },
                ].map((poolType) => (
                  <div key={poolType.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={poolType.id}
                      checked={answers.poolTypes.includes(poolType.id)}
                      onCheckedChange={(checked) => handlePoolTypeChange(poolType.id, checked as boolean)}
                    />
                    <Label htmlFor={poolType.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{poolType.label}</div>
                      <div className="text-sm text-gray-600">{poolType.desc}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Minimum pool size preference</h3>
              <p className="text-gray-600">Larger pools typically have lower risk but may offer lower returns</p>
              <div className="space-y-4">
                <Slider
                  value={[answers.minTVL]}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, minTVL: value[0] }))}
                  max={10000000}
                  min={100000}
                  step={100000}
                  className="w-full"
                />
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    ${(answers.minTVL / 1000000).toFixed(1)}M+ TVL
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$100K</span>
                  <span>$10M+</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? "Back to Pools" : "Previous"}
            </Button>

            <Button onClick={handleNext} disabled={!canProceed()} className="bg-blue-600 hover:bg-blue-700">
              {currentStep === totalSteps ? "Generate Strategy" : "Next"}
              {currentStep < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
