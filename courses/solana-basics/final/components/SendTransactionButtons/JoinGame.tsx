import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";
import { useGame } from "@/utils/game/useGame";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Game } from "@/utils/game/types";

interface Props {
    gameInfo: Game;
    gamePda: PublicKey;
}

const JoinGameButton = ({gameInfo, gamePda}:Props) => {
    const [instructions, setInstructions] = useState<TransactionInstruction[]>([]);
    
    const { gameClient, refreshGames, refreshActivePlayer } = useGame();
    const { publicKey: player } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!player) return;
        gameClient.joinGameInstruction(gameInfo, gamePda , player)
            .then((instruction) => {
                setInstructions([instruction]);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [player, connection, gameClient, gameInfo, gamePda]);



    return (
        <SendTransactionTemplate
            transactionInstructions={instructions}
            buttonLabel="Join"
            width={24}
            onSuccess={()=>{
                refreshGames();
                refreshActivePlayer();
                window.location.replace(`/games/${gamePda.toBase58()}`);
            }}
        />
    );
}

export default JoinGameButton;