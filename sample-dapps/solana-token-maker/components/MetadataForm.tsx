'use client'

import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { MetadataFormInputs } from '@/utils/types';


const inputFieldClasses = 'border-2 border-gray-300 focus:text-black focus:border-black z-[3] flex items-center justify-center rounded-md p-2 transition-all focus:font-semibold';
const labelClass = 'text-sm text-gray-500';

interface Props {
    setFormData: Dispatch<SetStateAction<MetadataFormInputs>>;
    formData: MetadataFormInputs
}

export default function MetadataForm({ setFormData, formData }: Props) {

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <form className="grid gap-6" >
            <div className="space-y-1 ">
                <h2 className="text-xl text-black font-semibold">
                    2. Enter Metadata
                </h2>
            </div>
            <div className="grid gap-1 h-full w-full">
                <label htmlFor="name" className={labelClass}>Token Name: </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="The Quickest Token"
                    className={`${inputFieldClasses} ${formData.name ? 'text-black' : 'text-gray-500'}`}
                    required
                />

                <label htmlFor="symbol" className={labelClass}>Symbol: </label>
                <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    placeholder="$TQT"
                    className={`${inputFieldClasses} ${formData.symbol ? 'text-black' : 'text-gray-500'}`}
                    required
                />

                <label htmlFor="description" className={labelClass}>Description (max 100 char): </label>
                <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Just a token that moves fast!"
                    className={`${inputFieldClasses} ${formData.description ? 'text-black' : 'text-gray-500'}`}
                    maxLength={100}
                    required
                />

                <label htmlFor="decimals" className={labelClass}>Number of Token Decimals: </label>
                <input
                    type="number"
                    name="decimals"
                    value={formData.decimals || ''}
                    onChange={handleChange}
                    placeholder="6"
                    className={`${inputFieldClasses} ${formData.decimals ? 'text-black' : 'text-gray-500'}`}
                    maxLength={2}
                    required
                />

                <label htmlFor="amount" className={labelClass}>Number of Tokens to Mint: </label>
                <input
                    type="number"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleChange}
                    placeholder="1000000"
                    className={`${inputFieldClasses} ${formData.amount ? 'text-black' : 'text-gray-500'}`}
                    maxLength={15}
                    required
                />
            </div>
        </form>
    );
}
