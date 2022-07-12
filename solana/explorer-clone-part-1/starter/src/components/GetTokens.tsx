import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useState } from 'react';
import { notify } from "../utils/notifications";
//Add import dependencies here
import { GetProgramAccountsFilter } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const GetTokens: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    //State Variables here
    const [tokenTable, setTokenTable] = useState(null);

    //dApp Scripts here
    async function getTokenAccounts(wallet: string) {
        const filters:GetProgramAccountsFilter[] = [
            {
              dataSize: 165, // number of bytes
            },
            {
              memcmp: {
                offset: 32, // number of bytes
                bytes: wallet, // base58 encoded string
              },            
            }];
        const accounts = await connection.getParsedProgramAccounts(
            TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
            {
              filters: filters,
            }
          );
        console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}: `);
        if(accounts.length === 0) {
            return(<div>No Token Accounts Found</div>)
        }
        else{
            const rows = accounts.map((account,i)=>{
                //Parse the account data
                const parsedAccountInfo:any = account.account.data;
                const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
                const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
                return (
                <tr key={i+1}>
                    <td key={'index'}>{i+1}</td>
                    <td key={'mint address'}>{mintAddress}</td>
                    <td key={'balance'}>{tokenBalance}</td>
                </tr>)
            })
            const header = (<tr>
                <th>Token No.</th>
                <th>Mint Address</th>
                <th>Qty</th>
            </tr>)
            setTokenTable(<table>{header}{rows}</table>)
        }

    }

    const onClick = async () => {
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }
        try { 
            await getTokenAccounts(publicKey.toString());

        } catch (error: any) {
            notify({ type: 'error', message: `Couldn't Find Token Accounts!`, description: error?.message });
            console.log('error', `Error finding Token Accounts! ${error?.message}`);
        }
    };

    return(<div>
        <div className="text-center">
        <button
                className="px-8 m-2 btn animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500"
                onClick={onClick}
            >
                <span>Get Token Accounts</span>
        </button>
        </div>
    {/* Render Results Here */}
        <div>{tokenTable}</div>
    </div>)
}