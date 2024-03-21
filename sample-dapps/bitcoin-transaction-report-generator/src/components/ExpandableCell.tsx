// src/components/ExpandableCell.tsx
import React, { useState } from "react";

interface ExpandableCellProps {
  content: string; // Comma-separated string of addresses
}

const ExpandableCell: React.FC<ExpandableCellProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const addresses = content.split(",");
  const firstAddress = addresses[0];
  const remainingAddresses = addresses.slice(1).join(",\n");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => console.log("Text copied to clipboard"),
      (err) => console.error("Failed to copy text: ", err)
    );
  };

  return (
    <td className="p-2 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
      <div className="flex items-center">
        {isExpanded ? (
          <span>{firstAddress}</span>
        ) : (
          <span
            title={firstAddress}
            onClick={() => copyToClipboard(firstAddress)}
          >
            {firstAddress.slice(0, 6)}...{firstAddress.slice(-4)}
          </span>
        )}
        <span
          onClick={() => copyToClipboard(content)}
          className="cursor-pointer"
          title="Copy to clipboard"
        >
          📋
        </span>
      </div>

      {addresses.length > 1 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 ml-1"
        >
          {isExpanded ? "(less)" : "(... more)"}
        </button>
      )}

      {isExpanded && (
        <div className="whitespace-pre mt-1 ">{remainingAddresses}</div>
      )}
    </td>
  );
};

export default ExpandableCell;
