'use client';

import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, ArrowDownLeft, ArrowUpRight, Box } from 'lucide-react';
import {
  formatTimestamp,
  getExplorerBlockUrl,
  getExplorerTxUrl,
  truncateAddress,
  cn
} from '@/lib/utils';
import Link from 'next/link';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function ActivityItem({ activity }: { activity: any }) {
  const details = typeof activity.details === 'string'
    ? JSON.parse(activity.details)
    : activity.details;

  const isIn = activity.direction === 'in';
  const amountFormatted =
    typeof details.amountFormatted === 'string' ? details.amountFormatted : '';

  // Format amount based on event type
  let amountDisplay = '';
  if (activity.activityType === 'ERC20TRANSFER' && details.token) {
    amountDisplay = `${amountFormatted} ${details.token.symbol}`;
  } else if (activity.activityType === 'NATIVETRANSFER') {
    amountDisplay = `${amountFormatted} ETH`; // Assuming ETH/Native
  } else if (activity.activityType === 'SOLTRANSFER') {
    amountDisplay = `${amountFormatted} SOL`;
  } else if (activity.activityType === 'SPLTRANSFER') {
    const tokenSymbol = details.token?.symbol
      || (typeof details.mint === 'string' ? truncateAddress(details.mint) : 'SPL');
    amountDisplay = `${amountFormatted} ${tokenSymbol}`;
  }

  // Chain badge color
  const getChainColor = (chain: string) => {
    if (chain.includes('ethereum')) return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30';
    if (chain.includes('polygon')) return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
    if (chain.includes('base')) return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40';
    if (chain.includes('solana')) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
    return 'bg-muted text-muted-foreground border-border/60';
  };

  const fromAddress = typeof details.from === 'string' ? details.from : null;
  const toAddress = typeof details.to === 'string' ? details.to : null;
  const counterparty = isIn ? fromAddress : toAddress;
  const blockRef = details.blockNumber ?? details.slot;
  const hasBlockRef = blockRef !== undefined && blockRef !== null;
  const blockLabel = details.slot ? `Slot ${details.slot}` : `Block ${details.blockNumber}`;

  return (
    <div className="flex gap-4 p-4 rounded-lg border border-border/60 bg-card/80 hover:border-border hover:shadow-sm transition-all group">
      {/* Icon Column */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        isIn ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-orange-500/15 text-orange-500 dark:text-orange-300"
      )}>
        {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">
              {isIn ? 'Received' : 'Sent'} {amountDisplay}
            </span>
            <Badge variant="outline" className={cn("text-[10px] uppercase", getChainColor(activity.chain))}>
              {activity.chain.split('-')[0]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(new Date(activity.timestamp))}</span>
            <span>•</span>
            <span>{formatTimestamp(new Date(activity.timestamp))}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-xs">User:</span>
            <span className="font-medium text-foreground">
              {activity.user?.name || 'Unknown'}
            </span>
          </div>

          <span className="text-muted-foreground/50">•</span>

          <div className="flex items-center gap-1">
            <span className="text-xs">{isIn ? 'From:' : 'To:'}</span>
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              {counterparty ? truncateAddress(counterparty) : 'Unknown'}
            </span>
          </div>

          <Link
            href={getExplorerTxUrl(activity.chain, activity.txHash)}
            target="_blank"
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
          </Link>

          {hasBlockRef && (
            <div className="flex items-center gap-1 ml-2">
              <Box className="w-3 h-3 text-muted-foreground/60" />
              <Link
                href={getExplorerBlockUrl(activity.chain, blockRef)}
                target="_blank"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline"
              >
                ({blockLabel})
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const { activities } = useAppStore();

  return (
    <Card className="shadow-sm h-full min-h-[500px] flex flex-col bg-card/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
            Live Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/activity">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent font-normal">
                View All
              </Badge>
            </Link>
            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
              {activities.length} Events
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-8 h-8 text-muted-foreground/70" />
                </div>
                <h3 className="font-medium mb-1">No activity yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Transactions will appear here in real-time as they happen on-chain.
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <ActivityItem key={`${activity.id}-${activity.txHash}`} activity={activity} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
