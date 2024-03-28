import Balance from './Balance';
import { useWallet } from '@solana/wallet-adapter-react';
import SendMemoButton from './SendTransactionButtons/SendMemo';

const Main = () => {
    const { connected } = useWallet();
    return (
        <div className="flex flex-col items-center justify-between p-24">
            {connected ?
                <div>
                    <Balance />
                    <SendMemoButton message='Hello from QuickNode!' />
                </div>
                :
                <div>Wallet Not Connected</div>}
        </div>
    )
}
export default Main;