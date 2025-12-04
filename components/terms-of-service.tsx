"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from 'lucide-react'

interface TermsOfServiceProps {
  onAccept: () => void
}

export default function TermsOfService({ onAccept }: TermsOfServiceProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if terms have already been accepted
    const termsAccepted = localStorage.getItem("cocktailbot-terms-accepted")
    if (!termsAccepted) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    // Save acceptance in localStorage
    localStorage.setItem("cocktailbot-terms-accepted", "true")
    setIsVisible(false)
    onAccept()
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] bg-gray-900 border-gray-700 text-white flex flex-col">
        <CardHeader className="text-center flex-shrink-0">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-6">
          <div className="text-gray-200 leading-relaxed space-y-4">
            <p>
              This software and the associated construction manual are intended exclusively for
              <strong className="text-green-400"> private use</strong>.
            </p>
            <p>
              Any <strong className="text-red-400">commercial use</strong> - in particular the construction and sale
              of the CocktailBot, use in gastronomy, at events, or commercial use of the software -
              is <strong className="text-red-400">not permitted</strong> without prior written license agreement with the author.
            </p>
            <p>
              By continuing, you confirm that you have read, understood and accepted these terms.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <p className="text-sm text-gray-300">
                <strong>Contact for license inquiries:</strong>
                <br />
                <span className="text-green-400">printcore@outlook.de</span>
              </p>
            </div>
          </div>
        </CardContent>
        <div className="flex-shrink-0 p-6 pt-0">
          <div className="flex justify-center">
            <Button
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 text-lg"
              size="lg"
            >
              I Accept the Terms
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
