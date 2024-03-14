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

interface WalletResponse {
    owner: string;
    ensName: string | null;
    assets: NFT[];
    nativeTokenBalance: string;
    totalItems: number;
    totalPages: number;
    pageNumber: number;
}

interface NFTProps {
    walletAddress: string;
}

const NFTsTable = ({ walletAddress }: NFTProps) => {
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0); // Pagination state
    const nftsPerPage = 5; // Number of NFTs to display per page

    useEffect(() => {
        const fetchNFTs = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/wallet/nfts?walletAddress=${walletAddress}`);
                if (!response.ok) throw new Error('Failed to fetch NFTs');
                const jsonResponse = await response.json();
                const result = jsonResponse.nfts.assets;
                setNfts(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) fetchNFTs();
    }, [walletAddress]);

    // Calculate the NFTs to display on the current page
    const nftsToShow = nfts.slice(currentPage * nftsPerPage, (currentPage + 1) * nftsPerPage);

    // Pagination handlers
    const nextPage = () => setCurrentPage((prev) => prev + 1);
    const prevPage = () => setCurrentPage((prev) => prev - 1);

    if (error) return <div>Error: {error}</div>;
    if (!loading && !nfts.length) return <div>No NFTs found</div>;

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Collection Name</TableHead>
                        <TableHead>Token ID</TableHead>
                        <TableHead>Image</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {loading ? <TableSkeleton numRows={nftsPerPage} /> :
                        nftsToShow.map((nft, index) => (
                            <TableRow className="divide-x" key={nft.collectionAddress + nft.collectionTokenId}>
                                <TableCell>{nft.collectionName}</TableCell>
                                <TableCell>{nft.collectionTokenId}</TableCell>
                                <TableCell>
                                    {nft.imageUrl ? (
                                        <img src={nft.imageUrl} alt={nft.name} style={{ width: '50px', height: '50px' }} />
                                    ) : (
                                        "No Image Found" // Display this text when imageUrl is empty
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
            <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={prevPage} disabled={currentPage === 0}>Previous</Button>
                <Button variant="outline" onClick={nextPage} disabled={(currentPage + 1) * nftsPerPage >= nfts.length}>Next</Button>
            </div>
        </>
    );
};

export { NFTsTable, type NFTProps };
