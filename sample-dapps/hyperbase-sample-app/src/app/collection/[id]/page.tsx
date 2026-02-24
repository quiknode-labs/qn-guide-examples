"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { Question, Dashboard } from "@/lib/types";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Badge from "@/components/shared/Badge";

export default function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/questions").then((r) => r.json()),
      fetch("/api/dashboards").then((r) => r.json()),
    ])
      .then(([q, d]) => {
        setQuestions(Array.isArray(q) ? q : []);
        setDashboards(Array.isArray(d) ? d : []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="h-64" />;

  // Filter by collection (root shows all for now)
  const collectionId = id === "root" ? null : parseInt(id);
  const filteredQuestions = collectionId
    ? questions.filter((q) => q.collection_id === collectionId)
    : questions;
  const filteredDashboards = collectionId
    ? dashboards.filter((d) => d.collection_id === collectionId)
    : dashboards;

  const isEmpty = filteredQuestions.length === 0 && filteredDashboards.length === 0;

  return (
    <div className="p-6">
      <div className="label-mono mb-6">// {id === "root" ? "Our Analytics" : `Collection #${id}`}</div>

      {isEmpty ? (
        <div className="text-center py-20">
          <div className="text-foreground-light mb-4">No saved items yet</div>
          <div className="flex justify-center gap-3">
            <Link href="/question/new" className="btn-primary text-sm">
              New Question
            </Link>
            <Link href="/dashboard/new" className="btn-secondary text-sm">
              New Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDashboards.map((d) => (
            <Link key={`d-${d.id}`} href={`/dashboard/${d.id}`} className="card p-4 hover:bg-grid transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Badge color="purple">Dashboard</Badge>
              </div>
              <div className="font-semibold text-sm">{d.name}</div>
              {d.description && (
                <div className="text-xs text-foreground-medium mt-1 line-clamp-2">{d.description}</div>
              )}
              <div className="text-[10px] text-foreground-light mt-2 font-mono">
                {new Date(d.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
          {filteredQuestions.map((q) => (
            <Link key={`q-${q.id}`} href={`/question/${q.id}`} className="card p-4 hover:bg-grid transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Badge color="green">{q.viz_type}</Badge>
                <Badge>{q.query_type}</Badge>
              </div>
              <div className="font-semibold text-sm">{q.name}</div>
              {q.description && (
                <div className="text-xs text-foreground-medium mt-1 line-clamp-2">{q.description}</div>
              )}
              <div className="text-[10px] text-foreground-light mt-2 font-mono">
                {new Date(q.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
