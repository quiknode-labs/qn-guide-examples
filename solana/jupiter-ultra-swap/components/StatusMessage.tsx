"use client";

import type { SwapStatus } from "@/lib/types";

interface StatusMessageProps {
  status: SwapStatus;
  error: string | null;
  txSignature: string | null;
  estimatedOutput: string | null;
}

export function StatusMessage({
  status,
  error,
  txSignature,
  estimatedOutput,
}: StatusMessageProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "success" && txSignature) {
    const explorerUrl = `https://solscan.io/tx/${txSignature}`;
    return (
      <div className="p-4 bg-[oklch(89%_.220298_144.5)]/20 border border-[oklch(89%_.220298_144.5)]/40 rounded-lg">
        <div className="flex items-center gap-2 text-gray-900">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="font-medium">Swap complete!</span>
        </div>
        {estimatedOutput && (
          <div className="mt-2 text-sm text-gray-700">
            Estimated output: {estimatedOutput}
          </div>
        )}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-gray-900 hover:underline font-medium"
        >
          View transaction on Solscan →
        </a>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="font-medium">Swap failed</span>
        </div>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (status === "quoting" || status === "executing") {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-gray-900">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>
            {status === "quoting"
              ? "Fetching best route..."
              : "Swapping..."}
          </span>
        </div>
      </div>
    );
  }

  if (status === "signing") {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <svg
            className="animate-pulse h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="font-medium">Please approve in your wallet</span>
        </div>
      </div>
    );
  }

  return null;
}

