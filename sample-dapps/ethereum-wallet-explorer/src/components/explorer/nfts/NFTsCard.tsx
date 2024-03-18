import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "../../ui/card";
import { NFTsTable, NFTProps } from "./NFTsTable";

const TransactionCard = ({ walletAddress }: NFTProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0">
      <CardTitle className="text-sm font-medium">NFTs in Wallet (ERC-721 & ERC-1155)</CardTitle>
    </CardHeader>
    <CardContent>
      <NFTsTable walletAddress={walletAddress} />
    </CardContent>
  </Card>
);

export default TransactionCard;
