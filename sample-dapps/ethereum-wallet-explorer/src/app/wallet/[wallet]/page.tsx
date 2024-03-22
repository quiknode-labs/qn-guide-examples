import React from 'react'
import TokenCard from "../../../components/explorer/tokens/TokensCard"
import BalanceCard from "../../../components/explorer/balance/BalanceCard"
import NFTCard from "../../../components/explorer/nfts/NFTsCard"
import TransactionCard from '@/components/explorer/transactions/TransactionsCard'

interface WalletPageProps {
  params: {
    wallet: string;
  };
}

export default function Page({ params: { wallet } }: WalletPageProps) {
  return (
    <div className="flex flex-col w-full min-h-screen p-4 md:p-10 space-y-4">
      <BalanceCard walletAddress={wallet} />
      <TransactionCard walletAddress={wallet} />
      <TokenCard walletAddress={wallet} />
      <NFTCard walletAddress={wallet} />
    </div>
  );
}
