'use client'

import { useState, ChangeEvent, FormEvent, Dispatch, SetStateAction } from 'react';
import { MetadataFormInputs, initialFormData } from '@/utils/types';


const inputFieldClasses = 'text-gray-500 border-2 border-gray-300 focus:text-black focus:border-black z-[3] flex items-center justify-center rounded-md p-2 transition-all focus:font-semibold';

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
                <label htmlFor="name" className="text-sm text-gray-500 ">Token Name: </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="The Quickest Token"
                    className={inputFieldClasses}
                    required
                />

                <label htmlFor="name" className="text-sm text-gray-500 ">Symbol: </label>
                <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    placeholder="$TQT"
                    className={inputFieldClasses}
                    required
                />

                <label htmlFor="name" className="text-sm text-gray-500 ">Description (max 100 char): </label>
                <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Just a token that moves fast!"
                    className={inputFieldClasses}
                    maxLength={100}
                    required
                />
            </div>
        </form>
    );
}
