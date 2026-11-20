const QUERY_KEYS = ["target", "limit", "offset", "sort_by", "order", "listed_only", "symbols"];

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const resource = query.get("resource");
  if (resource !== "/pools/detailed" && resource !== "/tokens" && resource !== "/prices") {
    return Response.json({ error: "Unsupported Aerodrome resource." }, { status: 400 });
  }

  const endpoint = process.env.QUICKNODE_ENDPOINT_URL;
  const token = process.env.QUICKNODE_ENDPOINT_TOKEN;
  if (!endpoint) {
    return Response.json({ error: "Aerodrome is not configured." }, { status: 503 });
  }

  try {
    const upstream = new URL(endpoint);
    upstream.pathname = `${upstream.pathname.replace(/\/+$/, "")}/addon/1051/v1${resource}`;
    upstream.search = "";
    for (const key of QUERY_KEYS) {
      for (const value of query.getAll(key)) upstream.searchParams.append(key, value);
    }

    const response = await fetch(upstream, {
      headers: token ? { "x-token": token } : {},
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (response.ok) return Response.json(await response.json());
  } catch {
    // Make transport and response errors available to the client without upstream details.
  }

  return Response.json({ error: "Aerodrome data is unavailable." }, { status: 502 });
}
