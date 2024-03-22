import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "../../ui/card";
import { TokensTable, TokenProps } from "./TokensTable";

const TokenCard = ({ walletAddress }: TokenProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0">
      <CardTitle className="text-sm font-medium">Tokens in Wallet (ERC-20)</CardTitle>
    </CardHeader>
    <CardContent>
      <TokensTable walletAddress={walletAddress} />
    </CardContent>
  </Card>
);

export default TokenCard;
