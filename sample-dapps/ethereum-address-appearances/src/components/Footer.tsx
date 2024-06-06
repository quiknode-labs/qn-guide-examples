import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-400 text-white text-center p-1 shadow-lg fixed bottom-0 left-0 right-0">
      Created with ❤️ and{" "}
      <a
        href="https://www.quicknode.com"
        className="text-blue-600 hover:text-blue-700"
      >
        QuickNode
      </a>
    </footer>
  );
};

export default Footer;
