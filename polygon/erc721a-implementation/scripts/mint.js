const hre = require("hardhat");

async function main() {

    const contractAddress = "BATCHNFTS_CONTRACT_ADDRESS";
    const recieverAddress = "RECIEVER_ADDRESS"
    const batchNFTs = await hre.ethers.getContractAt("BatchNFTs", contractAddress);

    const mintTokens = await batchNFTs.mint(recieverAddress, 3, { value: ethers.utils.parseEther("0.03") });
    console.log(`Transaction Hash: https://mumbai.polygonscan.com/tx/${mintTokens.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});