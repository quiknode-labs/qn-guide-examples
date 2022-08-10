import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useState } from 'react';
import { notify } from "../utils/notifications";
//Add import dependencies here

export const Template: FC = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    //State Variables here

    //dApp Scripts here

    return(<div>

    {/* Render Results Here */}

    </div>)    
}