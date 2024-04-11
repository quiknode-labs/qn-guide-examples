'use client'

import { MintUploadState } from '@/utils/types';
import { useState, useCallback, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';

const acceptedFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

interface Props {
    setUploadState: Dispatch<SetStateAction<MintUploadState>>;
    uploadState: MintUploadState
}

export default function Uploader({ setUploadState, uploadState }: Props) {
    const [dragActive, setDragActive] = useState(false);

    const { imagePreview, file, errorMessage } = uploadState;

    useEffect(() => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            setUploadState((prev) => ({ ...prev, imagePreview: result ? String(result) : null }));
        };
        reader.readAsDataURL(file);
        return () => reader.abort();
    }, [file]);

    const handleFile = (selectedFile: File) => {
        if (selectedFile.size / 1024 / 1024 > 10) {
            setUploadState((prev) => ({ ...prev, errorMessage: 'File size too big (max 50MB)' }));
            return;
        }
        if (!acceptedFileTypes.includes(selectedFile.type)) {
            setUploadState((prev) => ({ ...prev, errorMessage: 'File type not supported' }));
            return;
        }
        setUploadState((prev) => ({ ...prev, file: selectedFile, errorMessage: '' }));
    };

    const onDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)

            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (!file) return;
            handleFile(file);
        }, [handleFile]);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>, isActive: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(isActive);
    }, [setDragActive]);

    const onChangePicture = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.currentTarget.files && event.currentTarget.files[0];
            if (!file) return;
            handleFile(file);
        },
        [handleFile]
    )

    return (
        <form
            className="grid gap-6"
        >
            <div>
                <div className="space-y-1 mb-4">
                    <h2 className="text-xl text-black font-semibold">1. Upload a file</h2>

                    <p className="text-sm text-gray-500">
                        Accepted formats: .png, .jpg, .gif
                    </p>
                </div>
                <label
                    htmlFor="image-upload"
                    className="group relative mt-2 flex h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
                >
                    <div
                        className="absolute z-[5] h-full w-full rounded-md"
                        onDragOver={(e) => handleDrag(e, true)}
                        onDragEnter={(e) => handleDrag(e, true)}
                        onDragLeave={(e) => handleDrag(e, false)}
                        onDrop={onDrop}
                    />
                    <div
                        className={`${dragActive ? 'border-2 border-black' : ''
                            } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md px-10 transition-all ${imagePreview
                                ? 'bg-white/80 opacity-0 hover:opacity-100 hover:backdrop-blur-md'
                                : 'bg-white opacity-100 hover:bg-gray-50'
                            }`}
                    >
                        <svg
                            className={`${dragActive ? 'scale-110' : 'scale-100'
                                } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                            <path d="M12 12v9"></path>
                            <path d="m16 16-4-4-4 4"></path>
                        </svg>
                        <p className="mt-2 text-center text-sm text-gray-500">
                            Drag and drop or click to upload.
                        </p>
                        <p className="mt-2 text-center text-sm text-gray-500">
                            Max file size: 10MB
                        </p>
                        {errorMessage && (
                            <p className="mt-2 text-center text-smtext-red-500">
                                {errorMessage}
                            </p>
                        )}
                        <span className="sr-only">Photo upload</span>
                    </div>
                    {imagePreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-full w-full rounded-md object-cover"
                        />
                    )}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={onChangePicture}
                    />
                </div>
            </div>
        </form>
    )
}