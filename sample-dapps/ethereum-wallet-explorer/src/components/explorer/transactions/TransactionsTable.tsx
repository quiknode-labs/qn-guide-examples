"use client"
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow, TableBody, Table, TableHeader, TableHead } from "../../ui/table";
import { Button } from '../../ui/button';
import TableSkeleton from '../helpers/TableSkeleton';

interface Transaction {
    transactionHash: string;
    blockNumber: string;
    from: string;
    to: string;
    value: string;
    internal: string;
}

interface TransactionProps {
    walletAddress: string;
}

const TransactionsTable = ({ walletAddress }: TransactionProps) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const transactionsPerPage = 7;


    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/wallet/transactions?walletAddress=${walletAddress}`);
                if (!response.ok) throw new Error('Failed to fetch transaction history');
                const { transactions } = await response.json();
                setTransactions(transactions);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) fetchTransactions();
    }, [walletAddress]);

    const transactionsToShow = transactions.slice(currentPage * transactionsPerPage, (currentPage + 1) * transactionsPerPage);

    const nextPage = () => setCurrentPage((prev) => prev + 1);
    const prevPage = () => setCurrentPage((prev) => prev - 1);

    if (error) return <div>Error: {error}</div>;
    if (!loading && !transactions.length) return <div>No transactions found</div>;

    return (
        <>
            <Table>
                <TableHeader>
                    <br/>
                    <br/>
                    <TableRow>
                        <TableHead>Transaction Hash</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Internal Txn</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {loading ? <TableSkeleton numRows={transactionsPerPage} /> : 
                        transactionsToShow.map((transaction, index) => (
                            <TableRow className="divide-x" key={index}>
                                <TableCell>{transaction.transactionHash}</TableCell>
                                <TableCell>{transaction.blockNumber}</TableCell>
                                <TableCell>{transaction.from}</TableCell>
                                <TableCell>{transaction.to}</TableCell>
                                <TableCell>{transaction.value} ETH</TableCell>
                                <TableHead>{transaction.internal}</TableHead>
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
