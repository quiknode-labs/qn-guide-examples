const QN_API_BASE = 'https://api.quicknode.com/kv/rest/v1'

interface KVContainsResponse {
  exists?: boolean
}

function getApiKey() {
  const apiKey = process.env.QN_API_KEY
  if (!apiKey) {
    throw new Error('Missing QN_API_KEY')
  }
  return apiKey
}

function normalizeItem(item: string, listKey: string) {
  if (listKey.endsWith('_sol')) {
    return item
  }
  return item.toLowerCase()
}

export async function addToKVList(
  listKey: string,
  item: string
): Promise<boolean> {
  const response = await fetch(
    `${QN_API_BASE}/lists/${encodeURIComponent(listKey)}/items`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
      },
      body: JSON.stringify({ item: normalizeItem(item, listKey) }),
    }
  )

  if (!response.ok) {
    throw new Error(`KV Store error: ${response.status}`)
  }

  return true
}

export async function removeFromKVList(
  listKey: string,
  item: string
): Promise<boolean> {
  const normalizedItem = normalizeItem(item, listKey)
  const response = await fetch(
    `${QN_API_BASE}/lists/${encodeURIComponent(listKey)}/items/${encodeURIComponent(
      normalizedItem
    )}`,
    {
      method: 'DELETE',
      headers: {
        'x-api-key': getApiKey(),
      },
    }
  )

  return response.ok
}

export async function checkKVListContains(
  listKey: string,
  item: string
): Promise<boolean> {
  const normalizedItem = normalizeItem(item, listKey)
  const response = await fetch(
    `${QN_API_BASE}/lists/${encodeURIComponent(listKey)}/contains/${encodeURIComponent(
      normalizedItem
    )}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': getApiKey(),
      },
    }
  )

  if (!response.ok) return false

  const data: KVContainsResponse = await response.json()
  return data.exists ?? false
}

export async function createKVList(
  listKey: string,
  initialItems: string[] = []
): Promise<boolean> {
  const response = await fetch(`${QN_API_BASE}/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
    },
    body: JSON.stringify({
      key: listKey,
      items: initialItems.map((item) => normalizeItem(item, listKey)),
    }),
  })

  return response.ok
}

export function getKVListKey(chainType: 'EVM' | 'SOL'): string {
  return chainType === 'EVM'
    ? 'userstream_monitored_users_evm'
    : 'userstream_monitored_users_sol'
}
