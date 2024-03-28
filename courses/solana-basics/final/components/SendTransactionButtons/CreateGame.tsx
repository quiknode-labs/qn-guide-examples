import { TransactionInstruction } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";
import { useGame } from "@/utils/game/useGame";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const CreateGameButton = () => {
    const [instructions, setInstructions] = useState<TransactionInstruction[]>([]);
    const [gamePda, setGamePda] = useState<string>();
    const { gameClient, refreshGames, refreshActivePlayer } = useGame();
    const { publicKey: player } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!player) return;
        gameClient.createNewGameInstruction(player)
            .then(({ instruction, game }) => {
                setGamePda(game);
                setInstructions([instruction]);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [player, connection, gameClient]);

    return (
        <SendTransactionTemplate
            transactionInstructions={instructions}
            buttonLabel="Create New Game"
            onSuccess={() => {
                refreshGames();
                refreshActivePlayer();
                window.location.replace(`/games/${gamePda}`);
            }}
        />
    );
}

export default CreateGameButton;