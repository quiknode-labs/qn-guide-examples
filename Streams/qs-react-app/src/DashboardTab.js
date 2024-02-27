import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import 'react18-json-view/src/style.css'; // Assuming similar styling requirements
const BN = require('bn.js');

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const TRANSFER_SIGNATURE = Web3.utils.sha3('Transfer(address,address,uint256)');

function DashboardTab({ data }) {
  const [usdcMetrics, setUsdcMetrics] = useState({
    totalBlocks: 0,
    averageTransactionsPerBlock: 0,
    totalTransactions: 0,
    uniqueAddresses: new Set(),
    averageTransferAmount: 0,
    highestTransferAmount: 0,
    highestFee: 0
  });

  useEffect(() => {

    let totalTransferAmount = 0;
    let totalTransferCount = 0;
    let highestTransferAmount = 0;
    let highestFee = 0;

    data.forEach(blockDataWrapper => {
      blockDataWrapper.data.forEach(blockData => {
        if (!Array.isArray(blockData.receipts)) {
          console.error('Receipts is not an array:', blockData.receipts);
          return;
        }

        blockData.receipts.forEach(receipt => {
          if (!Array.isArray(receipt.logs)) {
            console.error('Logs is not an array:', receipt.logs);
            return;
          }

          receipt.logs.forEach(log => {
            if (log.address.toLowerCase() === USDC_ADDRESS.toLowerCase() && log.topics[0] === TRANSFER_SIGNATURE) {
              const transferValue = new BN(log.data.substring(2), 16).div(new BN(1000000)).toNumber();
              totalTransferAmount += transferValue;
              totalTransferCount++;
              highestTransferAmount = Math.max(highestTransferAmount, transferValue);

              const fee = receipt.gasUsed * receipt.effectiveGasPrice;
              highestFee = Math.max(highestFee, fee);

              usdcMetrics.uniqueAddresses.add(log.topics[1]);
              usdcMetrics.uniqueAddresses.add(log.topics[2]);
            }
          });
        });
      });
    });

    const totalBlocks = data.reduce((total, blockDataWrapper) => total + blockDataWrapper.data.length, 0);

    setUsdcMetrics({
      totalBlocks,
      averageTransactionsPerBlock: (totalTransferCount / Math.max(totalBlocks, 1)).toFixed(0),
      totalTransactions: totalTransferCount,
      uniqueAddresses: usdcMetrics.uniqueAddresses,
      averageTransferAmount: totalTransferCount > 0 ? (totalTransferAmount / totalTransferCount).toFixed(2) : '0.00',
      highestTransferAmount: highestTransferAmount,
      highestFee: highestFee
    });

  }, [data]);

  return (
    <div className="container mx-auto mt-5 px-4 lg:px-8">
      <h2 className="text-2xl font-bold mb-4">USDC Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(usdcMetrics).map(([key, value], index) => (
          <div key={index} className="p-4 bg-gray-100 hover:bg-gray-200 transition duration-300 rounded-lg shadow">
            <h3 className="font-semibold">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
            {/* Conditionally render content based on the key */}
            {key === 'uniqueAddresses' ? (
              <p>{value.size}</p>
            ) : key === 'highestFee' ? (
              <p>{parseFloat(Web3.utils.fromWei(value.toString(), 'ether')).toFixed(2)} ETH</p>
            ) : key.includes('Amount') ? (
              <p>{value} USDC</p>
            ) : (
              <p>{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardTab;
