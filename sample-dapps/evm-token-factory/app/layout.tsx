import React from 'react';
import './globals.css'
import Navbar from './components/Navbar';
import { Web3Modal } from '../context/web3modal';

export const metadata = {
  title: 'Token Factory',
  description: 'Token Factory'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Modal>
      <html lang="en">
        <body>
          <Navbar />
          {children}
          <footer className="w-full text-center border-t border-gray-300 py-4">
            <span>Powered by <a href="https://www.quicknode.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">QuickNode</a> ❤️</span>
          </footer>
        </body>
      </html>
    </Web3Modal>
  );
}
