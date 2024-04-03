'use client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import React, { useMemo } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { endpoint } from '@/utils/constants';
// 👇 Add the following NEW import

require('@solana/wallet-adapter-react-ui/styles.css');

type SolanaProvidersProps = {
    children: React.ReactNode;
}
const SolanaProviders = ({ children }: SolanaProvidersProps) => {
    const walletEndpoint = useMemo(() => endpoint, []);
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ], [])

    return (
        <ConnectionProvider endpoint={walletEndpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                        {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default SolanaProviders;

