import React from 'react';
import Link from 'next/link';
import Search from './Search';

const Header = () => {
  return (
    <header className="bg-slate-100 font-bold flex flex-col md:flex-row items-center h-auto md:h-16 px-4 border-b shrink-0 md:px-6 space-y-4 md:space-y-0">
      <div className="w-full md:flex-1 flex justify-center md:justify-start mt-4">
        <Link href="/">
          Demo Solana Wallet Explorer
        </Link>
      </div>
      <div className="w-full md:flex-1 flex justify-center">
        <Search />
      </div>
      <div className="w-full md:flex-1"> 
      </div>
    </header>
  );
};

export default Header;
