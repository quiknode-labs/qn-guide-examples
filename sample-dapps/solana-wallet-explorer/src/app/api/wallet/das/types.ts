import { PublicKey } from "@solana/web3.js";



/**
 * Representation of an asset.
 */
export declare type DasApiAsset = {
    /**
     * The asset interface.
     */
    interface: DasApiAssetInterface;
    /**
     * The asset Id.
     */
    id: PublicKey;
    /**
     * The asset content.
     */
    content: DasApiAssetContent;
    /**
     * List of authorities.
     */
    authorities: Array<DasApiAssetAuthority>;
    /**
     * Compression information.
     */
    compression: DasApiAssetCompression;
    /**
     * Grouping information.
     */
    grouping: Array<DasApiAssetGrouping>;
    /**
     * Royalty information.
     */
    royalty: DasApiAssetRoyalty;
    /**
     * List of creators.
     */
    creators: Array<DasApiAssetCreator>;
    /**
     * Ownership information.
     */
    ownership: DasApiAssetOwnership;
    /**
     * Uses information.
     */
    uses?: DasApiUses;
    /**
     * Supply information.
     */
    supply: DasApiAssetSupply;
    /**
     * Indicates whether the asset's metadata is mutable or not.
     */
    mutable: boolean;
    /**
     * Indicates whether the asset is burnt or not.
     */
    burnt: boolean;
};
/**
 * Representation of a list of assets.
 */
export declare type DasApiAssetList = {
    /**
     * total number of assets in the list.
     */
    total: number;
    /**
     * Limit of assets used to create the list. When the `total` value is
     * lower than the `limit`, it means that there are no more assets to be
     * retrieved.
     */
    limit: number;
    /**
     * Listing of individual assets.
     */
    items: Array<DasApiAsset>;
    /**
     * Additional information about the list.
     */
    [key: string]: unknown;
};

/**
 * Sorting criteria.
 */
declare type DasApiParamAssetSortBy = {
    sortBy: 'created' | 'updated' | 'recent_action' | 'none';
    sortDirection: 'asc' | 'desc';
};
export declare type DasApiAssetInterface = 'V1_NFT' | 'V1_PRINT' | 'LEGACY_NFT' | 'V2_NFT' | 'FungibleAsset' | 'Custom' | 'Identity' | 'Executable' | 'ProgrammableNFT';
export declare type DasApiAssetContent = {
    json_uri: string;
    files?: Array<{
        uri?: string;
        mime?: string;
        [key: string]: unknown;
    }>;
    metadata: DasApiMetadata;
    links?: Array<{
        [key: string]: unknown;
    }>;
};
export declare type DasApiAssetAuthority = {
    address: PublicKey;
    scopes: DasApiAuthorityScope[];
};
export declare type DasApiAssetCompression = {
    eligible: boolean;
    compressed: boolean;
    data_hash: PublicKey;
    creator_hash: PublicKey;
    asset_hash: PublicKey;
    tree: PublicKey;
    seq: number;
    leaf_id: number;
};
export declare type DasApiAssetOwnership = {
    frozen: boolean;
    delegated: boolean;
    delegate: PublicKey | null;
    ownership_model: 'single' | 'token';
    owner: PublicKey;
};
export declare type DasApiAssetSupply = {
    print_max_supply: number;
    print_current_supply: number;
    edition_nonce: number | null;
};
export declare type DasApiAssetRoyalty = {
    royalty_model: 'creators' | 'fanout' | 'single';
    target: PublicKey | null;
    percent: number;
    basis_points: number;
    primary_sale_happened: boolean;
    locked: boolean;
};
export declare type DasApiAssetCreator = {
    address: PublicKey;
    share: number;
    verified: boolean;
};
export declare type DasApiPropGroupKey = 'collection';
export declare type DasApiAssetGrouping = {
    group_key: DasApiPropGroupKey;
    group_value: string;
};
export declare type DasApiAuthorityScope = 'full' | 'royalty' | 'metadata' | 'extension';
export declare type DasApiMetadata = {
    name: string;
    symbol: string;
    description?: string;
    token_standard?: string;
    attributes?: Array<{
        trait_type?: string;
        value?: string;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
};
export declare type DasApiUses = {
    use_method: 'burn' | 'multiple' | 'single';
    remaining: number;
    total: number;
};
export declare type GetAssetProofRpcResponse = {
    root: PublicKey;
    proof: PublicKey[];
    node_index: number;
    leaf: PublicKey;
    tree_id: PublicKey;
};

export interface JsonResponse {
    jsonrpc: string;
    result: DasApiAssetList;
    id: number;
  }
  