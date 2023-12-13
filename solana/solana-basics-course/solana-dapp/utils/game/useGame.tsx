import * as anchor from "@coral-xyz/anchor";
import { IDL, TicTacToe } from "./idl/idl";
import { PROGRAM_ID } from "../constants";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { TicTacToeClient } from "./gameClient";
import { GameAndPda, PlayerInfo } from "./types";

export interface GameProgramContextState {
    gameClient: TicTacToeClient;
    activePlayer: PlayerInfo | undefined;
    refreshActivePlayer: () => void;
    games: GameAndPda[];
    refreshGames: () => void;
}

export const GameProgramContext = createContext<GameProgramContextState>(
    {} as GameProgramContextState
);

export function useGame(): GameProgramContextState {
    return useContext(GameProgramContext);
}

export function GameProgramProvider(props: { children: ReactNode }): JSX.Element {
    const [api, setApi] = useState<TicTacToeClient>();
    const [activePlayer, setActivePlayer] = useState<PlayerInfo>();
    const [games, setGames] = useState<GameAndPda[]>([]);

    const anchorWallet = useAnchorWallet();
    const { connection } = useConnection();

    useEffect(() => {
        const provider: anchor.AnchorProvider = new anchor.AnchorProvider(
            connection,
            // fallback value allows querying the program without having a wallet connected
            anchorWallet ?? ({} as anchor.Wallet),
            { commitment: 'confirmed', preflightCommitment: 'confirmed' }
        );
        const program: anchor.Program<TicTacToe> = new anchor.Program(
            IDL as unknown as TicTacToe,
            PROGRAM_ID,
            provider ?? ({} as anchor.AnchorProvider)
        );
        setApi(TicTacToeClient.from(program));
    }, [anchorWallet, connection, setApi]);

    const refreshActivePlayer = useCallback(() => {
        if (!api || !anchorWallet || !api.isReady()) return;
        api.getPlayerIfRegistered(anchorWallet.publicKey)
            .then((player) => {
                setActivePlayer(player);
            })
            .catch((error) => {
                console.error('Error fetching active player:', error);
            });
    }, [api, anchorWallet]);

    useEffect(() => {
        refreshActivePlayer();
    }, [refreshActivePlayer]);

    const refreshGames = useCallback(() => {
        if (!api) return;
        api.fetchAllGames().then(setGames).catch(console.error);
    }, [api]);

    useEffect(() => {
        refreshGames();
    }, [refreshGames]);

    const value: GameProgramContextState = {
        gameClient: api as TicTacToeClient,
        activePlayer,
        refreshActivePlayer,
        games,
        refreshGames
    };

    return (
        <GameProgramContext.Provider value={value}>
            {props.children}
        </GameProgramContext.Provider>
    );

}

