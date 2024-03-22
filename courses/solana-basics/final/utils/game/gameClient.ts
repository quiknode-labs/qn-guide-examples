import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SEEDS } from "../constants";
import { TicTacToe } from "./idl/idl";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PlayerInfo, Game, GameAndPda, Record, Square } from "./types";

export class TicTacToeClient {
    private readonly program: anchor.Program<TicTacToe>;
    public playerInfo: PlayerInfo | undefined;
    private constructor(program: anchor.Program<TicTacToe>) {
        if (!program) {
            throw new Error("Program must be provided.");
        }
        this.program = program;
    }

    public static from(program: anchor.Program<TicTacToe>): TicTacToeClient {
        return new TicTacToeClient(program);
    }

    public isReady(): boolean {
        return this.program !== undefined;
    }

    private setPlayerInfo(newInfo: PlayerInfo): void {
        this.playerInfo = newInfo;
    }

    private getProgramStatePda(): PublicKey {
        const [programStatePda, _programStateBump] = PublicKey.findProgramAddressSync(
            [SEEDS.programState],
            this.program.programId
        );
        return programStatePda;
    }

    private getPlayerPda(playerPubKey: PublicKey): PublicKey {
        const [playerPda, _playerBump] = PublicKey.findProgramAddressSync(
            [SEEDS.player, playerPubKey.toBuffer()],
            this.program.programId
        );
        return playerPda;
    }

    private getPlayTokenMint(): PublicKey {
        const [mintPda, _mintBump] = PublicKey.findProgramAddressSync(
            [SEEDS.mint],
            this.program.programId
        );
        return mintPda;
    }

    private getPlayerTokenAccount(playerPubKey: PublicKey): PublicKey {
        const mint = this.getPlayTokenMint();
        return getAssociatedTokenAddressSync(mint, playerPubKey);
    }

    private getGamePda(gameId: number): PublicKey {
        function numberBuffer(value: bigint): Uint8Array {
            const bytes = new Uint8Array(8);
            for (let i = 0; i < 8; i++) {
                bytes[i] = Number(value & BigInt(0xff));
                value = value >> BigInt(8);
            }
            return bytes;
        }
        const [gamePda, _gameBump] = PublicKey.findProgramAddressSync(
            [SEEDS.game, numberBuffer(BigInt(gameId))],
            this.program.programId
        );
        return gamePda;
    }

    public async getPlayerIfRegistered(playerPubKey: PublicKey): Promise<PlayerInfo | undefined> {
        const playerPda = this.getPlayerPda(playerPubKey);

        try {
            // @ts-ignore This works -- need to research type issue w/ IDL
            const accountInfo = await this.program.account.player.fetch(playerPda);
            const tokenAccount = this.getPlayerTokenAccount(playerPubKey);
            const accountBalance = await this.program.provider.connection.getTokenAccountBalance(tokenAccount);
            const playerInfo: PlayerInfo = {
                playerPda,
                playerTokenAccount: this.getPlayerTokenAccount(playerPubKey),
                playerTokenBalance: accountBalance.value.uiAmount ?? 0,
                record: accountInfo.record as unknown as Record,
                rewardClaimed: accountInfo.rewardClaimed,
            }
            this.setPlayerInfo(playerInfo);
            return playerInfo;
        } catch (err) {
            // Expected error - player not registerred yet
            return undefined;
        }
    }

    private async getCurrentGameId(): Promise<number> {
        const programStatePda = this.getProgramStatePda();
        //@ts-ignore This works -- need to research type issue w/ IDL
        const state = await this.program.account.programState.fetch(programStatePda);
        return state.currentGameId.toNumber();
    }

    public async createNewPlayerInstruction(player: PublicKey): Promise<TransactionInstruction> {
        if (!player) throw new Error("Player must be provided.");
        const playerPda = this.getPlayerPda(player);
        const playerTokenAccount = this.getPlayerTokenAccount(player);
        const mint = this.getPlayTokenMint();
        const instruction = await this.program.methods
            .createPlayer()
            .accounts({
                player,
                playerPda,
                playerTokenAccount,
                mint,
            })
            .instruction()
        return instruction;
    }

    public async createNewGameInstruction(playerX: PublicKey): Promise<{ instruction: TransactionInstruction, game: string }> {
        if (!playerX) throw new Error("Player must be provided.");
        try {
            const gameId = await this.getCurrentGameId();
            const game = this.getGamePda(gameId);
            const playerPda = this.getPlayerPda(playerX);
            const playerTokenAccount = this.getPlayerTokenAccount(playerX);
            const mint = this.getPlayTokenMint();
            const programState = this.getProgramStatePda();
            const instruction = await this.program.methods
                .createGame(new anchor.BN(gameId))
                .accounts({
                    game,
                    playerX,
                    playerPda,
                    playerTokenAccount,
                    mint,
                    programState,
                })
                .instruction()
            return { instruction, game: game.toBase58() };
        } catch (err) {
            console.log(err); throw err;
        }
    }

    public async fetchAllGames(): Promise<GameAndPda[]> {
        const games = await this.program.account.game.all() as unknown as GameAndPda[];
        return games;
    }

    public async fetchGame(gamePda: PublicKey): Promise<Game> {
        const game = await this.program.account.game.fetch(gamePda) as unknown as Game;
        return game;
    }


    public canPlay(game: Game, player: PublicKey | null): boolean {
        if (!player) return false;
        if (!game) return false;
        if (!game.state) return false;

        const isGameActive = 'active' in game.state;
        const isPlayerInGame = game.playerX.toBase58() === player.toBase58() ||
            game.playerO.toBase58() === player.toBase58();
        return isGameActive && isPlayerInGame
    }

    public canJoin(game: Game, player: PublicKey | null): boolean {
        if (!player) return false;
        if (!game) return false;
        if (!game.state) return false;

        const isGameNotStarted = 'notStarted' in game.state;
        const isPlayerNotInGame = game.playerX.toBase58() !== player.toBase58() &&
            game.playerO.toBase58() !== player.toBase58();
        return isGameNotStarted && isPlayerNotInGame
    }

    public lookingForOpponent(game: Game): boolean {
        if (!game) throw new Error("Game must be provided.");
        return 'notStarted' in game.state;
    }
    public isParticipating(game: Game, player: PublicKey | null): boolean {
        if (!game) throw new Error("Game must be provided.");
        if (!player) return false;
        return game.playerX.toBase58() === player.toBase58() ||
            game.playerO.toBase58() === player.toBase58();
    }

    public whoseTurn(game: Game): PublicKey | null {
        if (!game) throw new Error("Game must be provided.");
        if (!game.state) throw new Error("Game state must be provided.");
        if ('notStarted' in game.state) return null;
        if ('won' in game.state) return null;
        if ('tie' in game.state) return null;
        if ('active' in game.state) {
            const isPlayerX = ((game.turn - 1) % 2) + 1 === 1;
            return isPlayerX ? game.playerX : game.playerO;
        }
        return null;
    }

    private isPlayerInGame(game: Game, player: PublicKey): boolean {
        if (!game) throw new Error("Game must be provided.");
        if (!player) throw new Error("Player must be provided.");
        return game.playerX.toBase58() === player.toBase58() ||
            game.playerO.toBase58() === player.toBase58();
    }

    public otherPlayer(game: Game, player: PublicKey): PublicKey {
        if (!game) throw new Error("Game must be provided.");
        if (!player) throw new Error("Player must be provided.");
        if (!this.isPlayerInGame(game, player)) throw new Error("Player must be in game.");
        return game.playerX.toBase58() === player.toBase58() ? game.playerO : game.playerX;
    }

    public async joinGameInstruction(gameInfo: Game, gamePda: PublicKey, player: PublicKey): Promise<TransactionInstruction> {
        if (!gameInfo) throw new Error("Game must be provided.");
        if (!player) throw new Error("Player must be provided.");
        if (!this.canJoin(gameInfo, player)) throw new Error("Player cannot join game.");
        const playerPda = this.getPlayerPda(player);
        const playerTokenAccount = this.getPlayerTokenAccount(player);
        const mint = this.getPlayTokenMint();
        const instruction = await this.program.methods
            .joinGame()
            .accounts({
                game: gamePda,
                playerO: player,
                playerPda,
                playerTokenAccount,
                mint,
            })
            .instruction()
        return instruction;
    }

    public async createPlayInstruction(params: {
        gameInfo: Game;
        currentPlayer: PublicKey;
        gamePda: PublicKey;
        row: number;
        column: number;
    }): Promise<TransactionInstruction> {
        const square: Square = { row: params.row, column: params.column };
        const playerRecord = this.getPlayerPda(params.currentPlayer);
        const otherPlayerRecord = this.getPlayerPda(this.otherPlayer(params.gameInfo, params.currentPlayer));

        const instruction = await this.program.methods
            .play(square)
            .accounts({
                player: params.currentPlayer,
                playerRecord,
                otherPlayerRecord,
                game: params.gamePda,
            })
            .instruction();

        return instruction;
    }

    public async claimRewardInstruction(player: PublicKey): Promise<{ instruction: TransactionInstruction, extraSigner: Keypair }> {
        const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        const mintKeypair = new Keypair();

        // Derive the PDA of the metadata account for the mint.
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        // Derive the PDA of the master edition account for the mint.
        const [editionAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        // Derive the associated token address account for the mint and payer.
        const associatedTokenAccountAddress = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            player
        );
        const instruction = await this.program.methods
            .claimReward()
            .accounts({
                player,
                playerPda: this.getPlayerPda(player),
                metadataAccount: metadataAddress,
                editionAccount: editionAddress,
                mintAccount: mintKeypair.publicKey,
                associatedTokenAccount: associatedTokenAccountAddress,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            })
            .instruction();
        return { instruction, extraSigner: mintKeypair };

    }
}