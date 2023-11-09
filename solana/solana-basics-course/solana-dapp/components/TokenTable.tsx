import { shortenHash } from "@/utils/utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface TokenRow {
    mint: string;
    tokenAccountAddress: string;
    tokenAmount: number;
}

const TokenTable = () => {
    const [rows, setRows] = useState<TokenRow[]>([]); // [
    const { publicKey } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!publicKey) return;
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })
            .then(({ value }) => {
                const tokens: TokenRow[] = value
                .filter((account)=> {return (account.account.data.parsed.info.tokenAmount.uiAmount > 999 && account.account.data.parsed.info.tokenAmount.uiAmount < 2000)})    
                .map((account) => {

                    return {
                        mint: account.account.data.parsed.info.mint,
                        tokenAccountAddress: account.pubkey.toBase58(),
                        tokenAmount: account.account.data.parsed.info.tokenAmount.uiAmount,
                    }
                })
                setRows(tokens);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [publicKey, connection]);

    return (
        <div className="overflow-x-auto mt-4 text-center">
            <table className="min-w-full text-white table-auto">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="px-4 py-2">Mint</th>
                        <th className="px-4 py-2">Token Account<br/>Address</th>
                        <th className="px-4 py-2">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className={`bg-gray-800 border-b border-gray-700 ${index % 2 === 0 ? 'bg-opacity-50' : ''}`}>
                            <td className="px-4 py-2">{shortenHash(row.mint)}</td>
                            <td className="px-4 py-2">{shortenHash(row.tokenAccountAddress)}</td>
                            <td className="px-4 py-2">{row.tokenAmount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {rows.length === 0 && (
                <div className="text-gray-500 mt-4">No tokens found.</div>
            )}
        </div>
    );
    
}

export default TokenTable;