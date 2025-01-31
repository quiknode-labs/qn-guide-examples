'use client'

export default function DexSection({ data, name, color, logo, loading }) {
  if (!data || loading) {
    return (
      <div className={`${color} p-6 rounded-lg shadow-md animate-pulse`}>
        <div>Loading DEX data...</div>
      </div>
    )
  }

  return (
    <div className={`${color} p-6 rounded-lg shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8">
          <img src={logo} alt={`${name} logo`} className="w-full h-full object-contain" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#575555]">{name}</h2>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="text-[#595857]">Average Compute Used</div>
          <div className="font-medium text-[#1c1c1b]">{data.averageComputeUsed}</div>
        </div>
        <div>
          <div className="text-[#595857]">Total Compute Used</div>
          <div className="font-medium text-[#1c1c1b]">{data.totalComputeUsed}</div>
        </div>
        <div>
          <div className="text-[#595857]">Transactions</div>
          <div className="font-medium text-[#1c1c1b]">{data.transactions}</div>
        </div>
        <div>
          <div className="text-[#595857]">Success Rate</div>
          <div className="font-medium text-[#1c1c1b]">{data.successRate}</div>
        </div>
        <div>
          <div className="text-[#595857]">Transaction Share</div>
          <div className="font-medium text-[#1c1c1b]">{data.transactionShare}</div>
        </div>
        <div>
          <div className="text-[#595857]">Value Change</div>
          <div className={`font-medium ${parseFloat(data.valueChange) < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {data.valueChange}
          </div>
        </div>
      </div>
    </div>
  )
}