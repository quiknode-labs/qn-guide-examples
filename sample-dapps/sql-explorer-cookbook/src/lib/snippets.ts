const DEFAULT_ENDPOINT = "https://api.quicknode.com/sql/rest/v1/query";
const DEFAULT_CLUSTER = "hyperliquid-core-mainnet";

interface SnippetOptions {
  sql: string;
  endpoint?: string;
  clusterId?: string;
}

export function generateCurl({
  sql,
  endpoint = DEFAULT_ENDPOINT,
  clusterId = DEFAULT_CLUSTER,
}: SnippetOptions): string {
  const singleLine = sql.replace(/\s+/g, " ").trim();
  const escaped = singleLine.replace(/'/g, "'\\''");
  return `curl -X POST '${endpoint}' \\
  -H 'x-api-key: YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "${escaped}",
    "clusterId": "${clusterId}"
  }'`;
}

export function generateTypeScript({
  sql,
  endpoint = DEFAULT_ENDPOINT,
  clusterId = DEFAULT_CLUSTER,
}: SnippetOptions): string {
  return `const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "x-api-key": "YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: \`${sql}\`,
    clusterId: "${clusterId}",
  }),
});

const data = await response.json();
console.log(data);`;
}

export function generatePython({
  sql,
  endpoint = DEFAULT_ENDPOINT,
  clusterId = DEFAULT_CLUSTER,
}: SnippetOptions): string {
  return `import requests

response = requests.post(
    "${endpoint}",
    headers={
        "x-api-key": "YOUR_API_KEY",
        "Content-Type": "application/json",
    },
    json={
        "query": """${sql}""",
        "clusterId": "${clusterId}",
    },
)

print(response.json())`;
}
