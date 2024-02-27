import React, { useState } from 'react';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';

import Web3 from 'web3';

function LogsTab({ data }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const hexToReadableDate = (hexTimestamp) => {
    const timestamp = parseInt(hexTimestamp, 16);
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const ERC20_TRANSFER_EVENT_SIGNATURE = Web3.utils.sha3('Transfer(address,address,uint256)');

  const countERC20Transfers = (receipts) => {
    let transferCount = 0;
    receipts.forEach(receipt => {
      receipt.logs.forEach(log => {
        if (log.topics[0] === ERC20_TRANSFER_EVENT_SIGNATURE) {
          transferCount++;
        }
      });
    });
    return transferCount;
  };

  return (
    <div className="container mx-auto mt-5">
      {data.map((item, index) => {
        const block = item.data[0].block;
        const erc20TransferCount = countERC20Transfers(item.data[0].receipts);

        return (
          <div key={index} className="mb-6">
          <div 
            className="p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 transition duration-300 rounded-lg shadow"
            onClick={() => setExpandedRow(expandedRow === index ? null : index)}
          >
            <div className="font-semibold text-lg mb-2">Dataset: {item.metadata.dataset} | Network: {item.metadata.network}</div>
            <div className="text-sm">Block: #{item.metadata.batch_end_range.toLocaleString()} | Timestamp: {hexToReadableDate(block.timestamp)}</div>
            <div className="text-sm">Transactions: {block.transactions.length.toLocaleString()} | ERC20 Transfers: {erc20TransferCount.toLocaleString()}</div>
          </div>
            {expandedRow === index && (
              <div className="p-4 bg-white rounded-lg shadow mt-2">
                <JsonView src={item} collapsed={false} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default LogsTab;
