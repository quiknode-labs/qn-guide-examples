import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'; //  (v.1.X - npm i @solana/web3.js@1)

interface QNLib {
    qnUpsertList: (key: string, options: { add_items?: string[], remove_items?: string[] }) => Promise<any>;
    qnGetList: (key: string) => Promise<string[]>;
}
declare const qnLib: QNLib;
const ENDPOINT = 'https://example.solana-mainnet.quiknode.pro/123/'; // 👈 Replace with your endpoint

// Types & Interfaces
type Instruction = 'createPortfolio' | 'updatePortfolio' | 'getPortfolio' | 'getPortfolioBalances';

interface UserData {
    instruction: Instruction;
    portfolioName: string;
    addAddresses?: string[];
    removeAddresses?: string[];
}

interface FunctionParams {
    user_data: UserData;
}

interface FunctionResult {
    message: string;
    portfolioName: string;
    addresses?: string[];
    balances?: { address: string; balance: number }[];
    error?: string;
}

// Helper functions
function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch (error) {
        return false;
    }
}

function validateInput(params: FunctionParams): void {
    const validInstructions: Instruction[] = ['createPortfolio', 'updatePortfolio', 'getPortfolio', 'getPortfolioBalances'];
    if (!validInstructions.includes(params.user_data.instruction)) {
        throw new Error(`Invalid instruction: ${params.user_data.instruction}. Must be one of: ${validInstructions.join(', ')}`);
    }

    if (!params.user_data.portfolioName) {
        throw new Error('Portfolio name is required');
    }

    if (params.user_data.instruction === 'updatePortfolio') {
        if (!params.user_data.addAddresses && !params.user_data.removeAddresses) {
            throw new Error('At least one of addAddresses or removeAddresses is required for updatePortfolio instruction');
        }

        if (params.user_data.addAddresses) {
            const invalidAddAddresses = params.user_data.addAddresses.filter(addr => !isValidSolanaAddress(addr));
            if (invalidAddAddresses.length > 0) {
                throw new Error(`Invalid Solana addresses: ${invalidAddAddresses.join(', ')}`);
            }
        }
    }
}

// Instruction handlers
async function createPortfolio(portfolioName: string): Promise<FunctionResult> {
    await qnLib.qnUpsertList(portfolioName, { add_items: [] });
    return {
        message: `Portfolio ${portfolioName} created successfully.`,
        portfolioName
    };
}

async function updatePortfolio(portfolioName: string, addAddresses: string[] = [], removeAddresses: string[] = []): Promise<FunctionResult> {
    await qnLib.qnUpsertList(portfolioName, { add_items: addAddresses, remove_items: removeAddresses });
    const updatedPortfolio = await qnLib.qnGetList(portfolioName);
    return {
        message: `Updated portfolio ${portfolioName}. Added ${addAddresses.length} addresses, removed ${removeAddresses.length} addresses.`,
        portfolioName,
        addresses: updatedPortfolio
    };
}

async function getPortfolio(portfolioName: string): Promise<FunctionResult> {
    const addresses = await qnLib.qnGetList(portfolioName);
    return {
        message: `Retrieved portfolio ${portfolioName}.`,
        portfolioName,
        addresses
    };
}

async function getPortfolioBalances(portfolioName: string): Promise<FunctionResult> {
    const addresses = await qnLib.qnGetList(portfolioName);

    // @ts-ignore - Already validated in validateInput
    const connection = new Connection(ENDPOINT);

    const balances = await Promise.all(
        addresses.map(async (address) => {
            const publicKey = new PublicKey(address);
            const balance = await connection.getBalance(publicKey);
            return {
                address,
                balance: balance / LAMPORTS_PER_SOL
            };
        })
    );

    return {
        message: `Retrieved balances for portfolio ${portfolioName}.`,
        portfolioName,
        balances
    };
}

// Main function
export async function main(params: FunctionParams): Promise<FunctionResult> {
    try {
        console.log('Received params:', JSON.stringify(params));
        validateInput(params);

        const { instruction, portfolioName, addAddresses, removeAddresses } = params.user_data;

        switch (instruction) {
            case 'createPortfolio':
                return await createPortfolio(portfolioName);
            case 'updatePortfolio':
                return await updatePortfolio(portfolioName, addAddresses, removeAddresses);
            case 'getPortfolio':
                return await getPortfolio(portfolioName);
            case 'getPortfolioBalances':
                return await getPortfolioBalances(portfolioName);
            default:
                throw new Error('Invalid instruction');
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            message: 'An error occurred',
            portfolioName: params.user_data.portfolioName,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}