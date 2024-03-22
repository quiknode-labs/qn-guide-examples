'use client'

import React from 'react';
import SolanaProviders from '@/components/SolanaProviders';
import Navbar from '@/components/Navbar';
import Main from '@/components/Main';

export default function Home() {

  return (
    <SolanaProviders>
        <Navbar />
        <Main />
    </SolanaProviders>
  )
}
