'use client'

import { useState, ChangeEvent, FormEvent } from 'react';

interface FormData {
    name: string;
    symbol: string;
    description: string;
}

const initialFormData: FormData = {
    name: '',
    symbol: '',
    description: '',
};

const inputFieldClasses = 'text-gray-500 border-2 border-gray-300 focus:text-black focus:border-black z-[3] flex items-center justify-center rounded-md p-2 transition-all focus:font-semibold';

export default function MetadataForm() {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        console.log('Form Data:', formData);

        setIsSubmitting(false);
    };

    return (
        <form className="grid gap-6" onSubmit={handleSubmit}>
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
            <button
                type="submit"
                disabled={isSubmitting}
                className={`${isSubmitting ? 'sor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : 'border-black bg-black text-white hover:bg-white hover:text-black'} flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
            >
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
        </form>
    );
}
