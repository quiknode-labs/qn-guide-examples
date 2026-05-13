import { ArbBot, SwapToken } from './bot';

const defaultConfig = {
    solanaEndpoint: 'https://api.mainnet-beta.solana.com',
    jupiter: "https://public.jupiterapi.com",
};

async function main() {
    if (!process.env.SECRET_KEY) {
        throw new Error("SECRET_KEY environment variable not set");
    }
    let decodedSecretKey = Uint8Array.from(JSON.parse(process.env.SECRET_KEY));

    const bot = new ArbBot({
        solanaEndpoint: process.env.SOLANA_ENDPOINT ?? defaultConfig.solanaEndpoint,
        metisEndpoint: process.env.METIS_ENDPOINT ?? defaultConfig.jupiter,
        secretKey: decodedSecretKey,
        firstTradePrice: 900_000,       // min USDC out (6 decimals) — $0.90 for 0.01 SOL at ~$90/SOL
        targetGainPercentage: 1.5,
        initialInputToken: SwapToken.SOL,
        initialInputAmount: 10_000_000, // 0.01 SOL in lamports
    });

    await bot.init();
}

main().catch(console.error);
