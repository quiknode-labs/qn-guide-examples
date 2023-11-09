import { TransactionInstruction, PublicKey, Keypair } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";
import { createNewToken } from "../../utils/token-lib";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

interface CreateTokenButtonProps {
    numDecimals?: number;
    numTokens?: number;
}

const CreateTokenButton = ({ numDecimals, numTokens }: CreateTokenButtonProps) => {
    const [instructions, setInstructions] = useState<TransactionInstruction[]>([]);
    const [extraSigners, setExtraSigners] = useState<Keypair[]>([]);

    const { publicKey: authority } = useWallet();
    const { connection } = useConnection();

    useEffect(() => {
        if (!authority) return;
        createNewToken({ authority, connection, numDecimals, numTokens })
            .then(({ instructions, signers }) => {
                setInstructions(instructions);
                setExtraSigners(signers);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [authority, connection]);


    return (
        <SendTransactionTemplate
            transactionInstructions={instructions}
            buttonLabel={`Init New Token`}
            extraSigners={extraSigners}
        />
    );
}

export default CreateTokenButton;