import {
    createSolanaRpc,
    Address,
    address,
    getAddressDecoder,
    getProgramDerivedAddress,
    Endian,
    getU16Encoder,
    getBase64Encoder,
    getStructDecoder,
    FixedSizeDecoder,
    fixDecoderSize,
    getBytesDecoder,
    getU8Decoder,
    getU16Decoder,
    getU32Decoder,
    getU64Decoder,
    getArrayDecoder,
    ReadonlyUint8Array
} from "@solana/kit";
import dotenv from "dotenv";

dotenv.config();

const PROGRAM_ID = address('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
const AMM_CONFIG_SEED = "amm_config";
const AMM_CONFIG_INDEX = 4;

interface AmmConfig {
    anchorDiscriminator: ReadonlyUint8Array;
    bump: number;
    index: number;
    owner: Address;
    protocolFeeRate: number;
    tradeFeeRate: number;
    tickSpacing: number;
    fundFeeRate: number;
    paddingU32: number;
    fundOwner: Address;
    padding: bigint[];
}

const ammConfigDecoder: FixedSizeDecoder<AmmConfig> = getStructDecoder([
    ["anchorDiscriminator", fixDecoderSize(getBytesDecoder(), 8)],
    ["bump", getU8Decoder()],
    ["index", getU16Decoder()],
    ["owner", getAddressDecoder()],
    ["protocolFeeRate", getU32Decoder()],
    ["tradeFeeRate", getU32Decoder()],
    ["tickSpacing", getU16Decoder()],
    ["fundFeeRate", getU32Decoder()],
    ["paddingU32", getU32Decoder()],
    ["fundOwner", getAddressDecoder()],
    ["padding", getArrayDecoder(
        getU64Decoder(),
        { size: 3 }
    )]
]);


async function main() {
    const u16BEEncoder = getU16Encoder({ endian: Endian.Big });

    const [configPda] = await getProgramDerivedAddress({
        programAddress: PROGRAM_ID,
        seeds: [
            AMM_CONFIG_SEED,
            u16BEEncoder.encode(AMM_CONFIG_INDEX),
        ]
    });

    console.log(`Parsing AMM Config PDA: ${configPda}`);

    const rpc = createSolanaRpc(process.env.HTTP_ENDPOINT as string);
    const base64Encoder = getBase64Encoder();

    const { value } = await rpc.getAccountInfo(configPda, { encoding: 'base64' }).send();
    if (!value || !value?.data) {
        throw new Error(`Account not found: ${configPda.toString()}`);
    }
    let bytes = base64Encoder.encode(value.data[0]);
    const decoded = ammConfigDecoder.decode(bytes);
    console.log(decoded);
}

main().catch(console.error);