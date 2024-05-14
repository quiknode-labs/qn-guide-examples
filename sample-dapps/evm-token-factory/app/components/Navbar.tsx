import React from 'react';
import ConnectButton from './Connect'

function Navbar() {

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-end items-center">
        <ConnectButton />
      </div>
    </nav>
  );
}

export default Navbar;
