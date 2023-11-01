import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

const useSolanaBalance = () => {
    const [balance, setBalance] = useState(0);
    const [isLoading, setLoading] = useState(false);
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    useEffect(() => {
        async function fetchBalance() {
            if (!publicKey) return;
            
            setLoading(true);
            try {
                const balance = await connection.getBalance(publicKey, 'confirmed');
                setBalance(balance / LAMPORTS_PER_SOL);
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            } finally {
                setLoading(false);
            }
        }
    
        fetchBalance();
    }, [publicKey, connection]); 
    
    return { balance, isLoading };
};

const Balance = () => {
    const { balance, isLoading } = useSolanaBalance();

    return (
        <div className="flex justify-center items-center v-screen"> 
            {isLoading ? "Loading..." : `Balance: ${balance} SOL`}
        </div>
    );
};

export default Balance;