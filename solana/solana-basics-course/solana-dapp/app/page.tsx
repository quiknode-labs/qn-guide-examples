'use client'

import React from 'react';
import SolanaProviders from '@/components/SolanaProviders';
import Main from '@/components/Main';
import Navbar from '@/components/Navbar';

export default function Home() {

  return (
    <SolanaProviders>
      <Navbar/>
      <Main/>
    </SolanaProviders>
  )
}
