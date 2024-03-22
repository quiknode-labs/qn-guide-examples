'use client'

import React from 'react';
import SolanaProviders from '@/components/SolanaProviders';
import Navbar from '@/components/Navbar';
import Board from '@/components/Board';

export default function Page({ params }: { params: { gamePda: string } }) {

    return (
        <SolanaProviders>
                <Navbar />
                <Board gameId={params.gamePda}/>
        </SolanaProviders>
    );
}