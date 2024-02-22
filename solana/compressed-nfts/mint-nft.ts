import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { none } from '@metaplex-foundation/umi';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import {
    mplBubblegum,
    createTree,
    fetchTreeConfigFromSeeds,
    MetadataArgsArgs,
    mintV1,
    findLeafAssetIdPda
} from '@metaplex-foundation/mpl-bubblegum';
import {
    getConcurrentMerkleTreeAccountSize,
    ALL_DEPTH_SIZE_PAIRS,
} from "@solana/spl-account-compression";
import {
    PublicKey,
    Umi,
    createSignerFromKeypair,
    generateSigner,
    keypairIdentity
} from '@metaplex-foundation/umi';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DasApiAsset, dasApi } from '@metaplex-foundation/digital-asset-standard-api';


const endpoint = "https://example.solana-devnet.quiknode.pro/123456/";

const umi = createUmi(endpoint)
    .use(mplTokenMetadata())
    .use(mplBubblegum())
    .use(dasApi());

const secret = new Uint8Array(/* 📋 Paste your secret (e.g., [0, 0, ... 0, 0]) key here */);
const myKeypair = umi.eddsa.createKeypairFromSecretKey(secret);
const wallet = createSignerFromKeypair(umi, myKeypair);
umi.use(keypairIdentity(wallet));

const metadata: MetadataArgsArgs = {
    name: 'QN Pixel',
    symbol: 'QNPIX',
    uri: "https://qn-shared.quicknode-ipfs.com/ipfs/QmQFh6WuQaWAMLsw9paLZYvTsdL5xJESzcoSxzb6ZU3Gjx",
    sellerFeeBasisPoints: 500,
    collection: none(),
    creators: [],
};

function calculateDepthForNFTs(nftCount: number): number {
    let depth = 0;
    while (2 ** depth < nftCount) {
        depth++;
    }
    return depth;
}

function calcuateMaxBufferSize(nodes: number): number {
    let defaultDepthPair = ALL_DEPTH_SIZE_PAIRS[0];
    let maxDepth = defaultDepthPair.maxDepth;
    const allDepthSizes = ALL_DEPTH_SIZE_PAIRS.flatMap(
        (pair) => pair.maxDepth,
    ).filter((item, pos, self) => self.indexOf(item) == pos);

    for (let i = 0; i <= allDepthSizes.length; i++) {
        if (Math.pow(2, allDepthSizes[i]) >= nodes) {
            maxDepth = allDepthSizes[i];
            break;
        }
    }
    return ALL_DEPTH_SIZE_PAIRS.filter((pair) => pair.maxDepth == maxDepth)?.[0]
        ?.maxBufferSize ?? defaultDepthPair.maxBufferSize;
}

async function printAsset(umi: Umi, assetId: PublicKey<string>, retries = 5, retryDelay = 5000) {
    while (retries > 0) {
        try {
            const asset = await umi.rpc.getAsset(assetId);
            printAssetDetails(asset, true, false);
            return;
        } catch (e) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retries--;
        }
    }
}

function printAssetDetails(asset: DasApiAsset, showAttributes = true, showJson = false): void {
    const { name, token_standard: standard, attributes } = asset.content.metadata;
    const { compressed } = asset.compression;
    const { json_uri, files } = asset.content;

    const imgUrl = files?.find(file => file.mime === 'image/png' || file.mime === 'image/jpeg')?.uri;

    console.table({
        name,
        standard,
        compressed,
        json_uri,
        imgUrl
    });
    if (showAttributes && attributes) {
        console.table(attributes);
    }
    if (showJson) {
        console.log(JSON.stringify(asset, null, 2));
    }
}

const main = async ({ nftCount, umi, metadata }: { nftCount: number, umi: Umi, metadata: MetadataArgsArgs }) => {
    // 0 - Check Costs
    console.log(`👾 Initializing a Merkle Tree for ${nftCount.toLocaleString()} Compressed NFTs.`);

    const balance = await umi.rpc.getBalance(umi.payer.publicKey);

    console.log(`   Wallet Balance: ◎${(Number(balance.basisPoints) / LAMPORTS_PER_SOL).toLocaleString()}`)
    const merkleStructure = {
        maxDepth: calculateDepthForNFTs(nftCount),
        maxBufferSize: calcuateMaxBufferSize(nftCount),
        canopyDepth: 0,
    }

    // https://twitter.com/0xrwu/status/1669770903465459713
    const canopyDepth = merkleStructure.maxDepth > 20 ? merkleStructure.maxDepth - 10 :
        merkleStructure.maxDepth > 10 ? 10 :
            Math.floor(merkleStructure.maxDepth / 2);

    merkleStructure.canopyDepth = canopyDepth;


    console.log(`   Max Depth: ${merkleStructure.maxDepth}`);
    console.log(`   Max Buffer Size: ${merkleStructure.maxBufferSize}`);
    console.log(`   Canopy Depth: ${merkleStructure.canopyDepth}`);

    const requiredSpace = getConcurrentMerkleTreeAccountSize(
        merkleStructure.maxDepth,
        merkleStructure.maxBufferSize,
        merkleStructure.canopyDepth,
    );
    console.log(`   Total size: ${requiredSpace.toLocaleString()} bytes.`);

    const { basisPoints } = await umi.rpc.getRent(requiredSpace);
    const storageCost = Number(basisPoints);

    if (Number(balance.basisPoints) < storageCost) {
        throw new Error(`Insufficient funds. Need at least ◎${(storageCost / LAMPORTS_PER_SOL).toLocaleString(undefined)} for storage`);
    }

    console.log(`   Total cost: ◎ ${(storageCost / LAMPORTS_PER_SOL).toLocaleString(undefined)}`);
    // 1 - Create a Merkle Tree
    const merkleTree = generateSigner(umi);
    console.log(`   Creating Merkle Tree...${merkleTree.publicKey.toString()}`);

    const builder = await createTree(umi, {
        merkleTree,
        maxDepth: merkleStructure.maxDepth,
        maxBufferSize: merkleStructure.maxBufferSize,
        canopyDepth: merkleStructure.canopyDepth,
    });
    console.log(`   Sending request (this may take a few moments)...`);
    const { blockhash, lastValidBlockHeight } = await umi.rpc.getLatestBlockhash();
    await builder.sendAndConfirm(umi, {
        send: { commitment: 'finalized' },
        confirm: { strategy: { type: 'blockhash', blockhash, lastValidBlockHeight } },
    });

    let treeFound = false;
    while (!treeFound) {
        try {
            const treeConfig = await fetchTreeConfigFromSeeds(umi, {
                merkleTree: merkleTree.publicKey,
            });
            treeFound = true;
            console.log(`🌲 Merkle Tree created: ${merkleTree.publicKey.toString()}. Config:`)
            console.log(`     - Total Mint Capacity ${Number(treeConfig.totalMintCapacity).toLocaleString()}`);
            console.log(`     - Number Minted: ${Number(treeConfig.numMinted).toLocaleString()}`);
            console.log(`     - Is Public: ${treeConfig.isPublic}`);
            console.log(`     - Is Decompressible: ${treeConfig.isDecompressible}`);
        } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    // 2 - Mint NFT
    console.log(`🎨 Minting an example NFT`);

    const leafOwner = generateSigner(umi).publicKey;
    await mintV1(umi, { leafOwner, merkleTree: merkleTree.publicKey, metadata }).sendAndConfirm(umi);
    const assetId = findLeafAssetIdPda(umi, { merkleTree: merkleTree.publicKey, leafIndex: 0 });
    console.log(`🍃 NFT Minted: ${assetId[0].toString()}`);


    // 3 - Fetch NFT
    console.log(`   Fetching from the chain (this may take a few moments)...`);
    await printAsset(umi, assetId[0]);

}

main({ nftCount: 10_000, umi, metadata }).catch(console.error);