'use client'

import React from 'react';
import SolanaProviders from '@/components/SolanaProviders';
import Navbar from '@/components/Navbar';
import Game from '@/components/Game';

export default function Home() {

  return (
    <SolanaProviders>
        <Navbar />
        <Game />
    </SolanaProviders>
  )
}
