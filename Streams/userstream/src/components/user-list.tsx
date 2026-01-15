'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Trash2, Pencil, Check, X, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { truncateAddress } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function UserList() {
  const { users, removeUser, setUsers } = useAppStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete user');
      }

      removeUser(id);
      toast.success('User removed');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditName(user.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });

      if (!res.ok) throw new Error('Failed to update');

      const data = await res.json();

      // Update local store
      setUsers(users.map(u => u.id === id ? { ...u, name: data.user.name } : u));

      setEditingId(null);
      toast.success('Label updated');
    } catch (error) {
      toast.error('Failed to update label');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied');
  };

  return (
    <Card className="shadow-sm h-[500px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Monitored Users</CardTitle>
          <Badge variant="secondary" className="rounded-full bg-muted text-muted-foreground">
            {users.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No users monitored yet.
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 group p-3 rounded-lg border border-border/60 bg-card/70 hover:border-border hover:shadow-sm transition-all"
                >
                  <div className="min-w-0">
                    {editingId === user.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(user.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate pr-2" title={user.name}>
                          {user.name}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-4 px-1 rounded-sm shrink-0 uppercase border ${user.chainType === 'EVM'
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          }`}
                      >
                        {user.chainType}
                      </Badge>
                      <span className="font-mono truncate" title={user.walletAddress}>
                        {user.displayName ? user.displayName : truncateAddress(user.walletAddress)}
                      </span>
                      <button
                        onClick={() => handleCopy(user.walletAddress)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Address"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId === user.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0"
                          onClick={() => saveEdit(user.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-sky-400 hover:bg-sky-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0"
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                        >
                          {deletingId === user.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
