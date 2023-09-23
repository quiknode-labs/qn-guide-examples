const hre = require('hardhat');
const { ethers } = require('ethers');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const nftContractAddress = 'YOUR_NFT_ADDRESS';
const registryContractAddress = '0x02101dfB77FDE026414827Fdc604ddAF224F0921';
const accountImplementationAddress = '0x2d25602551487c3f3354dd80d76d54383a243358';
const tokenBoundAccountAddress = 'YOUR_TOKEN_BOUND_ACCOUNT_ADDRESS';

const tokenId = 0;
const salt = 0;

async function getTokenBoundAccount() {
  const chainId = await hre.network.provider.send('eth_chainId');
  const ERC6551Registry = await hre.ethers.getContractAt('ERC6551Registry', registryContractAddress);
  
  return await ERC6551Registry.account(accountImplementationAddress, chainId, nftContractAddress, tokenId, salt);
}

async function sendFundsToTokenAccount() {
  try {
    const computedAddress = await getTokenBoundAccount();
    console.log('Token Bound Account Address:', computedAddress);

    const balanceBefore = await hre.ethers.provider.getBalance(computedAddress);
    console.log(`Token account has ${balanceBefore.toString()} ETH before transfer`);

    const tx = {
      to: computedAddress,
      value: hre.ethers.parseEther('0.01'),
    };

    const receipt = await signer.sendTransaction(tx);
    await receipt.wait();

    const tokenAccountBalance = ethers.formatEther((await hre.ethers.provider.getBalance(computedAddress)).toString());
    console.log(`Token account has ${tokenAccountBalance} ETH after transfer`);
  } catch (err) {
    console.error('Error in sendFundsToTokenAccount:', err);
  }
}

async function transferToken() {
  try {
    const ERC721Contract = await hre.ethers.getContractAt('MyToken', nftContractAddress, signer);
    const currentOwner = await ERC721Contract.ownerOf(tokenId);
    console.log(`Current owner of tokenId ${tokenId} is ${currentOwner}`);

    const approveTxn = await ERC721Contract.approve(tokenBoundAccountAddress, tokenId);
    await approveTxn.wait();
    console.log('approve transaction successful. Hash:', approveTxn.hash);

    const transferTxn = await ERC721Contract.transferFrom(signer.address, tokenBoundAccountAddress, tokenId);
    await transferTxn.wait();
    console.log('transfer transaction successful. Hash:', transferTxn.hash);

    const newOwner = await ERC721Contract.ownerOf(tokenId);
    console.log(`New owner of tokenId ${tokenId} is ${newOwner}`);
  } catch (err) {
    console.error('Error in transferToken:', err);
  }
}

async function main() {
  await sendFundsToTokenAccount();
  await transferToken();
}

main().catch(err => console.error('Error in main function:', err));