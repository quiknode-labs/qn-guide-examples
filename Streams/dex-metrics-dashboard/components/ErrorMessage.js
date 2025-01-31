'use client'

export default function ErrorMessage() {
  return (
    <div className="max-w-md mx-auto bg-red-50 p-6 rounded-lg">
      <div className="text-center">
        <div className="text-xl font-semibold text-red-800 mb-4">
          🥺 Oh ho! Couldn't find the block number due to the following reasons:
        </div>
        <div className="text-red-700">
          <div className="space-y-2">
            <div>• The block is not indexed yet 🥱</div>
            <div>• The block data is incomplete 😓</div>
            <div>• The block number is invalid 🙅‍♀️</div>
          </div>
        </div>
      </div>
    </div>
  )
}