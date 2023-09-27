const hre = require("hardhat");
const { ethers } = require("ethers")
require("dotenv").config()

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const registryAddress = '0x02101dfB77FDE026414827Fdc604ddAF224F0921';
const implementationAddress = '0x2d25602551487c3f3354dd80d76d54383a243358';
const tokenId = 0;
const salt = 0;
let nftContract;

const getTokenBoundAccount = async (RegistryContract) => {
  const chainId = await hre.network.provider.send('eth_chainId');
  const tokenBoundAccount = await RegistryContract.account(implementationAddress, chainId, nftContract, tokenId, salt);
  console.log('Token Bound Account: ', tokenBoundAccount);
  return tokenBoundAccount;
};

const main = async () => {
  const RegistryContract = await hre.ethers.getContractAt('ERC6551Registry', registryAddress, signer);
  const chainId = await hre.network.provider.send('eth_chainId');

  console.log('Deploying contract...');
  const nftTokenContract = await hre.ethers.deployContract('MyToken', signer); 
  await nftTokenContract.waitForDeployment();
  nftContract = nftTokenContract.target;
  console.log(`ERC-721 contract deployed to ${nftContract}`);

  const mintTxn = await nftTokenContract.safeMint(signer.address);
  console.log(`Mint successful: ${mintTxn.hash}`);

  const initData = '0x';
  const transaction = await RegistryContract.createAccount(implementationAddress, chainId, nftTokenContract.target, tokenId, salt, initData);

  await transaction.wait();
  console.log(`createAccount call successful. Tx Hash: ${transaction.hash}`);
  await getTokenBoundAccount(RegistryContract);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});