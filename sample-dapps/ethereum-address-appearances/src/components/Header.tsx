import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-blue-400 text-white text-xl text-center p-4 shadow-lg">
      Ethereum Transactions Index Comparison by{" "}
      <a
        href="https://www.quicknode.com"
        className="text-blue-600 hover:text-blue-700"
      >
        QuickNode
      </a>
    </header>
  );
};

export default Header;
