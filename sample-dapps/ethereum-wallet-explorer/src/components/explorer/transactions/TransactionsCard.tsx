import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "../../ui/card";
import { TransactionsTable, TransactionProps } from "./TransactionsTable";

const TransactionCard = ({ walletAddress }: TransactionProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0">
      <CardTitle className="text-sm font-medium">Transaction History</CardTitle>
    </CardHeader>
    <CardContent>
      <TransactionsTable walletAddress={walletAddress} />
    </CardContent>
  </Card>
);

export default TransactionCard;
