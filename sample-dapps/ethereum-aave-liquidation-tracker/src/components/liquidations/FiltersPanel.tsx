import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LiquidationFilters } from '@/types/liquidation';

// TODO: Fetch this assets from DB
const SUPPORTED_ASSETS = [
  'WETH',
  'WBTC',
  'USDC',
  'USDT',
  'DAI',
  'AAVE',
  'LINK',
];

interface FiltersPanelProps {
  filters: LiquidationFilters;
  onFiltersChange: (filters: LiquidationFilters) => void;
}

export function FiltersPanel({ filters, onFiltersChange }: FiltersPanelProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateRange?.[0]
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(filters.dateRange?.[1]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    filters.assets || []
  );
  const [addresses, setAddresses] = useState<string>(
    filters.addresses?.join('\n') || ''
  );

  const handleApplyFilters = () => {
    const newFilters: LiquidationFilters = {};

    if (dateFrom && dateTo) {
      newFilters.dateRange = [dateFrom, dateTo];
    }

    if (selectedAssets.length > 0) {
      newFilters.assets = selectedAssets;
    }

    if (addresses.trim()) {
      newFilters.addresses = addresses
        .split('\n')
        .map((addr) => addr.trim())
        .filter(Boolean);
    }

    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedAssets([]);
    setAddresses('');
    onFiltersChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[200px] justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : 'From date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[200px] justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : 'To date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Assets</Label>
          <Select
            value={selectedAssets[0] || ''}
            onValueChange={(value) =>
              setSelectedAssets((prev) =>
                prev.includes(value)
                  ? prev.filter((v) => v !== value)
                  : [...prev, value]
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assets" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_ASSETS.map((asset) => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {selectedAssets.map((asset) => (
              <div
                key={asset}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
              >
                {asset}
                <button
                  onClick={() =>
                    setSelectedAssets((prev) =>
                      prev.filter((a) => a !== asset)
                    )
                  }
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Addresses (one per line)</Label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0x..."
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
      </CardFooter>
    </Card>
  );
}