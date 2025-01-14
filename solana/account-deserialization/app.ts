import {
    struct,
    u8,
    u32,
    nu64,
    u16,
    seq
} from '@solana/buffer-layout';
import { Connection, PublicKey } from '@solana/web3.js';
import { publicKey } from '@solana/buffer-layout-utils';
import dotenv from "dotenv";

dotenv.config();

const PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
const AMM_CONFIG_SEED = "amm_config";
const AMM_CONFIG_INDEX = 4;

interface AmmConfig {
    anchorDiscriminator: Buffer;
    bump: number;
    index: number;
    owner: PublicKey;
    protocolFeeRate: number;
    tradeFeeRate: number;
    tickSpacing: number;
    fundFeeRate: number;
    paddingU32: number;
    fundOwner: PublicKey;
    padding: number[];
}

const ammLayout = struct<AmmConfig>([
    seq(u8(), 8, 'anchorDiscriminator'),
    u8('bump'),
    u16('index'),
    publicKey('owner'),
    u32('protocolFeeRate'),
    u32('tradeFeeRate'),
    u16('tickSpacing'),
    u32('fundFeeRate'),
    u32('paddingU32'),
    publicKey('fundOwner'),
    seq(nu64(), 3, 'padding')
]);


function u16ToBytes(num: number): Uint8Array {
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, num, false);
    return new Uint8Array(arr);
}
async function main() {
    const rpcUrl = process.env.HTTP_ENDPOINT as string;
    const connection = new Connection(rpcUrl, 'confirmed');
    const [pda] = PublicKey.findProgramAddressSync([
        Buffer.from(AMM_CONFIG_SEED, "utf8"),
        u16ToBytes(AMM_CONFIG_INDEX)
    ], PROGRAM_ID);
    const accountInfo = await connection.getAccountInfo(pda)
    if (!accountInfo || !accountInfo.data) { throw new Error("Account Not Found") }
    console.log(ammLayout.decode(accountInfo.data));
}

main();