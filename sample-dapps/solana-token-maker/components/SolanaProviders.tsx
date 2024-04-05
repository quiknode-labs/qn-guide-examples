'use client'
import React, { useMemo } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { endpoint } from '@/utils/constants';

require('@solana/wallet-adapter-react-ui/styles.css');

type SolanaProvidersProps = {
    children: React.ReactNode;
}
const SolanaProviders = ({ children }: SolanaProvidersProps) => {
    const walletEndpoint = useMemo(() => endpoint, []);

    return (
        <ConnectionProvider endpoint={walletEndpoint}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default SolanaProviders;

