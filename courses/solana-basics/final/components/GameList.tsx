import { useGame } from "@/utils/game/useGame";
import { shortenHash } from "@/utils/utils";
import Link from 'next/link';
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import JoinGameButton from "./SendTransactionButtons/JoinGame";

interface Props {
    player: PublicKey | null
}

const GameList = ({ player }: Props) => {
    const [showAll, setShowAll] = useState(false);
    const { gameClient, games } = useGame();

    return (
        <div className="overflow-x-auto mt-4 text-center">
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                onClick={() => setShowAll(prev => !prev)}
            >
                {showAll ? "Active Games" : "Game History"}
            </button>

            <table className="min-w-full text-white table-auto">
                <thead>
                    <tr className="border-b border-gray-700">
                        <th className="px-4 py-2">Game ID</th>
                        <th className="px-4 py-2">Actions</th>
                        <th className="px-4 py-2">Player 1</th>
                        <th className="px-4 py-2">Player 2</th>
                        <th className="px-4 py-2">Winner</th>
                    </tr>
                </thead>
                <tbody>
                    {games?.sort((a, b) => {
                        //@ts-ignore this works
                        return a.account.id.toNumber() > b.account.id.toNumber() ? 1 : -1;
                    })
                        .filter(game =>
                            showAll ? gameClient.isParticipating(game.account, player) :
                                (gameClient.canPlay(game.account, player) || gameClient.canJoin(game.account, player))
                        )
                        .map((game, index) => {
                            const canPlay = gameClient.canPlay(game.account, player);
                            const canJoin = gameClient.canJoin(game.account, player);
                            const canPlayOrJoin = (canPlay || canJoin);;

                            return (
                                <tr key={game.account.id} className={`bg-gray-800 border-b border-gray-700 ${index % 2 === 0 ? 'bg-opacity-50' : ''}`}>
                                    <td className="px-4 py-2">
                                        <Link href={`/games/${game.publicKey.toString()}`} >
                                            {game.account.id.toString()}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">
                                        {canPlay && (
                                            <Link
                                                href={`/games/${game.publicKey.toString()}`}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                            >
                                                Play
                                            </Link>
                                        )}
                                        {canJoin && (
                                            <JoinGameButton
                                                gameInfo={game.account}
                                                gamePda={game.publicKey}
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-2">{shortenHash(game.account.playerX.toString())}</td>
                                    <td className="px-4 py-2">{gameClient.lookingForOpponent(game.account) ? 'waiting' : shortenHash(game.account.playerO.toString())}</td>
                                    <td className="px-4 py-2">{game.account.winner ?
                                        shortenHash(game.account.winner.toString()) :
                                        ('tie' in game.account.state) ? "Tie"
                                            : "N/A"}</td>
                                </tr>
                            )
                        })}
                </tbody>
            </table>
            {games && games.length === 0 && (
                <div className="text-gray-500 mt-4">No games found.</div>
            )}
        </div>
    );
}

export default GameList;