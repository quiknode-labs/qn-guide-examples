import { MetadataCache } from './cache'

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud'
const IPFS_GATEWAY_TOKEN = process.env.NEXT_PUBLIC_IPFS_GATEWAY_TOKEN

if (!PINATA_JWT) {
  console.warn('Pinata JWT not found. IPFS uploads will fail.')
}

const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (attempt >= RETRY_CONFIG.maxAttempts) {
      console.error(`[IPFS] ${context} - All ${RETRY_CONFIG.maxAttempts} attempts failed`)
      throw error
    }

    const delay = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
      RETRY_CONFIG.maxDelay
    )
    console.warn(
      `[IPFS] ${context} - Attempt ${attempt} failed, retrying in ${delay}ms...`,
      error instanceof Error ? error.message : error
    )
    await sleep(delay)
    return retryWithBackoff(fn, context, attempt + 1)
  }
}

export interface NFTAttribute {
  trait_type: string
  value: string | number
}

export interface NFTLocation {
  lat: number
  lng: number
  formatted_address: string
  place_id?: string // Optional Google Maps place ID for reference
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
  location?: NFTLocation // Optional location data
  external_url?: string // Optional external URL for the asset
}

export async function uploadImageToIPFS(file: File): Promise<string> {
  console.log('[IPFS] uploadImageToIPFS called for file:', file.name, `(${file.size} bytes)`)

  if (!PINATA_JWT) {
    console.error('[IPFS] Pinata JWT not configured')
    throw new Error('Pinata JWT not configured. Please set NEXT_PUBLIC_PINATA_JWT')
  }

  return retryWithBackoff(async () => {
    const formData = new FormData()
    formData.append('file', file)

    const metadata = JSON.stringify({
      name: file.name,
    })
    formData.append('pinataMetadata', metadata)

    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append('pinataOptions', options)

    console.log('[IPFS] Sending request to Pinata API...')

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    console.log('[IPFS] Pinata response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[IPFS] Pinata error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Failed to upload image to IPFS (${response.status}): ${errorText.substring(0, 200)}`)
    }

    const data = await response.json()
    console.log('[IPFS] Pinata response data:', data)

    if (!data.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata')
    }

    const ipfsUri = `ipfs://${data.IpfsHash}`
    console.log('[IPFS] Image uploaded successfully, IPFS URI:', ipfsUri)

    return ipfsUri
  }, `Upload image ${file.name}`)
}

export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  console.log('[IPFS] uploadMetadataToIPFS called for:', metadata.name)

  if (!PINATA_JWT) {
    console.error('[IPFS] Pinata JWT not configured')
    throw new Error('Pinata JWT not configured. Please set NEXT_PUBLIC_PINATA_JWT')
  }

  const requestBody = {
    pinataContent: metadata,
    pinataMetadata: {
      name: `${metadata.name}-metadata.json`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  }

  console.log('[IPFS] Sending metadata to Pinata API...', requestBody)

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify(requestBody),
  })

  console.log('[IPFS] Pinata metadata response status:', response.status)

  if (!response.ok) {
    const error = await response.text()
    console.error('[IPFS] Pinata metadata error response:', error)
    throw new Error(`Failed to upload metadata to IPFS: ${error}`)
  }

  const data = await response.json()
  console.log('[IPFS] Pinata metadata response data:', data)

  const ipfsUri = `ipfs://${data.IpfsHash}`
  console.log('[IPFS] Metadata uploaded, IPFS URI:', ipfsUri)

  return ipfsUri
}

export function getIPFSGatewayUrl(ipfsUrl: string): string {
  console.log('[IPFS] getIPFSGatewayUrl called with:', ipfsUrl)

  if (!ipfsUrl.startsWith('ipfs://')) {
    console.log('[IPFS] Not an IPFS URL, returning as-is:', ipfsUrl)
    return ipfsUrl
  }

  const cid = ipfsUrl.replace('ipfs://', '')
  const gatewayUrl = `https://ipfs.io/ipfs/${cid}`
  console.log('[IPFS] Converted to gateway URL:', gatewayUrl)

  return gatewayUrl
}

export function getIPFSGatewayHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  }

  if (IPFS_GATEWAY_TOKEN && PINATA_GATEWAY.includes('quicknode')) {
    console.log('[IPFS] Adding Quicknode gateway authentication')
    headers['x-api-key'] = IPFS_GATEWAY_TOKEN
  }

  return headers
}

export async function fetchFromIPFS(ipfsUrl: string): Promise<NFTMetadata> {
  console.log('[IPFS] fetchFromIPFS called with:', ipfsUrl)

  // Check cache first
  const cached = MetadataCache.get(ipfsUrl)
  if (cached) {
    console.log('[IPFS] Returning cached metadata')
    return cached
  }

  const cid = ipfsUrl.replace('ipfs://', '')

  const gateways = [
    {
      url: `https://${PINATA_GATEWAY}/ipfs/${cid}`,
      headers: getIPFSGatewayHeaders(),
      name: 'Primary (Quicknode/Pinata)',
    },
    {
      url: `https://ipfs.io/ipfs/${cid}`,
      headers: { 'Accept': 'application/json' },
      name: 'ipfs.io',
    },
    {
      url: `https://dweb.link/ipfs/${cid}`,
      headers: { 'Accept': 'application/json' },
      name: 'dweb.link',
    },
    {
      url: `https://cloudflare-ipfs.com/ipfs/${cid}`,
      headers: { 'Accept': 'application/json' },
      name: 'cloudflare-ipfs.com',
    },
  ]

  let lastError: Error | null = null

  for (const gateway of gateways) {
    try {
      console.log(`[IPFS] Trying gateway: ${gateway.name} - ${gateway.url}`)

      const response = await fetch(gateway.url, {
        method: 'GET',
        headers: gateway.headers,
        mode: 'cors',
      })

      console.log(`[IPFS] Gateway ${gateway.name} response status:`, response.status)

      if (response.ok) {
        const text = await response.text()
        console.log(`[IPFS] Successfully fetched from ${gateway.name}, size: ${text.length} bytes`)
        const data = JSON.parse(text)
        console.log('[IPFS] Parsed metadata:', data)

        // Cache the metadata
        MetadataCache.set(ipfsUrl, data)

        return data
      } else {
        const errorText = await response.text()
        console.warn(`[IPFS] Gateway ${gateway.name} failed with status ${response.status}:`, errorText.substring(0, 200))
        lastError = new Error(`Gateway ${gateway.name} returned status ${response.status}`)
      }
    } catch (error) {
      console.error(`[IPFS] Gateway ${gateway.name} error:`, {
        name: (error as Error).name,
        message: (error as Error).message,
      })
      lastError = error as Error
    }
  }

  console.error('[IPFS] All gateways failed')
  throw lastError || new Error('Failed to fetch from all IPFS gateways')
}
