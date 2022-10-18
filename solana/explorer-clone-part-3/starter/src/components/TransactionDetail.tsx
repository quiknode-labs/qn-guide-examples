import { useRouter } from 'next/router'
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, ParsedTransactionWithMeta} from '@solana/web3.js';
import { FC, useEffect, useState } from 'react';

export const TransactionDetail: FC = () => {
    const router = useRouter();
    const { txid } = router.query;
    const { connection } = useConnection();
    const [transactionDetail, setTransactionDetail] = useState<ParsedTransactionWithMeta>(null);
    const [transactionCard, setTransactionCard] = useState<JSX.Element>(null);
    let search = Array.isArray(txid) ? txid[0] : txid;

    useEffect(()=>{
        if(!router.isReady) return;
        if(search) {getTransaction(search);}        
    },[router.isReady]);

    useEffect(() => {
        if (transactionDetail) {
            buildView();
        }
      }, [transactionDetail, connection]);
    
    async function getTransaction(txid: string) {
        //Get parsed details for the transaction 
        let transactionDetails = await connection.getParsedTransaction(txid, {maxSupportedTransactionVersion:0});
        //Update State
        setTransactionDetail(transactionDetails);
    }

    function buildView() {
        if(transactionDetail) {
            let overviewTable = buildOverviewTable();
            let accountsTable = buildAccountsTable();
            let tokensTable = buildTokensTable();
            let programsTable = buildProgramsTable();
            let view = (<>
                <p className="text-left text-lg font-bold">Overview:</p> 
                {overviewTable} 
                <br/> 
                <p className="text-left text-lg font-bold">Account Input(s): </p>                 
                {accountsTable}
                <br/> 
                <p className="text-left text-lg font-bold">SPL Token Changes(s): </p>                 
                {tokensTable}
                <br/> 
                <p className="text-left text-lg font-bold">Programs(s): </p>                 
                {programsTable}
            </>)
            setTransactionCard(view)
        } 
        else {
            setTransactionCard(null);
        }
    }

    function buildOverviewTable() {
        if(transactionDetail) {
            let date = new Date(transactionDetail.blockTime*1000).toLocaleDateString();
            let table = 
            (<table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <tbody>

                <tr  className="bg-white border-b bg-zinc-800 dark:border-zinc-700">
                    <td className="px-6 py-3">Signature</td>
                    <td className="px-6 py-3">{transactionDetail.transaction.signatures[0]}</td>
                </tr>
                <tr  className="bg-white border-b bg-zinc-800 dark:border-zinc-700">
                    <td className="px-6 py-3">Timestamp</td>
                    <td className="px-6 py-3">{date}</td>
                </tr>
                <tr  className="bg-white border-b bg-zinc-800 dark:border-zinc-700">
                    <td className="px-6 py-3">Status</td>
                    <td className="px-6 py-3">{transactionDetail.meta.err ? 'Failed' : 'Success'}</td>
                </tr>
                </tbody>
            </table>
            );
            return(table)
        } 
        else {
            return(null);
        }
    }

    function buildAccountsTable() {
        if(transactionDetail) {
            let {preBalances, postBalances} = transactionDetail.meta;
            let header = 
                <thead className="text-xs text-gray-700 uppercase bg-zinc-50 dark:bg-gray-700 dark:text-gray-400"><tr>
                    <td className="px-6 py-3">#</td>
                    <td className="px-6 py-3">Address</td>
                    <td className="px-6 py-3 text-center">Change</td>
                    <td className="px-6 py-3 text-center">Post Balance</td>
                </tr></thead>;
            let rows = (transactionDetail.transaction.message.accountKeys.map((account,i)=>{
                let solChange = (postBalances[i] - preBalances[i]) / LAMPORTS_PER_SOL;
                return (
                    <tr key={i+1} className="bg-white border-b bg-zinc-800 dark:border-zinc-700">
                        <td className="px-6 py-3">{i+1}</td>
                        <td className="px-6 py-3">{account.pubkey.toString()}</td>                        
                        <td className="px-6 py-3 text-center">{solChange === 0 ? '-' : '◎ ' + solChange.toFixed(6)}</td>
                        <td className="px-6 py-3 text-center">◎ {(postBalances[i] / LAMPORTS_PER_SOL).toFixed(3)}</td>
                    </tr>)
                }
            ));
            let table = (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                {header}
                <tbody>{rows}</tbody>
            </table>);
            return(table)
        } 
        else {
            return(null)
        }
    }

    function buildTokensTable() {
        if(transactionDetail) {
            let {preTokenBalances, postTokenBalances} = transactionDetail.meta;
            let header = 
                <thead className="text-xs text-gray-700 uppercase bg-zinc-50 dark:bg-gray-700 dark:text-gray-400"><tr>
                    <td className="px-6 py-3">#</td>
                    <td className="px-6 py-3">Owner</td>
                    <td className="px-6 py-3">Mint</td>
                    <td className="px-6 py-3 text-center">Change</td>
                    <td className="px-6 py-3 text-center">Post Balance</td>
                </tr></thead>;
            let rows = (preTokenBalances.map((account,i)=>{
                let tokenChange = (postTokenBalances[i].uiTokenAmount.uiAmount - account.uiTokenAmount.uiAmount);
                return (
                    <tr key={i+1} className="bg-white border-b bg-zinc-800 dark:border-zinc-700">
                        <td className="px-6 py-3">{i+1}</td>
                        <td className="px-6 py-3">{account.owner}</td>
                        <td className="px-6 py-3">{account.mint}</td>                        
                        <td className="px-6 py-3 text-center">{tokenChange === 0 ? '-' : tokenChange.toFixed(2)}</td>
                        <td className="px-6 py-3 text-center">{postTokenBalances[i].uiTokenAmount.uiAmount ? (postTokenBalances[i].uiTokenAmount.uiAmount).toFixed(2): '-'}</td>
                    </tr>)
                }
            ));
            let table = (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                {header}
                <tbody>{rows}</tbody>
            </table>);
            return(table)
        } 
        else {
            return(null)
        }
    }

    function buildProgramsTable() {
        if(transactionDetail) {
            const transactionInstructions = transactionDetail.transaction.message.instructions;
            let header = 
                <thead className="text-xs text-gray-700 uppercase bg-zinc-50 dark:bg-gray-700 dark:text-gray-400"><tr>
                    <td className="px-6 py-3">#</td>
                    <td className="px-6 py-3">Program</td>
                </tr></thead>;
                
            let rows = (transactionInstructions.map((instruction,i)=>{
                return (
                    <tr key={i+1} className="bg-white border-b bg-zinc-800 dark:border-zinc-700">
                        <td className="px-6 py-3">{i+1}</td>
                        <td className="px-6 py-3">{instruction.programId.toString() }</td>                        
                    </tr>)
                }
            ));
            let table = (
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                {header}
                <tbody>{rows}</tbody>
            </table>);
            return(table)
        } 
        else {
            return(null)
        }
    }

    return(<div>
    {/* Render Results Here */}
        <div>{transactionCard}</div>
    </div>) 
}