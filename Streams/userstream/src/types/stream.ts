// Types matching actual Quicknode Streams output
export interface StreamPayload {
    events: StreamEvent[];
}

export interface StreamEvent {
    blockNumber: number;
    blockTimestamp: number;
    matchedAddress: string;
    direction: 'in' | 'out';
    eventType: 'erc20Transfer' | 'nativeTransfer';
    txHash: string;
    eventId: string;
    status: number;
    network: string;
    data: NativeTransferData | ERC20TransferData;
    logIndex?: number;
}

export interface NativeTransferData {
    amountWei: string;
    from: string;
    to: string;
}

export interface ERC20TransferData {
    amountRaw: string;
    from: string;
    to: string;
    tokenAddress: string;
}

// Type guard
export function isERC20Transfer(data: NativeTransferData | ERC20TransferData): data is ERC20TransferData {
    return 'tokenAddress' in data;
}
