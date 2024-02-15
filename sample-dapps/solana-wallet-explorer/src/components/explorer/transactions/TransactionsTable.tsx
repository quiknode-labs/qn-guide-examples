"use client"
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow, TableBody, Table, TableHeader, TableHead } from "@/components/ui/table";
import { TransactionsResponse } from './types';
import { ConfirmedSignatureInfo } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import TableSkeleton from '../helpers/TableSkeleton';

interface TransactionProps {
    walletAddress: string;
}

const TransactionsTable = ({ walletAddress }: TransactionProps) => {
    const [transactions, setTransactions] = useState<ConfirmedSignatureInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0); // Pagination state
    const transactionsPerPage = 5; // Number of tokens to display per page

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/wallet/tx?walletAddress=${walletAddress}`);
                if (!response.ok) throw new Error('Failed to fetch transactions');
                const data: TransactionsResponse = await response.json();
                setTransactions(data.txIds);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) fetchTransactions();
    }, [walletAddress]);
    // Calculate the tokens to display on the current page
    const transactionsToShow = transactions.slice(currentPage * transactionsPerPage, (currentPage + 1) * transactionsPerPage);

    // Pagination handlers
    const nextPage = () => setCurrentPage((prev) => prev + 1);
    const prevPage = () => setCurrentPage((prev) => prev - 1);

    if (error) return <div>Error: {error}</div>;
    if (!loading && !transactions.length) return <div>No transaction history found</div>;

    return (<>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Slot</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
                {loading ? <TableSkeleton numRows={transactionsPerPage} /> :
                    transactionsToShow.map((transaction, index) => (
                        <TableRow className="divide-x" key={transaction.signature}>
                            <TableCell className="font-medium">{index + 1 + currentPage * transactionsPerPage}</TableCell>
                            <TableCell>{transaction.signature}</TableCell>
                            <TableCell>{transaction.confirmationStatus}</TableCell>
                            <TableCell>{transaction.blockTime ? new Date(transaction.blockTime * 1000).toLocaleString() : ''}</TableCell>
                            <TableCell>{transaction.slot}</TableCell>
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
        <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={prevPage} disabled={currentPage === 0}>Previous</Button>
            <Button variant="outline" onClick={nextPage} disabled={(currentPage + 1) * transactionsPerPage >= transactions.length}>Next</Button>
        </div>
    </>
    );
};

export { TransactionsTable, type TransactionProps };
