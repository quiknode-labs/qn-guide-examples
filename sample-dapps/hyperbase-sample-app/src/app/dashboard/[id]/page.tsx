"use client";

import { useState, useEffect, useCallback, use } from "react";
import type { Dashboard, DashboardCard } from "@/lib/types";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import AddCardModal from "@/components/dashboard/AddCardModal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Link from "next/link";

export default function DashboardViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/dashboards/${id}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load dashboard");
      const { cards: c, ...d } = data;
      setDashboard(d as Dashboard);
      setCards(c || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const addQuestionCard = async (questionId: number) => {
    const maxY = cards.reduce((max, c) => Math.max(max, c.pos_y + c.height), 0);
    try {
      const res = await fetch("/api/dashboard-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboard_id: parseInt(id),
          question_id: questionId,
          pos_x: 0,
          pos_y: maxY,
          width: 6,
          height: 4,
          card_type: "question",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to add card");
      setCards((prev) => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  const addTextCard = async (type: "text" | "heading") => {
    const maxY = cards.reduce((max, c) => Math.max(max, c.pos_y + c.height), 0);
    try {
      const res = await fetch("/api/dashboard-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboard_id: parseInt(id),
          pos_x: 0,
          pos_y: maxY,
          width: 12,
          height: type === "heading" ? 1 : 2,
          card_type: type,
          text_content: type === "heading" ? "Heading" : "",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to add card");
      setCards((prev) => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  const removeCard = async (cardId: number) => {
    try {
      const res = await fetch(`/api/dashboard-cards?id=${cardId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove card");
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove card");
    }
  };

  const handleLayoutChange = async (updates: Array<{ id: number; pos_x: number; pos_y: number; width: number; height: number }>) => {
    setCards((prev) =>
      prev.map((card) => {
        const u = updates.find((u) => u.id === card.id);
        return u ? { ...card, pos_x: u.pos_x, pos_y: u.pos_y, width: u.width, height: u.height } : card;
      })
    );
    try {
      const res = await fetch("/api/dashboard-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: updates }),
      });
      if (!res.ok) throw new Error("Failed to save layout");
    } catch {
      loadDashboard();
    }
  };

  const saveDashboard = async () => {
    if (!dashboard) return;
    try {
      const res = await fetch(`/api/dashboards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dashboard.name, description: dashboard.description }),
      });
      if (!res.ok) throw new Error("Failed to save dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setEditing(false);
  };

  if (loading) return <LoadingSpinner className="h-64" />;
  if (error && !dashboard) return <div className="p-8 text-qn-red font-mono">{error}</div>;
  if (!dashboard) return <div className="p-8 text-qn-red">Dashboard not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3 flex-1 mr-4">
          <Link href="/collection/root" className="flex items-center justify-center w-7 h-7 rounded-md text-foreground-light hover:text-foreground hover:bg-grid transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,3 5,8 10,13" /></svg>
          </Link>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={dashboard.name}
                onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
                className="text-lg font-semibold bg-transparent outline-none border-b border-accent w-full"
                placeholder="Dashboard name..."
              />
            ) : (
              <h1 className="text-lg font-semibold">{dashboard.name}</h1>
            )}
            {dashboard.description && !editing && (
              <p className="text-xs text-foreground-medium">{dashboard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <button onClick={() => setAddOpen(true)} className="btn-secondary text-xs">
              + Add Card
            </button>
          )}
          <button
            onClick={editing ? saveDashboard : () => setEditing(true)}
            className={editing ? "btn-primary h-9 text-xs px-4" : "btn-secondary text-xs"}
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-6 py-2 bg-qn-red/10 text-qn-red text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 hover:underline">dismiss</button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        <DashboardGrid
          cards={cards}
          editing={editing}
          onLayoutChange={handleLayoutChange}
          onRemoveCard={removeCard}
          onAddCard={() => setAddOpen(true)}
        />
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAddQuestion={addQuestionCard}
        onAddText={addTextCard}
      />
    </div>
  );
}
