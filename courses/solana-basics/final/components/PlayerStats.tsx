import { PlayerInfo } from "@/utils/game/types";
import ClaimRewardButton from "./SendTransactionButtons/ClaimReward";

interface Props {
    player: PlayerInfo;
}

const PlayerStats = ({ player }: Props) => {
    const { record, playerTokenBalance, rewardClaimed } = player;

    return (
        <div className="overflow-x-auto mt-4 text-center ">
            <table className="w-full text-white table-auto">
                <tbody>
                    {record.wins >= 1 && !rewardClaimed && <tr key={'prize'} className={`bg-gray-800 border-b border-gray-700 bg-opacity-50`}>
                        <td className="px-4 py-2" colSpan={2}>
                            <ClaimRewardButton />
                        </td>
                    </tr>}
                    <tr key={'wins'} className={`bg-gray-800 border-b border-gray-700 bg-opacity-50`}>
                        <td className="px-4 py-2">Wins</td>
                        <td className="px-4 py-2">
                            {record.wins.toString()}
                        </td>
                    </tr>

                    <tr key={'loses'} className={`bg-gray-800 border-b border-gray-700`}>
                        <td className="px-4 py-2">Loses</td>
                        <td className="px-4 py-2">{record.losses.toString()}</td>
                    </tr>
                    <tr key={'ties'} className={`bg-gray-800 border-b border-gray-700 bg-opacity-50`}>
                        <td className="px-4 py-2">Ties</td>
                        <td className="px-4 py-2">{record.ties.toString()}</td>
                    </tr>
                    <tr key={'tokens'} className={`bg-gray-800 border-b border-gray-700`}>
                        <td className="px-4 py-2">Play Tokens Remaining</td>
                        <td className="px-4 py-2">{playerTokenBalance}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default PlayerStats;
