'use client'

import { useState } from 'react'

export default function BlockInput({ onSubmit, loading }) {
  const [blockNumber, setBlockNumber] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (blockNumber) {
      onSubmit(blockNumber)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1">
          <input
            type="number"
            value={blockNumber}
            onChange={(e) => setBlockNumber(e.target.value)}
            placeholder="Enter block number..."
            className="w-full text-[#575555] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading || !blockNumber}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            <span>{loading ? 'Loading...' : 'Search'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}