import { TransactionInstruction } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";
import { useGame } from "@/utils/game/useGame";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

interface Props {
    onSuccess?: () => void;
}

const CreatePlayerButton = ({ onSuccess }: Props) => {
    const [instructions, setInstructions] = useState<TransactionInstruction[]>([]);

    const { gameClient } = useGame();
    const { publicKey: player } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!player) return;
        gameClient.createNewPlayerInstruction(player)
            .then((instruction) => {
                setInstructions([instruction]);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [player, connection, gameClient]);



    return (
        <SendTransactionTemplate
            transactionInstructions={instructions}
            buttonLabel="Create New Player"
            onSuccess={onSuccess}
        />
    );
}

export default CreatePlayerButton;