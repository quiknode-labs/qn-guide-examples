"use client"
import React, { FormEventHandler, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { Input } from "../ui/input";
import { ethers } from 'ethers';


const Search = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const handleSearch: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setError(null);

        const searchValue = (event.currentTarget.elements.namedItem('search') as HTMLInputElement).value;

        try {
            const walletAddress = await validateAddress(searchValue);
            router.push(`/wallet/${walletAddress}`);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        }
    };

    return (
        <>
            <form className="flex-1 flex justify-center" onSubmit={handleSearch}>
                <Input
                    name="search"
                    className="w-[400px] sm:w-[300px] lg:w-[400px]"
                    placeholder="Wallet address or ENS..."
                    type="search"
                />
            </form>
            {error && <p className="text-red-500">{error}</p>} {/* Display error message if any */}
        </>
    );
};

export default Search;

async function validateAddress(walletAddress: string): Promise<string> {
    if (!walletAddress) {
        throw new Error('Wallet address is required.');
    }
    try {
        const response = await fetch(`/api/resolve?walletAddress=${encodeURIComponent(walletAddress)}`);
        if (!response.ok) {
            throw new Error('Failed to resolve address');
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data.address;
    } catch (error) {
        throw new Error('Invalid wallet address.');
    }
}