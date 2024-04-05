"use client"
import MetadataForm from "@/components/MetadataForm";
import Uploader from "@/components/Uploader";
import Spinner from "@/components/Spinner";
import { GATEWAY_URL } from "@/utils/constants";
import { generateSolanaFmUrl } from "@/utils/solana";
import { buildCreateTokenTx } from "@/utils/spl";
import { MintUploadState, MetadataFormInputs, UploadResponse, initialFormData, JsonMetadata } from '@/utils/types';
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, Keypair } from "@solana/web3.js";
import { useState } from "react";

const Minter = () => {
    const [formData, setFormData] = useState<MetadataFormInputs>(initialFormData);
    const [uploadState, setUploadState] = useState<MintUploadState>({
        imagePreview: null,
        file: null,
        imgUrl: null,
        errorMessage: '',
        isUploading: false,
        jsonUrl: null,
    });
    const { file, isUploading } = uploadState;
    const { publicKey: authority, signTransaction } = useWallet();

    const handleMint = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploadState((prev) => ({ ...prev, isUploading: true }));
        if (!authority || !signTransaction) throw new Error('No wallet connected');
        // TODO validate decimals & amount  
        const mintKeypair = Keypair.generate();
        try {
            const imageIpfs = await uploadImage();
            const jsonMetadata = await generateJson(imageIpfs);
            const jsonIpfs = await uploadJson(jsonMetadata);
            const connection = new Connection('http://127.0.0.1:8899');
            const buildCreateTokenArgs = {
                connection,
                authority,
                jsonMetadata,
                jsonUri: jsonIpfs,
                decimals: formData.decimals, 
                mintKeypair,
                amount: formData.amount,
            };
            const { mintTransaction } = await buildCreateTokenTx(buildCreateTokenArgs);
            const { value: { blockhash, lastValidBlockHeight }, context: { slot: minContextSlot } } = await connection.getLatestBlockhashAndContext('confirmed');
            mintTransaction.recentBlockhash = blockhash;
            mintTransaction.lastValidBlockHeight = lastValidBlockHeight;
            mintTransaction.minNonceContextSlot = minContextSlot;
            mintTransaction.lastValidBlockHeight = lastValidBlockHeight;
            mintTransaction.feePayer = authority;
            mintTransaction.partialSign(mintKeypair);
            const txSigned = await signTransaction(mintTransaction);
            const signature = await connection.sendRawTransaction(txSigned.serialize(), {
                skipPreflight: true,
                preflightCommitment: 'confirmed',
                maxRetries: 0,
                minContextSlot,
            });
            const confirmation = await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature,
                minContextSlot
            }, "processed");
            if (confirmation.value.err) {
                throw new Error('Transaction failed');
            }
            console.log('Transaction confirmed!!', generateSolanaFmUrl(undefined, signature));

        } catch (error) {
            console.log(error);
        } finally {
            setUploadState((prev) => ({ ...prev, isUploading: false }));
        }
    };

    const generateJson = async (imageUrl: string): Promise<JsonMetadata> => {
        if (!imageUrl) throw new Error('No image to generate json');
        if (!formData.name || !formData.symbol || !formData.description) throw new Error('Missing metadata fields');
        return {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            image: imageUrl,
        };
    }

    const uploadImage = async () => {
        if (!file) throw new Error('No file to upload');
        const API_ENDPOINT = '/api/upload/image';

        const formData = new FormData();
        formData.append("Body", file);
        formData.append("Key", file.name);
        formData.append("ContentType", file.type);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                const data: UploadResponse = await response.json();
                const imgUrl = GATEWAY_URL + data.response.pin.cid;
                setUploadState((prev) => ({ ...prev, imgUrl }));
                return imgUrl;
            } else {
                const errorText = await response.text();
                console.error('Upload error:', errorText);
                setUploadState((prev) => ({ ...prev, errorMessage: 'Failed to upload image' }));
                throw new Error('Failed to upload image');
            }
        } catch (error) {
            setUploadState((prev) => ({
                ...prev,
                errorMessage: 'Failed to upload image',
                isUploading: false,
            }));
            throw new Error('Failed to upload image');
        }
    }

    const uploadJson = async (json: JsonMetadata) => {
        const API_ENDPOINT = '/api/upload/json';
        try {
            const jsonBlob = new Blob([JSON.stringify(json)], { type: "application/json" });

            const formData = new FormData();
            formData.append("Body", jsonBlob);
            formData.append("Key", "metadata.json");
            formData.append("ContentType", "application/json");

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body: formData,
            });
            if (response.ok) {
                const data: UploadResponse = await response.json();
                const jsonUrl = GATEWAY_URL + data.response.pin.cid;
                setUploadState((prev) => ({ ...prev, jsonUrl }));
                return jsonUrl;
            } else {
                setUploadState((prev) => ({ ...prev, errorMessage: 'Failed to upload JSON' }));
                throw new Error('Failed to upload JSON');
            }
        } catch (error) {
            setUploadState((prev) => ({
                ...prev,
                errorMessage: 'Failed to upload JSON',
            }));
            throw new Error('Failed to upload JSON');
        }
    }

    return (
        <div className="bg-white/3 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full space-y-12">
            <Uploader
                uploadState={uploadState}
                setUploadState={setUploadState}
            />
            <MetadataForm
                formData={formData}
                setFormData={setFormData}
            />
            <form className="" onSubmit={handleMint}>
                <button
                    type="submit"
                    disabled={isUploading}
                    className={`${isUploading ? 'sor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : 'border-black bg-black text-white hover:bg-white hover:text-black'} flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
                >
                    {isUploading ? 'Minting in progress...' : <Spinner />}
                </button>
            </form>
        </div>
    )
};

export default Minter;