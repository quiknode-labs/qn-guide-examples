"use client"
import MetadataForm from "@/components/MetadataForm";
import Uploader from "@/components/Uploader";
import { GATEWAY_URL } from "@/utils/constants";
import { MintUploadState, MetadataFormInputs, UploadResponse, initialFormData, TokenMetadata } from '@/utils/types';
import { useEffect, useState } from "react";

const Minter = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadState, setUploadState] = useState<MintUploadState>({
        imagePreview: null,
        file: null,
        imgUrl: null,
        errorMessage: '',
        isUploading: false,
        jsonUrl: null,
    });



    const { imagePreview, file, imgUrl, errorMessage, isUploading } = uploadState;

    const [formData, setFormData] = useState<MetadataFormInputs>(initialFormData);

    useEffect(() => {
        console.log(formData);
        console.log(uploadState);
    }, [formData, uploadState]);

    const handleMint = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const imageIpfs = await uploadImage();
            const json = await generateJson(imageIpfs);
            await uploadJson(json);
            // await mintToken();

        } catch (error) {
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateJson = async (imageUrl: string): Promise<TokenMetadata> => {
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
        setUploadState((prev) => ({ ...prev, isUploading: true }));

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
            console.log(error);
            setUploadState((prev) => ({
                ...prev,
                errorMessage: 'Failed to upload image',
                isUploading: false,
            }));
            throw new Error('Failed to upload image');
        } finally {
            setUploadState((prev) => ({ ...prev, isUploading: false }));
        }
    }

    const uploadJson = async (json: TokenMetadata) => {
        const API_ENDPOINT = '/api/upload/json';
        setUploadState((prev) => ({ ...prev, isUploading: true }));
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
                console.log("THE JSON URL:", jsonUrl)
            } else {
                const errorText = await response.text();
                console.error('Upload error:', errorText);
                setUploadState((prev) => ({ ...prev, errorMessage: 'Failed to upload JSON' }));
            }
        } catch (error) {
            console.log(error);
            setUploadState((prev) => ({
                ...prev,
                errorMessage: 'Failed to upload JSON',
            }));
        } finally {
            setUploadState((prev) => ({ ...prev, isUploading: false }));
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
                    disabled={isSubmitting}
                    className={`${isSubmitting ? 'sor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : 'border-black bg-black text-white hover:bg-white hover:text-black'} flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    )
};

export default Minter;