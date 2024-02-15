"use client"
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { DasApiAsset, DasApiAssetList } from '@/app/api/wallet/das/types';

export interface NftProps {
    walletAddress: string;
}

const NftRow = ({ walletAddress }: NftProps) => {
    const [tokens, setTokens] = useState<DasApiAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1); // Pagination state, starting from page 1
    const tokensPerPage = 100; // Number of tokens to display per page

    useEffect(() => {
        const fetchTokens = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3000/api/wallet/das?walletAddress=${walletAddress}&limit=${tokensPerPage}&page=${currentPage}`);
                if (!response.ok) throw new Error('Failed to fetch tokens');
                const data: JsonResponse = await response.json();
                setTokens(data.assets.items);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };

        if (walletAddress) fetchTokens();
    }, [walletAddress, currentPage, tokensPerPage]); // Include currentPage and tokensPerPage in the dependency array

    // Pagination handlers
    const nextPage = () => setCurrentPage((prev) => prev + 1);
    const prevPage = () => setCurrentPage((prev) => prev - 1);

    if (error) return <div>Error: {error}</div>;
    if (loading) return <div>Loading...</div>;
    if (!tokens.length) return <div>No tokens found</div>;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {tokens.map((token, index) => {
                    //@ts-ignore
                    const imageUri = token.content.links?.image; // Using optional chaining

                    if (!imageUri) {
                        return null; // Skip rendering this token if there's no image URI
                    }

                    return (
                        <div key={token.id as unknown as string} className="flex flex-col items-center">
                            <div className="w-full h-48 relative rounded-lg overflow-hidden"> {/* Adjust width and height as needed */}
                                <Image
                                    src={imageUri}
                                    alt={`Token ${index + 1 + (currentPage - 1) * tokensPerPage}`}
                                    fill // replaces layout="fill"
                                    className="rounded-lg"
                                    style={{ objectFit: 'cover' }} // replaces objectFit="cover"
                                    sizes="(max-width: 768px) 100vw, 50vw" // Include if you need to specify sizes
                                />

                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-4">
                <Button onClick={prevPage} disabled={currentPage === 1}>Previous</Button>
                <Button onClick={nextPage} disabled={tokens.length < tokensPerPage}>Next</Button>
            </div>
        </>
    );
};

export default NftRow;

interface JsonResponse {
    assets: DasApiAssetList;
}
