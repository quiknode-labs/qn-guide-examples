'use client'
import React from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletProvider } from '@solana/wallet-adapter-react';

require('@solana/wallet-adapter-react-ui/styles.css');

type SolanaProvidersProps = {
    children: React.ReactNode;
}
const SolanaProviders = ({ children }: SolanaProvidersProps) => {

    return (
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
    );
}

export default SolanaProviders;

