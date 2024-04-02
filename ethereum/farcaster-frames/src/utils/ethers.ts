import { TokenBalance } from "../types"
import { ethers } from "ethers";
import { contractsInfo } from "../config"
import 'dotenv/config'

const providerURL = process.env.QUICKNODE_HTTP_ENDPOINT as string;
const tokensAvailabletoBorrow = contractsInfo
  
export async function getBorrowPower(tokenArray: TokenBalance[]): Promise<number> {
    let totalBorrowPower = 0;

    const borrowPowerPromises = tokenArray.map(async (token) => {
      const tokenInfo = tokensAvailabletoBorrow[token.name as keyof typeof tokensAvailabletoBorrow];
      if (!tokenInfo) return 0;
  
      try {
        const tokenBalance = await ethers.formatUnits(token.totalBalance, ethers.toNumber(token.decimals));
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenInfo.id}&vs_currencies=usd`);
        const data = await response.json();
        const tokenPrice = data[tokenInfo.id].usd || 1;
        const borrowPower = ((parseFloat(tokenBalance) * tokenPrice) * tokenInfo.collateralFactor);
        return borrowPower;
      } catch (error) {
        console.error('Error fetching token price:', error);
        return 0;
      }
    });
  
    const results = await Promise.all(borrowPowerPromises);
    totalBorrowPower = results.reduce((acc, curr) => acc + curr, 0);
  
    return totalBorrowPower;
}

export async function getWalletTokenBalances(walletAddress: string) {
    const tokenAddresses = Object.values(contractsInfo).map(info => info.address);
    const response = await fetch(providerURL, {
       method: 'POST',
       headers: {
          'Content-Type': 'application/json'
       },
       body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "qn_getWalletTokenBalance",
          params: [{
             wallet: walletAddress,
             contracts: tokenAddresses
          }]
       })
    });
 
    if (!response.ok) {
       throw new Error(`Network response was not ok: ${response.status}`);
    }
    const data = await response.json();
    const tokens = data?.result?.result ?? [];
    const tokenBalances: TokenBalance[] = tokens.map((token: any) => ({
       name: token.name,
       address: token.address,
       totalBalance: token.totalBalance,
       decimals: token.decimals,
    }));
 
    return tokenBalances
}

export async function getUserfromfId(fid: number) {
    // Method 1: Using Hubble node with HTTP API
    const hubbleHTTPapi = process.env.HUBBLE_URL as string;
    try {
        const userDataByFid = await fetch(`${hubbleHTTPapi}/v1/userDataByFid?fid=${fid}&user_data_type=6`, {
            method: 'GET',
        });
        const fetchUser = await userDataByFid.json();
        const username = fetchUser.data.userDataBody.value;
        const userDataByName = await fetch(`${hubbleHTTPapi}/v1/userNameProofByName?name=${username}&user_data_type=6`, {
            method: 'GET',
        });
        const fetchAddress = await userDataByName.json()
        let custodyAddress = fetchAddress?.owner;
        if (!custodyAddress) {
            custodyAddress = "0x0"
            console.log('Custody address not found in response');
        }
        return custodyAddress;
    } catch (error) {
        console.error('Error with Local API:', error);
        throw error;
    }
    // Method 2: Using Neynar API
    /*
    const url = 'https://api.neynar.com/v1/farcaster/user';
    const apiKey = process.env.NEYNAR_API_KEY as string;
    try {
      const response = await fetch(`${url}?fid=${fid}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const userData = await response.json();
      const custodyAddress = userData?.result?.user?.custodyAddress;
  
      if (!custodyAddress) {
        throw new Error('Custody address not found in response');
      }
  
      return custodyAddress;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
    */
}