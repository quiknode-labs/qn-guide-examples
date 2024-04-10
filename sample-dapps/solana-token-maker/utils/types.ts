interface Pin {
    cid: string;
    name: string;
    origins: string[];
    meta: Record<string, string>;
}

interface SizeInfo {
    size: string;
}

interface UploadResponseData {
    requestid: string;
    status: string;
    created: string;
    pin: Pin;
    info: SizeInfo;
    delegates: string[];
}

export interface UploadResponse {
    response: UploadResponseData;
}


export interface MetadataFormInputs {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    amount: number;
}

export const initialFormData: MetadataFormInputs = {
    name: '',
    symbol: '',
    description: '',
    decimals: 0,
    amount: 0
};

export interface UploadState {
    file: File | null;
    errorMessage: string;
    isUploading: boolean;
}

export interface TokenMetadata extends MetadataFormInputs {
    image: string;
}

export type JsonMetadata = Omit<TokenMetadata, 'decimals' | 'amount'>;

export interface ImageUploadState extends UploadState {
    imagePreview: string | null;
    imgUrl: string | null;
}

export interface JsonUploadState extends UploadState {
    jsonUrl: string | null;
}

export type MintUploadState = ImageUploadState & JsonUploadState;

export interface MintRequestBody {
    authority: string;
    jsonMetadata: JsonMetadata;
    jsonUri: string;
    decimals: string;
    amount: string;
}