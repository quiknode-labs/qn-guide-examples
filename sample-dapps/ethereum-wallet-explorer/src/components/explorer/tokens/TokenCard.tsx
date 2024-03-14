import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "../../ui/card";
import TokenTable, { TokenProps } from "./TokenTable";


const TokenCard = ({ walletAddress }: TokenProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0">
      <CardTitle className="text-sm font-medium">Tokens</CardTitle>
    </CardHeader>
    <CardContent>
      <TokenTable walletAddress={walletAddress} />
    </CardContent>
  </Card>
);

export default TokenCard;
