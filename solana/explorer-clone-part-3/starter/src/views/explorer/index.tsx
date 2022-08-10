import { FC, useEffect } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import { TransactionLog } from "components/TransactionsLog";
import { GetTokens } from "components/GetTokens";

export const ExplorerView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58())
      getUserSOLBalance(wallet.publicKey, connection)
    }
  }, [wallet.publicKey, connection, getUserSOLBalance])

  return (
<div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-[#9945FF] to-[#14F195]">
          Quick View Explorer
        </h1>
        <div className="text-center">
          {wallet && wallet.publicKey && <p>Connected to: {(wallet.publicKey.toString())}</p>} 
          {wallet && <p>SOL Balance: {(balance || 0).toLocaleString()}</p>}
        </div>
        <div className="text-center">          
          <TransactionLog/>
          <GetTokens/>
        </div>
      </div>
    </div>
  );
};
