'use client'

import React from 'react';
import { HomePage } from "@/components/HomePage";
import { Providers } from "@/components/Providers";

export default function Page() {
  return (
    <Providers>
      <HomePage />
    </Providers>
  );
}