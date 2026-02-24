"use client";

import type { TableInfo } from "@/lib/types";
import Badge from "@/components/shared/Badge";
import Link from "next/link";

interface TableDetailProps {
  table: TableInfo;
}

function columnTypeColor(type: string): "blue" | "green" | "yellow" | "purple" | "default" {
  const t = type.toLowerCase();
  if (t.includes("int") || t.includes("float") || t.includes("decimal")) return "blue";
  if (t.includes("date") || t.includes("time")) return "green";
  if (t.includes("bool")) return "yellow";
  if (t.includes("array") || t.includes("map") || t.includes("tuple")) return "purple";
  return "default";
}

export default function TableDetail({ table }: TableDetailProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold font-mono">{table.name}</h2>
          {table.description && (
            <p className="text-sm text-foreground-medium mt-1">{table.description}</p>
          )}
        </div>
        <Link
          href={`/question/new?table=${table.name}`}
          className="btn-secondary text-xs"
        >
          Explore
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        {table.row_count !== undefined && (
          <div className="text-sm">
            <span className="text-foreground-light">Rows: </span>
            <span className="font-mono">{table.row_count.toLocaleString()}</span>
          </div>
        )}
        {table.sorting_key && (
          <div className="text-sm">
            <span className="text-foreground-light">Sort key: </span>
            <span className="font-mono text-xs">{table.sorting_key}</span>
          </div>
        )}
        {table.partition_key && (
          <div className="text-sm">
            <span className="text-foreground-light">Partition: </span>
            <span className="font-mono text-xs">{table.partition_key}</span>
          </div>
        )}
      </div>

      <div className="step-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="th-mono text-left">Column</th>
              <th className="th-mono text-left">Type</th>
              <th className="th-mono text-left">Nullable</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((col) => (
              <tr key={col.name} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-mono text-sm">{col.name}</td>
                <td className="px-4 py-2.5">
                  <Badge color={columnTypeColor(col.type)}>{col.type}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  {col.is_nullable && <Badge color="yellow">nullable</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
