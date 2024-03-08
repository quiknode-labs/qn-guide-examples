import TransactionCard from "@/components/explorer/transactions/TransactionsCard"
import TokenCard from "@/components/explorer/tokens/TokenCard"
import BalanceCard from "@/components/explorer/balance/BalanceCard"
import NftCard from "@/components/explorer/nfts/NftCard";

interface WalletPageProps {
  params: {
    wallet: string;
  };
}

export default function Page({ params: { wallet } }: WalletPageProps) {
  const showNftCard = process.env.DAS_API_ENABLED === 'true';
  return (
    <div className="flex flex-col w-full min-h-screen p-4 md:p-10 space-y-4">
      <BalanceCard walletAddress={wallet} />
      <TokenCard walletAddress={wallet} />
      <TransactionCard walletAddress={wallet} />
      {showNftCard && <NftCard walletAddress={wallet} />}
    </div>
  );
}
