import React from 'react';
import Link from 'next/link';
import Search from './Search';
import { Button } from '../ui/button';

const Header = () => {
  return (
    <header className="bg-slate-100 font-bold flex flex-col md:flex-row items-center h-auto md:h-16 px-4 border-b shrink-0 md:px-6 space-y-4 md:space-y-0">
      <div className="w-full md:flex-1 flex justify-center md:justify-start mt-4">
        <Link href="/">
          Demo Ethereum Wallet Explorer
        </Link>
      </div>
      <div className="w-full md:flex-1 flex justify-center">
        <Search />
      </div>
      <div className="w-full md:flex-1 flex justify-end">
        <Link href="https://www.quicknode.com/signup?utm_source=internal&utm_campaign=dapp-examples&utm_content=ETHEREUM-Explorer" target="_blank">
        <Button className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm rounded-md text-white bg-cyan-500 hover:bg-cyan-600 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
          Sign up
        </Button>
        </Link>
      </div>

    </header>
  );
};

export default Header;