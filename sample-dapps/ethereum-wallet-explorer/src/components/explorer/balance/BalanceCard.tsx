

import React from 'react'
import { Card, CardHeader, CardContent } from "../../ui/card"
import Balance, { BalanceProps } from "./Balance";

const BalanceCard = ({ walletAddress }: BalanceProps) => (
    <Card>
        <CardHeader>
            <span className="hidden sm:inline">{walletAddress}</span>
            <span className="sm:hidden">{abbreviateAddress(walletAddress)}</span>
        </CardHeader>
        <CardContent>
            <Balance walletAddress={walletAddress} />
        </CardContent>
    </Card>
);

export default BalanceCard;

function abbreviateAddress(address: string, startLength = 4, endLength = 4) {
    if (address.length <= startLength + endLength) {
        return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
