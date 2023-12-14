import { Keypair, TransactionInstruction } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";
import { useGame } from "@/utils/game/useGame";
import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";


const ClaimRewardButton = () => {
    const [instructions, setInstructions] = useState<TransactionInstruction[]>([]);
    const [extraSigners, setExtraSigners] = useState<Keypair[]>([]);

    const { gameClient, refreshActivePlayer } = useGame();
    const { publicKey: player } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!player) return;
        gameClient.claimRewardInstruction(player)
            .then(({instruction, extraSigner}) => {
                setInstructions([instruction]);
                setExtraSigners([extraSigner]);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [player, connection, gameClient]);

    return (
        <SendTransactionTemplate
            transactionInstructions={instructions}
            buttonLabel="Claim Reward 🎁"
            onSuccess={() => {
                refreshActivePlayer();
            }}
            extraSigners={extraSigners}
        />
    );
}

export default ClaimRewardButton;