import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import NftRow, { NftProps } from "./NftRow";


const NftCard = ({ walletAddress }: NftProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0">
      <CardTitle className="text-sm font-medium">NFTs</CardTitle>
    </CardHeader>
    <CardContent>
      <NftRow walletAddress={walletAddress} />
    </CardContent>
  </Card>
);

export default NftCard;
