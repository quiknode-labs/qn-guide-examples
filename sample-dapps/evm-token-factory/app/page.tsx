"use client"
import { useState } from 'react';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { CHAINS } from './utils/ethereum';
import { BrowserProvider, ethers } from 'ethers';

export default function Home() {
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [isTokenCreated, setIsTokenCreated] = useState(false);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const { chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const handleCreateToken = async () => {
    if (!isConnected) throw Error('User disconnected');

    if (!walletProvider) {
      throw new Error('Wallet provider is undefined');
    }

    setIsCreatingToken(true);
    const ethersProvider = new BrowserProvider(walletProvider);
    const decoder = ethers.AbiCoder.defaultAbiCoder();
    const signer = await ethersProvider.getSigner();
    const signerAddress = signer.address;

    setTransactionStatus('Waiting for transaction...');
    try {
        const response = await fetch('/api/evm/createToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chainId,
                signerAddress,
                tokenName,
                tokenSymbol,
                tokenAmount
            }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const chainConfig = CHAINS[chainId ?? 1];
        const populateTxn = await signer.populateTransaction(data.apiResponse)
        const send = await signer.sendTransaction(populateTxn)
        await send.wait()
        const receipt = await ethersProvider.getTransactionReceipt(send.hash)
        const tokenAddressLogs = receipt?.logs[3].topics[1] as string;
        const tokenAddress = decoder.decode(['address'], tokenAddressLogs)[0]
        setExplorerUrl(chainConfig.explorerUrl)
        setContractAddress(tokenAddress)
        setTransactionStatus('Token creation successful!');
        setIsTokenCreated(true);
    } catch (error) {
        console.error('Error:', error);
        setTransactionStatus('Failed to create token');
    } finally {
        setIsCreatingToken(false);
    }
};

  const handleResetForm = () => {
    setTokenName('');
    setTokenSymbol('');
    setTokenAmount('');
    setTransactionStatus('');
    setContractAddress('');
    setExplorerUrl('');
    setIsTokenCreated(false);
    setIsCreatingToken(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-1 lg:text-left">
        <div className="p-8">
          <h2 className="mb-4 text-2xl font-semibold">ERC-20 Token Factory</h2>
          {!isTokenCreated ? (
            <>
              <div className="mb-4">
                <label htmlFor="tokenName" className="block mb-2 text-sm font-bold text-gray-700">Token Name:</label>
                <input
                  id="tokenName"
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full p-2 border rounded shadow"
                  placeholder="Enter token name"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="tokenSymbol" className="block mb-2 text-sm font-bold text-gray-700">Token Symbol:</label>
                <input
                  id="tokenSymbol"
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full p-2 border rounded shadow"
                  placeholder="Enter token symbol"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="tokenAmount" className="block mb-2 text-sm font-bold text-gray-700">Token Amount:</label>
                <input
                  id="tokenAmount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full p-2 border rounded shadow"
                  placeholder="Enter amount to be minted"
                />
              </div>
              <button
                onClick={handleCreateToken}
                className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                disabled={!isConnected || isCreatingToken}
              >
                {transactionStatus || 'Create Token'}
              </button>
            </>
          ) : (
            <div className="mt-4 border p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Token Created!</h3>
              <p><strong>Name: {tokenName}</strong></p>
              <p><strong>Symbol: {tokenSymbol}</strong></p>
              <p><strong>Supply: {tokenAmount}</strong></p>
              <p><strong>Contract Address:</strong> {contractAddress}</p>
              <button
                onClick={() => window.open(`${explorerUrl}/address/${contractAddress}`, '_blank')}
                className="mt-4 px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
              >
                View On Explorer
              </button>
              <button
                onClick={handleResetForm}
                className="mt-4 px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
              >
                Create New Token
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
