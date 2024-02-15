"use client"
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow, TableBody, Table, TableHeader, TableHead } from "@/components/ui/table";
import { Token, TokensResponse } from './types';
import { Button } from "@/components/ui/button";
import TableSkeleton from '../helpers/TableSkeleton';

export interface TokenProps {
    walletAddress: string;
}

const TokenTable = ({ walletAddress }: TokenProps) => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0); // Pagination state
    const tokensPerPage = 5; // Number of tokens to display per page

    useEffect(() => {
        const fetchTokens = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/wallet/tokens?walletAddress=${walletAddress}`);
                if (!response.ok) throw new Error('Failed to fetch tokens');
                const data: TokensResponse = await response.json();
                setTokens(data.tokens);
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
    if (!loading && !tokens.length) return <div>No tokens found</div>;
    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Mint</TableHead>
                        <TableHead>QTY</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {loading ? <TableSkeleton numRows={tokensPerPage} /> :
                        tokensToShow.map((token, index) => (
                            <TableRow className="divide-x" key={token.pubkey}>
                                <TableCell className="font-medium">{index + 1 + currentPage * tokensPerPage}</TableCell>
                                <TableCell >{token.account.data.parsed.info.mint}</TableCell>
                                <TableCell>{token.account.data.parsed.info.tokenAmount.uiAmount}</TableCell>
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

export default TokenTable;
