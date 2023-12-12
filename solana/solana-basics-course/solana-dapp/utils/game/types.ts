import { PublicKey } from "@solana/web3.js";

export interface PlayerInfo {
    playerPda: PublicKey;
    playerTokenAccount: PublicKey;
    record: Record;
    playerTokenBalance: number;
    rewardClaimed: boolean;
}
type Sign = { x: {} } | { o: {} };
export type Square = { row: number; column: number };
type Status = { active: {} } | { won: {} } | { tie: {} } | { notStarted: {} };
type Board = (Sign | null)[][];

export interface Game {
    id: bigint; // u64 is represented as bigint in TypeScript
    playerX: PublicKey;
    playerO: PublicKey;
    board: Board;
    state: Status;
    turn: number; // u8 can be represented as number
    bump: number; 
    winner: PublicKey | null;
};


export interface GameAndPda {
    publicKey: PublicKey;
    account: Game;
}

export interface Player {
    auth: PublicKey;
    record: Record;
}

export interface Record {
    wins: number;
    losses: number;
    ties: number;
    airdropReceived: boolean;
    rewardClaimed: boolean;
    bump: number;
}