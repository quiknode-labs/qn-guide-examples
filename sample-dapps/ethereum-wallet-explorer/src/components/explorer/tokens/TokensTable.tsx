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

interface TokenProps {
    walletAddress: string;
}

const TokensTable = ({ walletAddress }: TokenProps) => {
    const [tokens, setTokens] = useState<ERC20Token[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTokens, setTotalTokens] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTokens = async (page: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/wallet/tokens?walletAddress=${walletAddress}&page=${page}`);
            if (!response.ok) throw new Error('Failed to fetch token balances');
            const jsonResponse = await response.json();
            setTotalTokens(jsonResponse.tokens.totalItems)
            setTokens(jsonResponse.tokens.result);
            setTotalPages(jsonResponse.tokens.totalPages);
            setCurrentPage(jsonResponse.tokens.pageNumber);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (walletAddress) fetchTokens(currentPage);
    }, [walletAddress, currentPage]);

    const nextPage = () => {
        if (currentPage < totalPages) {
            fetchTokens(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            fetchTokens(currentPage - 1);
        }
    };

    if (error) return <div>Error: {error}</div>;
    if (!loading && !tokens.length) return <div>No token balances found</div>;

    return (
        <>
            <Table>
                <TableHeader>
                    Unique count of Tokens in Wallet: <strong>{totalTokens}</strong>
                    <br/>
                    <br/>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Total Balance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {loading ? <TableSkeleton numRows={5} /> : // Assuming 5 rows for skeleton loader
                        tokens.map((token, index) => (
                            <TableRow className="divide-x" key={token.address}>
                                <TableCell className="font-medium">{token.name}</TableCell>
                                <TableCell>{token.symbol}</TableCell>
                                <TableCell>{(parseInt(token.totalBalance) / Math.pow(10, parseInt(token.decimals))).toString()}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
            <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={prevPage} disabled={currentPage <= 1}>Previous</Button>
                <Button variant="outline" onClick={nextPage} disabled={currentPage >= totalPages}>Next</Button>
            </div>
        </>
    );
};

export { TokensTable, type TokenProps };
