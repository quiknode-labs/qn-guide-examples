import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Filter, Copy, InfoIcon } from "lucide-react";
import { useLiquidations } from "@/hooks/useLiquidations";
import { TablePagination } from "./TablePagination";
import { FiltersPanel } from "./FiltersPanel";
import { formatAddress, formatNumber, formatUSD, openEtherscan } from "@/lib/utils";
import { LiquidationFilters } from "@/types/liquidation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";





export function LiquidationsTable() {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState<LiquidationFilters>({});
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({ ...copyStatus, [text]: true });
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [text]: false });
      }, 200);
    });
  };



  const { data, isLoading, error } = useLiquidations({
    page,
    pageSize,
    filters,
  });

  if (error) {
    return <div className="text-destructive">Error loading liquidations</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Liquidations</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FiltersPanel filters={filters} onFiltersChange={setFilters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-md border">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Liquidator</TableHead>
                <TableHead>Liquidated Wallet</TableHead>
                <TableHead>Collateral Asset</TableHead>
                <TableHead>Collateral Amount</TableHead>
                <TableHead>Debt Asset</TableHead>
                <TableHead>Debt Amount</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Receive aToken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((event) => (
                  <TableRow key={event.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          {format(
                            new Date(event.timestamp),
                            "MMM d, yyyy HH:mm:ss"
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(event.timestamp), "PPPp")}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            openEtherscan("block", event.block_number)
                          }
                        >
                          #{event.block_number}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            openEtherscan("address", event.liquidator_address)
                          }
                        >
                          {formatAddress(event.liquidator_address)}
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className={`h-8 w-8 p-0 transition-colors ${
                            copyStatus[event.liquidator_address]
                              ? "text-green-500"
                              : ""
                          }`}
                          onClick={() =>
                            copyToClipboard(event.liquidator_address)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            openEtherscan("address", event.liquidated_wallet)
                          }
                        >
                          {formatAddress(event.liquidated_wallet)}
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className={`h-8 w-8 p-0 transition-colors ${
                            copyStatus[event.liquidated_wallet]
                              ? "text-green-500"
                              : ""
                          }`}
                          onClick={() =>
                            copyToClipboard(event.liquidated_wallet)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Collateral Asset */}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="w-fit p-2"
                          onClick={() =>
                            openEtherscan(
                              "address",
                              event.collateral_asset.address
                            )
                          }
                        >
                          {event.collateral_asset.symbol}
                        </Button>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            <InfoIcon className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Token: {event.collateral_asset.name}</p>
                            <p>Price: ${event.collateral_asset.price}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Collateral Amount */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {formatUSD(
                            event.collateral_asset.amount *
                              event.collateral_asset.price
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(event.collateral_asset.amount)}{" "}
                          {event.collateral_asset.symbol}
                        </span>
                      </div>
                    </TableCell>

                    {/* Debt Asset */}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="w-fit p-2"
                          onClick={() =>
                            openEtherscan("address", event.debt_asset.address)
                          }
                        >
                          {event.debt_asset.symbol}
                        </Button>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            <InfoIcon className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Token: {event.debt_asset.name}</p>
                            <p>Price: ${event.debt_asset.price}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Debt Amount */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {formatUSD(
                            event.debt_asset.amount * event.debt_asset.price
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(event.debt_asset.amount)}{" "}
                          {event.debt_asset.symbol}
                        </span>
                      </div>
                    </TableCell>

                    {/* Transaction */}
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            openEtherscan("tx", event.transaction_hash)
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className={`h-8 w-8 p-0 transition-colors ${
                            copyStatus[event.transaction_hash]
                              ? "text-green-500"
                              : ""
                          }`}
                          onClick={() =>
                            copyToClipboard(event.transaction_hash)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          event.receive_a_token
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {event.receive_a_token ? "Yes" : "No"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
      <TablePagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={data?.count ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
