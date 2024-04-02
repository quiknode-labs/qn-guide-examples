export interface TokenBalance {
    name: string;
    address: string;
    totalBalance: string;
    decimals: string;
}

export interface IFrameProps {
    frame?: string;
    imageUrl: string;
    buttons?: string[];
    postUrl?: string;
    aspectRatio?: string;
    action?: string;
    target?: string;
}