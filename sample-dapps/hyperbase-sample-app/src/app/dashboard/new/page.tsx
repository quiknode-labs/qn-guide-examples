"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create dashboard");
      }
      router.push(`/dashboard/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dashboard");
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="label-mono mb-6">// New Dashboard</div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-foreground-light block mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-ring w-full"
            placeholder="My Dashboard"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <div>
          <label className="text-xs text-foreground-light block mb-1">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-ring w-full"
            placeholder="What does this dashboard track?"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        {error && (
          <div className="text-xs text-qn-red font-mono">{error}</div>
        )}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="btn-primary"
        >
          {creating ? "Creating..." : "Create Dashboard"}
        </button>
      </div>
    </div>
  );
}
