import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";
import { useGame } from "@/utils/game/useGame";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Game } from "@/utils/game/types";

interface Props {
    gameInfo: Game;
    currentPlayer: PublicKey;
    gamePda: PublicKey;
    row: number;
    column: number;
    currentMove: 'X' | 'O';
    onSuccess?: () => void;
}

const PlayButton = ({ gameInfo, currentPlayer, gamePda, row, column, onSuccess, currentMove }: Props) => {
    const [instructions, setInstructions] = useState<TransactionInstruction[]>([]);

    const { gameClient } = useGame();
    const { publicKey: player } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!player) return;
        if (!gameClient) return;
        
        gameClient.createPlayInstruction({gameInfo, currentPlayer, gamePda, row, column})
            .then((instruction) => {
                setInstructions([instruction]);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [player, connection, gameClient, gameInfo, currentPlayer, gamePda, row, column]);



    return (
        <SendTransactionTemplate
            transactionInstructions={instructions}
            buttonLabel={currentMove}
            width={5}
            invisible={true}
            onSuccess={onSuccess}
        />
    );
}

export default PlayButton;