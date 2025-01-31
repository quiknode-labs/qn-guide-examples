'use client'

import { useState } from 'react'
import BlockInput from '../components/BlockInput'
import GeneralMetrics from '../components/GeneralMetrics'
import DexSection from '../components/DexSection'
import TopTokens from '../components/TopTokens'
import ErrorMessage from '../components/ErrorMessage'

export default function Home() {
  const [blockData, setBlockData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBlockData = async (blockNumber) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        "https://api.quicknode.com/functions/rest/v1/functions/074c4bbd-699e-40fc/call?result_only=true", // Replace with your QuickNode Function URL
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_QUICKNODE_FUNCTIONS_API_KEY
          },
          body: JSON.stringify({
            user_data: { blockNumber: parseInt(blockNumber) }
          })
        }
      )

      const data = await response.json()
      
      if (!data.results?.dexMetrics) {
        throw new Error('Invalid block data')
      }

      setBlockData(data.results)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#575555]">
            Solana DEX Metrics Explorer
          </h1>
        </div>
        
        <BlockInput 
          onSubmit={fetchBlockData}
          loading={loading}
        />

        {error && <ErrorMessage />}

        {blockData && !error && (
          <div className="space-y-8">
            <GeneralMetrics data={blockData.dexMetrics} loading={loading} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DexSection
                data={blockData.dexMetrics.programs["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"]}
                name="Raydium"
                color="bg-purple-50"
                logo="/raydium-logo.png"
                loading={loading}
              />
              <DexSection
                data={blockData.dexMetrics.programs["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"]}
                name="Jupiter"
                color="bg-yellow-50"
                logo="/jupiter-logo.png"
                loading={loading}
              />
              <DexSection
                data={blockData.dexMetrics.programs["PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY"]}
                name="Phoenix"
                color="bg-orange-50"
                logo="/phoenix-logo.png"
                loading={loading}
              />
            </div>

            <TopTokens 
              tokens={blockData.dexMetrics.topTokens}
              loading={loading}
            />
          </div>
        )}
      </div>
    </main>
  )
}