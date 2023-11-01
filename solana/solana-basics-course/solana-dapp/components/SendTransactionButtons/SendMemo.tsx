import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { SendTransactionTemplate } from "./SendTransactionTemplate";

interface SendMemoButtonProps {
    message: string;
}

const SendMemoButton = ({ message }: SendMemoButtonProps) => {
    const transactionInstruction = new TransactionInstruction({
        data: Buffer.from(message),
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    })

    return (
        <SendTransactionTemplate
            transactionInstructions={[transactionInstruction]}
            buttonLabel="Send Memo Transaction"
        />
    );
}

export default SendMemoButton;