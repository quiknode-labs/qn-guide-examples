import { useWallet } from '@solana/wallet-adapter-react';
import CreatePlayerButton from './SendTransactionButtons/CreatePlayer';
import { useGame } from '@/utils/game/useGame';
import CreateGameButton from './SendTransactionButtons/CreateGame';
import GameList from './GameList';
import PlayerStats from './PlayerStats';
import Balance from './Balance';
import { shortenHash } from '@/utils/utils';


const Game = () => {
    const { connected, publicKey } = useWallet();
    const { activePlayer, refreshActivePlayer } = useGame();

    return (
        <div className="flex flex-col items-center justify-between px-4 md:px-24 py-8 md:py-24 ">
            <div className="md:w-full w-screen text-center">
                {!connected ? "Wallet Not Connected" :
                    !activePlayer ? (
                        <>
                            <Balance />
                            <CreatePlayerButton onSuccess={refreshActivePlayer} />
                        </>
                    ) : (
                        <div>
                            <div className="text-center w-11/12 max-w-xl mx-auto">
                                Connected to {shortenHash(publicKey?.toBase58() || "")}:
                                <PlayerStats player={activePlayer} />
                            </div>
                            <div className="mt-8 text-center w-11/12 max-w-xl mx-auto">
                                My Games:
                                <GameList player={publicKey} />
                                <div className="mt-4">
                                    <CreateGameButton />
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
    

}
export default Game;