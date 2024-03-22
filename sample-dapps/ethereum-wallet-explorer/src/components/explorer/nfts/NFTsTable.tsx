// NFTsTable.tsx
"use client"
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow, TableBody, Table, TableHeader, TableHead } from "../../ui/table";
import { Button } from '../../ui/button';
import TableSkeleton from '../helpers/TableSkeleton';
import { json } from 'stream/consumers';

interface NFT {
    collectionName: string;
    collectionTokenId: string;
    collectionAddress: string;
    name: string;
    description: string;
    imageUrl: string;
    chain: string;
    network: string;
}

interface NFTProps {
    walletAddress: string;
}

const NFTsTable = ({ walletAddress }: NFTProps) => {
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTokens, setTotalTokens] = useState(0);

    useEffect(() => {
        const fetchNFTs = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/wallet/nfts?walletAddress=${walletAddress}&page=${currentPage}`);
                if (!response.ok) throw new Error('Failed to fetch NFTs');
                const jsonResponse = await response.json();
                setNfts(jsonResponse.nfts.assets);
                setTotalPages(jsonResponse.nfts.totalPages);
                setTotalTokens(jsonResponse.nfts.totalItems)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) fetchNFTs();
    }, [walletAddress, currentPage]);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    if (error) return <div>Error: {error}</div>;
    if (!loading && !nfts.length) return <div>No NFTs found</div>;

    return (
        <>
            <Table>
                <TableHeader>
                    Unique count of NFTs in Wallet: <strong>{totalTokens}</strong>
                    <br/>
                    <br/>
                    <TableRow>
                        <TableHead>Collection Name</TableHead>
                        <TableHead>Token ID</TableHead>
                        <TableHead>Image</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {loading ? <TableSkeleton numRows={7} /> :
                        nfts.map((nft, index) => (
                            <TableRow className="divide-x" key={nft.collectionAddress + nft.collectionTokenId}>
                                <TableCell>{nft.collectionName}</TableCell>
                                <TableCell>{nft.collectionTokenId}</TableCell>
                                <TableCell>
                                    {nft.imageUrl ? (
                                        <img src={nft.imageUrl} alt={nft.name} style={{ width: '100px', height: '100px' }} />
                                    ) : (
                                        "No Image Found"
                                    )}
                                </TableCell>
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

export { NFTsTable, type NFTProps };
