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


