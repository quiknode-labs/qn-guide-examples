import SchemaExplorer from "@/components/schema/SchemaExplorer";

export default function SchemaPage() {
  return (
    <div className="p-4">
      <div className="label-mono mb-4 px-2">// Schema Browser</div>
      <SchemaExplorer />
    </div>
  );
}
