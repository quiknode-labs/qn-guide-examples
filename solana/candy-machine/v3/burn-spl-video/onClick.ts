const onClick = (async () => {
    if (!publicKey) {
        console.log('error', 'Wallet not connected!');
        notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
        return;
    }
    console.log('click');
    let signature: TransactionSignature = '';
    let METAPLEX = Metaplex.make(connection).use(walletAdapterIdentity(walletAdapter));
    let candyMachine = await METAPLEX.candyMachines().findByAddress({address: new PublicKey('YOUR_CANDY_MACHINE_ID')})
    try {
        const txBuilder = await METAPLEX.candyMachines().builders().mint({
            candyMachine,
            collectionUpdateAuthority: new PublicKey('YOUR_UPDATE_AUTHORITY')
        })
        const blockhash = await METAPLEX.rpc().getLatestBlockhash();
        let tx = txBuilder.toTransaction(blockhash);
        let {signature, confirmResponse } = await METAPLEX.rpc().sendAndConfirmTransaction(txBuilder, { commitment: 'finalized' });
        notify({ type: 'success', message: 'Mint successful!', txid: signature });
    } catch (error: any) {
        console.log(error);
    }
});