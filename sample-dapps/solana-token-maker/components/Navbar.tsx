'use client'
import React from "react";
import dynamic from "next/dynamic";
import Link from 'next/link';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const Navbar = () => {
  return (
    <div className="w-full h-20 text-white bg-slate-900 sticky top-0 z-20">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full ">
          <Link href="/">
          Quick-Token
          </Link>
          <WalletMultiButtonDynamic />
        </div>
      </div>
    </div>
  );
};

export default Navbar;