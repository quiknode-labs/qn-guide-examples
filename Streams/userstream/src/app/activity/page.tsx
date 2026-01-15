
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    formatTimestamp,
    getExplorerBlockUrl,
    getExplorerTxUrl,
    truncateAddress,
    cn
} from '@/lib/utils';
import { ArrowRightLeft, ArrowDownLeft, ArrowUpRight, ExternalLink, Box } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Force dynamic since we're fetching data
export const dynamic = 'force-dynamic';

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);
}

function HistoryItem({ activity }: { activity: any }) {
    const details = typeof activity.details === 'string'
        ? JSON.parse(activity.details)
        : activity.details;

    const isIn = activity.direction === 'in';
    const amountFormatted =
        typeof details.amountFormatted === 'string' ? details.amountFormatted : '';

    let amountDisplay = '';
    if (activity.activityType === 'ERC20TRANSFER' && details.token) {
        amountDisplay = `${amountFormatted} ${details.token.symbol}`;
    } else if (activity.activityType === 'NATIVETRANSFER') {
        amountDisplay = `${amountFormatted} ETH`;
    } else if (activity.activityType === 'SOLTRANSFER') {
        amountDisplay = `${amountFormatted} SOL`;
    } else if (activity.activityType === 'SPLTRANSFER') {
        const tokenSymbol = details.token?.symbol
            || (typeof details.mint === 'string' ? truncateAddress(details.mint) : 'SPL');
        amountDisplay = `${amountFormatted} ${tokenSymbol}`;
    }

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
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border/60 bg-card/80 hover:border-border hover:shadow-sm transition-all">
            <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                isIn ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-orange-500/15 text-orange-500 dark:text-orange-300"
            )}>
                {isIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
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

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <span className="text-xs">User:</span>
                        <span className="font-medium text-foreground">
                            {activity.user?.name || 'Unknown'}
                        </span>
                    </div>

                    <span className="hidden sm:inline text-muted-foreground/50">•</span>

                    <div className="flex items-center gap-1">
                        <span className="text-xs">{isIn ? 'From:' : 'To:'}</span>
                        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                            {counterparty ? truncateAddress(counterparty) : 'Unknown'}
                        </span>
                    </div>

                    <span className="hidden sm:inline text-muted-foreground/50">•</span>

                    <Link
                        href={getExplorerTxUrl(activity.chain, activity.txHash)}
                        target="_blank"
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="text-xs">Tx</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>

                    {hasBlockRef && (
                        <>
                            <span className="hidden sm:inline text-muted-foreground/50">•</span>
                            <Link
                                href={getExplorerBlockUrl(activity.chain, blockRef)}
                                target="_blank"
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors hover:underline"
                            >
                                <Box className="w-3 h-3" />
                                <span className="text-xs">{blockLabel}</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default async function ActivityPage(props: {
    searchParams: Promise<{ page?: string }>
}) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page) || 1;
    const pageSize = 10;

    const [activities, totalCount] = await Promise.all([
        prisma.activityLog.findMany({
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy: { timestamp: 'desc' },
            include: { user: true },
        }),
        prisma.activityLog.count(),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <main className="min-h-screen bg-background text-foreground dot-grid">
            <div className="container mx-auto p-4 lg:p-8 max-w-4xl">
                <header className="mb-8">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-semibold tracking-tight mb-2">
                        Activity History
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Full history of monitored user streams
                    </p>
                </header>

                <Card className="shadow-sm bg-card/70 backdrop-blur-sm border-border/60">
                    <CardHeader className="border-b border-border/60 bg-card/80">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                                All Activities
                            </CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Total: {totalCount} events
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activities.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ArrowRightLeft className="w-8 h-8 text-muted-foreground/70" />
                                </div>
                                <h3 className="font-medium mb-1">No activity recorded</h3>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="p-2">
                                        <HistoryItem activity={activity} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-border/60 flex items-center justify-between bg-card/70">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    asChild={page > 1}
                                >
                                    {page > 1 ? (
                                        <Link href={`/activity?page=${page - 1}`}>Previous</Link>
                                    ) : (
                                        <span>Previous</span>
                                    )}

                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    asChild={page < totalPages}
                                >
                                    {page < totalPages ? (
                                        <Link href={`/activity?page=${page + 1}`}>Next</Link>
                                    ) : (
                                        <span>Next</span>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
