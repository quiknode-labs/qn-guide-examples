'use client'

import { useEffect, useState } from 'react'

const formatDate = (timestamp) => {
  try {
    const date = new Date(timestamp * 1000);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    return 'Invalid date';
  }
}

export default function GeneralMetrics({ data, loading }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div>Loading metrics...</div>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering the date on the server
  const dateDisplay = mounted ? formatDate(data?.blockTime) : '';

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-[#575555]">General Metrics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-item">
          <div className="text-[#595857]">Block Number</div>
          <div className="text-xl font-medium text-[#1c1c1b]">{data?.slot || '-'}</div>
        </div>

        <div className="metric-item">
          <div className="text-[#595857]">Block Time (ET)</div>
          <div className="text-xl font-medium text-[#1c1c1b]">
            {dateDisplay}
          </div>
        </div>

        <div className="metric-item">
          <div className="text-[#595857]">Total DEX Transactions</div>
          <div className="text-xl font-medium text-[#1c1c1b]">
            {data?.totalDexTransactions || '-'}
          </div>
        </div>

        <div className="metric-item">
          <div className="text-[#595857]">Total Value Change</div>
          <div className={`text-xl font-medium ${data?.totalValueChange && parseFloat(data.totalValueChange) < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {data?.totalValueChange || '-'}
          </div>
        </div>

        <div className="metric-item">
          <div className="text-[#595857]">Average Compute Used</div>
          <div className="text-xl font-medium text-[#1c1c1b]">
            {data?.averageComputeUsed || '-'}
          </div>
        </div>

        <div className="metric-item">
          <div className="text-[#595857]">Total Compute Used</div>
          <div className="text-xl font-medium text-[#1c1c1b]">
            {data?.totalComputeUsed || '-'}
          </div>
        </div>
      </div>
    </section>
  )
}