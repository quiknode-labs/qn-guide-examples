'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { detectChainType } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export function AddUserForm() {
  const { addUser, users } = useAppStore();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);

  // Single mode state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Bulk mode state
  const [bulkAddresses, setBulkAddresses] = useState('');

  // Validation
  const isValidSingle = useMemo(() => {
    if (!address) return true; // Empty is checking "required" on submit, or we can check here.
    // But let's only show error if typed and invalid.
    return !!detectChainType(address) || address.endsWith('.eth');
  }, [address]);

  const bulkStatus = useMemo(() => {
    if (!bulkAddresses.trim()) return { invalidCount: 0, isValid: false };

    const lines = bulkAddresses.split(/\n+/);
    let invalid = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Extract address part (before comma if any)
      const parts = trimmed.split(',');
      let addr = parts[0].trim();

      // Fallback space split if no comma
      if (!detectChainType(addr) && !addr.endsWith('.eth')) {
        const spaceParts = trimmed.split(/\s+/);
        addr = spaceParts[0];
      }

      if (!detectChainType(addr) && !addr.endsWith('.eth')) {
        invalid++;
      }
    }

    return { invalidCount: invalid, isValid: invalid === 0 };
  }, [bulkAddresses]);


  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidSingle) return;

    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, walletAddress: address }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // If JSON parse fails, generic error will be thrown based on res.ok
        console.error('Failed to parse response JSON:', parseError);
      }

      if (!res.ok) {
        const errorMessage = data?.error || `Error ${res.status}: Failed to add user`;
        throw new Error(errorMessage);
      }

      if (!data?.user) {
        throw new Error('Invalid server response');
      }

      addUser(data.user);
      setName('');
      setAddress('');
      toast.success('User added successfully');
    } catch (error: any) {
      console.error('Add user error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: bulkAddresses }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add users');
      }

      data.added.forEach((user: any) => addUser(user));

      const addedCount = data.added.length;
      const skippedCount = data.skipped.length;
      const failedCount = data.failed.length;

      if (addedCount > 0) toast.success(`Added ${addedCount} users`);
      if (skippedCount > 0) toast.info(`Skipped ${skippedCount} existing users`);
      if (failedCount > 0) toast.error(`Failed to add ${failedCount} users`);

      setBulkAddresses('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Add Monitored User</CardTitle>
          <div className="flex bg-muted/80 rounded-lg p-1 text-xs font-medium border border-border/60">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1 rounded-md transition-all ${mode === 'single' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Single
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`px-3 py-1 rounded-md transition-all ${mode === 'bulk' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Bulk
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input
                id="name"
                placeholder="e.g. Whale Wallet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={!isValidSingle && address ? "border-red-500 focus-visible:ring-red-500" : ""}
                required
              />
              {!isValidSingle && address && (
                <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Invalid EVM or Solana address</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={loading || !isValidSingle || !address}
            >
              {loading ? 'Adding...' : 'Monitor User'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-addresses">Wallet Addresses <span className="text-muted-foreground font-normal">(Address, Label)</span></Label>
              <Textarea
                id="bulk-addresses"
                placeholder={`0x123... , My Wallet\n0xabc...`}
                className={`min-h-[120px] font-mono text-sm ${bulkStatus.invalidCount > 0 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                value={bulkAddresses}
                onChange={(e) => setBulkAddresses(e.target.value)}
                required
              />
              {bulkStatus.invalidCount > 0 && (
                <div className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{bulkStatus.invalidCount} line(s) contain invalid addresses</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={loading || !bulkStatus.isValid || !bulkAddresses.trim()}
            >
              {loading ? 'Processing...' : 'Bulk Add Users'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
