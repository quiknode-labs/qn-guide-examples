'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { AddUserForm } from '@/components/add-user-form';
import { UserList } from '@/components/user-list';
import { ActivityFeed } from '@/components/activity-feed';
import { ConnectionStatus } from '@/components/connection-status';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';

export default function Home() {
  const { setUsers, addActivity, setConnected } = useAppStore();

  // Fetch initial data
  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setUsers(d.users);
      })
      .catch(console.error);
  }, [setUsers]);

  // Connect to SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/sse');

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'activity') {
          // Ensure timestamp is a Date object if needed, but store usually handles simple JSON objects
          // If the store expects Date objects for timestamps, we might need conversion.
          // The ActivityLog interface in types/index.ts says `timestamp: Date`.
          // JSON.parse will produce a string for timestamp.
          // However, we can handle it in the component or convert it here.
          // Let's rely on the component using `new Date(activity.timestamp)` which works for strings too.
          addActivity(message.data);
        } else if (message.type === 'connected') {
          setConnected(true);
        }
      } catch (e) {
        console.error('SSE Error:', e);
      }
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [addActivity, setConnected]);

  return (
    <main className="min-h-screen bg-background text-foreground dot-grid">
      <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-1">
              <span className="text-foreground">User</span>
              <span className="text-primary">Stream</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time user activity monitoring{" "}
              <Link
                href="https://www.quicknode.com/streams"
                target="_blank"
                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                with Quicknode Streams
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-card/80 px-4 py-2 rounded-full border border-border/60 shadow-sm backdrop-blur">
              <ConnectionStatus />
            </div>
            <ModeToggle />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-4 space-y-6">
            <AddUserForm />
            <UserList />
          </div>
          <div className="lg:col-span-8">
            <ActivityFeed />
          </div>
        </div>

        <footer className="text-center text-sm text-muted-foreground py-8 border-t border-border/60">
          <p>
            Open source example from{" "}
            <Link
              href="https://github.com/quiknode-labs/qn-guide-examples"
              target="_blank"
              className="text-foreground/70 hover:text-foreground transition-colors underline decoration-border/60 hover:decoration-primary"
            >
              Quicknode
            </Link>
          </p>
        </footer>
      </div >
    </main >
  );
}
