import { Game } from "@/utils/game/types";
import { useGame } from "@/utils/game/useGame";
import { shortenHash } from "@/utils/utils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import PlayButton from "./SendTransactionButtons/Play";
import Link from "next/link";



interface Props {
    gameId: string
}

const Board = ({ gameId }: Props) => {
    const [gameState, setGameState] = useState<Game>();
    const [loading, setLoading] = useState<boolean>(true);
    const { gameClient } = useGame();
    const { connection } = useConnection();
    const { publicKey: connectedPlayer } = useWallet();

    const refreshGameState = useCallback(() => {
        if (!gameClient) return;
        const gamePda = new PublicKey(gameId);
        setLoading(true);
        gameClient.fetchGame(gamePda)
            .then((game) => {
                setGameState(game);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [gameClient, gameId]);

    useEffect(() => {
        refreshGameState();
    }, [refreshGameState]);

    useEffect(() => {
        const subscription = connection.onAccountChange(new PublicKey(gameId), () => {
            refreshGameState();
        })
        return () => {
            connection.removeAccountChangeListener(subscription);
        }
    }, [refreshGameState, connection, gameId])

    if (loading) return <div className="flex flex-col items-center justify-center h-full mt-10">Loading...</div>;
    if (!gameState) return <div className="flex flex-col items-center justify-center h-full mt-10">Game not found</div>;

    const { id, playerX, playerO, board, state, turn, winner } = gameState;
    const currentPlayer = gameClient.whoseTurn(gameState);
    const canPlay = connectedPlayer && (currentPlayer?.toBase58() === connectedPlayer?.toBase58());
    const isPlayerX = 'active' in state && currentPlayer?.toBase58() === playerX.toBase58();
    const isPlayerO = 'active' in state && currentPlayer?.toBase58() === playerO.toBase58();
    const isOtherPlayerTurn = 'active' in state && currentPlayer?.toBase58() !== connectedPlayer?.toBase58();
    return (
        <main className="flex flex-col items-center justify-center h-full mt-10">
            <div className="text-lg mb-4">
                <p>
                    Game ID: <span className="font-bold">{id.toString()}</span>
                </p>
                <p>
                    X: <span className="font-bold">{shortenHash(playerX.toBase58())}</span>
                    <span className="text-sm text-gray-400"> {isPlayerX ? "(current turn)" : ""}</span>
                </p>
                {gameClient.lookingForOpponent(gameState) ? <p className="pulse mt-4 text-center">
                    Waiting for opponent to join...
                </p> : <p>
                    O: <span className="font-bold">{shortenHash(playerO.toBase58())}</span>
                    <span className="text-sm text-gray-400"> {isPlayerO ? "(Next move)" : ""}</span>
                </p>}
                {'tie' in state && <p className="mt-4">Tie!</p>}
                {winner && <p>🎉 Winner: {shortenHash(winner.toBase58())} 🎉</p>}
                {isOtherPlayerTurn && <p className="pulse mt-4 text-center">
                    Waiting for {isPlayerX ? 'X' : 'O'} to play
                </p>}
                {canPlay && <p className="mt-4 text-center">
                    Your turn. Select a square.
                </p>}

            </div>
            <div className="grid grid-cols-3 gap-4 w-64 h-64">
                {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                        let content;
                        let isCellClickable = false;

                        if (cell) {
                            content = 'x' in cell ? 'X' : 'O';
                        } else if (!canPlay) {
                            content = <div className="opacity-0">Z</div>; // Invisible placeholder
                        } else {
                            isCellClickable = true;
                            content = (
                                <PlayButton
                                    gameInfo={gameState}
                                    currentPlayer={connectedPlayer}
                                    gamePda={new PublicKey(gameId)}
                                    row={rowIndex}
                                    column={colIndex}
                                    onSuccess={refreshGameState}
                                    currentMove={isPlayerO ? 'O' : 'X'}
                                />
                            );
                        }

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`bg-gray-800 rounded-md flex items-center justify-center text-2xl text-white ${isCellClickable ? 'cursor-pointer hover:bg-gray-700' : ''}`}
                            >
                                {content}
                            </div>
                        );
                    })
                )}

            </div>
            <Link className="mt-4" href="/">
                ⬅️ Home
            </Link>
        </main>
    );

}

export default Board;