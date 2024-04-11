import React from 'react';
import Spinner from "@/components/Spinner"; // Adjust the import path as needed

interface Props {
    disableButton: boolean;
    isUploading: boolean;
    onClick: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const MintButton: React.FC<Props> = ({ disableButton, isUploading, onClick }) => {
    const buttonDisplay = disableButton ? "Fill out form" : isUploading ? <Spinner /> : "Mint Token!";
    const disabled = disableButton || isUploading;
    return (
        <form className="" onSubmit={onClick}>
            <button
                type="submit"
                disabled={disabled}
                className={`${disabled ? 'cursor-not-allowed border-gray-200 bg-gray-600 text-gray-400' : 'border-black bg-black text-white hover:bg-white hover:text-black'} flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
            >
                {buttonDisplay}
            </button>
        </form>
    );
};

export default MintButton;
