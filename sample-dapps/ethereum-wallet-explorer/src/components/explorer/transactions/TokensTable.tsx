"use client"
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow, TableBody, Table, TableHeader, TableHead } from "../../ui/table";
import { Button } from '../../ui/button';
import TableSkeleton from '../helpers/TableSkeleton';

interface ERC20Token {
    name: string;
    symbol: string;
    decimals: string;
    address: string;
    quantityIn: string;
    quantityOut: string;
    totalBalance: string;
}

interface WalletResponse {
    address: string;
    ensName: string;
    result: ERC20Token[];
    nativeTokenBalance: string;
    totalItems: number;
    totalPages: number;
    pageNumber: number;
}

interface TokenProps {
    walletAddress: string;
}


const TokensTable = ({ walletAddress }: TokenProps) => {
    const [tokens, setTokens] = useState<ERC20Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0); // Pagination state
    const tokensPerPage = 5; // Number of tokens to display per page

    useEffect(() => {
        const fetchTokens = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/wallet/tokens?walletAddress=${walletAddress}`);
                if (!response.ok) throw new Error('Failed to fetch token balances');
                const jsonResponse = await response.json();
                const result = await jsonResponse.tokens.result
                setTokens(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };
    
        if (walletAddress) fetchTokens();
    }, [walletAddress]);

    // Calculate the tokens to display on the current page
    const tokensToShow = tokens.slice(currentPage * tokensPerPage, (currentPage + 1) * tokensPerPage);

    // Pagination handlers
    const nextPage = () => setCurrentPage((prev) => prev + 1);
    const prevPage = () => setCurrentPage((prev) => prev - 1);

    if (error) return <div>Error: {error}</div>;
    if (!loading && !tokens.length) return <div>No token balances found</div>;

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Total Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {loading ? <TableSkeleton numRows={tokensPerPage} /> :
                        tokensToShow.map((token, index) => (
                            <TableRow className="divide-x" key={token.address}>
                                <TableCell className="font-medium">{token.name}</TableCell>
                                <TableCell>{token.symbol}</TableCell>
<TableCell>{(parseInt(token.totalBalance) / Math.pow(10, parseInt(token.decimals || "0"))).toString()}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
            <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={prevPage} disabled={currentPage === 0}>Previous</Button>
                <Button variant="outline" onClick={nextPage} disabled={(currentPage + 1) * tokensPerPage >= tokens.length}>Next</Button>
            </div>
        </>
    );
};

export { TokensTable, type TokenProps };