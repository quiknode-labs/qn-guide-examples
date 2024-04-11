"use client"
import MetadataForm from "@/components/MetadataForm";
import Uploader from "@/components/Uploader";
import { GATEWAY_URL, MINIMUM_BALANCE } from "@/utils/constants";
import { getExplorerUrl } from "@/utils/solana";
import { MintUploadState, MetadataFormInputs, UploadResponse, initialFormData, JsonMetadata, MintRequestBody } from '@/utils/types';
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { toast } from 'sonner';
import MintButton from "@/components/MintButton";

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
    const [balance, setBalance] = useState<number>(0);
    const { file, isUploading } = uploadState;
    const { publicKey: authority, signTransaction } = useWallet();

    useEffect(() => {
        if (!authority) return;
        const fetchBalance = async () => {
            const API_ENDPOINT = '/api/solana/balance';
            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ address: authority.toBase58() }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setBalance(data.balance);
                    console.log('Balance:', data.balance);
                } else {
                    console.error('Failed to fetch balance:', response);
                }
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };
        fetchBalance();
    }, [authority]);

    const handleMint = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!authority || !signTransaction) {
            toast.error('No wallet connected');
            throw new Error('No wallet connected')
        };
        if (balance < MINIMUM_BALANCE) {
            toast.error(<div>
                <span className="font-bold">Insufficient Balance!</span><br/>
                <a href={'https://faucet.quicknode.com/solana/devnet'} target='_blank' rel='noreferrer'>
                    (Go To Faucet ↗️)
                </a>
            </div>);
            throw new Error('Insufficient balance');
        }
        setUploadState((prev) => ({ ...prev, isUploading: true }));
        try {
            validateInputs();
            const imageIpfs = await uploadImage();
            const jsonMetadata = await generateJson(imageIpfs);
            const jsonIpfs = await uploadJson(jsonMetadata);
            const txPartialSerialized = await generateTransaction({
                authority: authority.toBase58(),
                jsonMetadata,
                jsonUri: jsonIpfs,
                decimals: formData.decimals.toString(),
                amount: formData.amount.toString(),
            });
            const txPartial = Transaction.from(Buffer.from(txPartialSerialized, 'base64'))
            const txSigned = await signTransaction(txPartial);
            const txFullSerialized = txSigned.serialize({ requireAllSignatures: true });
            const txFullBase64 = txFullSerialized.toString('base64');
            const signature = await sendAndConfirm(txFullBase64);

            const explorerUrl = getExplorerUrl(signature);
            toast.success(<div>
                Success!&nbsp;
                <a href={explorerUrl} target='_blank' rel='noreferrer'>
                    (View Transaction ↗️)
                </a>
            </div>);
            return;

        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('An unexpected error occurred');
            }
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

    const generateTransaction = async (args: MintRequestBody) => {
        if (!file) throw new Error('No file to upload');
        const API_ENDPOINT = '/api/solana/createMintTx';

        const body = JSON.stringify(args);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                body,
            });
            if (response.ok) {
                const data = await response.json();
                return data.transaction;
            } else {
                console.error('Upload error:', response);
                setUploadState((prev) => ({ ...prev, errorMessage: 'Failed to generate transaction' }));
                throw new Error('Failed to generate transaction');
            }
        } catch (error) {
            setUploadState((prev) => ({
                ...prev,
                errorMessage: 'Failed to generate transaction',
                isUploading: false,
            }));
            throw new Error('Failed to generate transaction');
        }
    }

    const sendAndConfirm = async (serializedTx: string) => {
        if (!serializedTx) throw new Error('No transaction to send');
        const API_ENDPOINT = '/api/solana/sendAndConfirm';

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ serializedTx }),
            });
            if (response.ok) {
                const data = await response.json();
                return data.signature;
            } else {
                setUploadState((prev) => ({ ...prev, errorMessage: 'Failed to send and confirm Tx' }));
                throw new Error('Failed to send and confirm Tx');
            }
        } catch (error) {
            setUploadState((prev) => ({
                ...prev,
                errorMessage: 'Failed to send and confirm Tx',
                isUploading: false,
            }));
            throw new Error('Failed to send and confirm Tx');
        }
    }


    const validateInputs = () => {
        if (!file) throw new Error('No file to upload');
        if (!formData.name || !formData.symbol || !formData.description || !formData.decimals || !formData.amount) {
            throw new Error('Missing metadata fields');
        }

        const decimals = Number(formData.decimals);
        const amount = Number(formData.amount);

        if (isNaN(decimals) || !Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
            throw new Error('Decimals must be a positive integer between 0 and 18');
        }
        if (isNaN(amount) || !Number.isInteger(amount) || amount < 0) {
            throw new Error('Amount must be a positive integer');
        }
    }

    const disableButton = !file || !formData.name || !formData.symbol || !formData.description || !formData.decimals || !formData.amount || !authority;

    return (
        <Container>
            <Uploader
                uploadState={uploadState}
                setUploadState={setUploadState}
            />
            <MetadataForm
                formData={formData}
                setFormData={setFormData}
            />
            <MintButton
                onClick={handleMint}
                isUploading={isUploading}
                disableButton={disableButton}
            />
        </Container>
    )
};

export default Minter;




const Container = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="bg-white/3 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full space-y-12">
            {children}
        </div>
    );
};
