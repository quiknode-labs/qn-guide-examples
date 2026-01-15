import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { detectChainType, normalizeAddress } from '@/lib/utils'
import {
  addToKVList,
  checkKVListContains,
  getKVListKey,
  removeFromKVList,
} from '@/lib/quicknode'
import { updateUserDisplayName } from '@/lib/ens'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

type Candidate = {
  normalized: string
  chainType: 'EVM' | 'SOL'
  name?: string
}

export async function POST(request: NextRequest) {
  let body: { addresses?: string; defaultName?: string }

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON', 400)
  }

  const addressesInput = body.addresses?.trim()
  if (!addressesInput) {
    return jsonError('Missing addresses', 400)
  }

  // Parse line by line to support "Address, Label" format
  const lines = addressesInput.split(/\n+/);
  const failed: string[] = []
  const skipped: string[] = []
  const candidates: Candidate[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Split by first comma only
    const firstCommaIndex = trimmedLine.indexOf(',')
    let rawAddress: string
    let rawName: string | undefined

    if (firstCommaIndex !== -1) {
      rawAddress = trimmedLine.substring(0, firstCommaIndex).trim()
      const namePart = trimmedLine.substring(firstCommaIndex + 1).trim()
      if (namePart) rawName = namePart
    } else {
      rawAddress = trimmedLine
    }

    // Also handle space separation if no comma (fallback)
    if (!rawAddress) {
      // If empty after split, skip
      continue
    }

    let chainType = detectChainType(rawAddress)
    if (!chainType) {
      // Try splitting by space if comma check failed to find valid address
      const parts = trimmedLine.split(/\s+/)
      const possibleAddress = parts[0]
      if (detectChainType(possibleAddress)) {
        rawAddress = possibleAddress
        chainType = detectChainType(possibleAddress)
        // Join rest as name if not already set
        if (!rawName && parts.length > 1) {
          rawName = parts.slice(1).join(' ')
        }
      } else {
        failed.push(trimmedLine)
        continue
      }
    }

    if (!chainType) {
      failed.push(trimmedLine)
      continue
    }

    const normalized = normalizeAddress(rawAddress, chainType)
    if (seen.has(normalized)) {
      skipped.push(normalized)
      continue
    }

    seen.add(normalized)
    candidates.push({ normalized, chainType, name: rawName })
  }

  const existenceChecks = await Promise.all(
    candidates.map(async (candidate) => {
      const listKey = getKVListKey(candidate.chainType)
      const exists = await checkKVListContains(listKey, candidate.normalized)
      return { candidate, exists }
    })
  )

  const toAdd: Candidate[] = []
  for (const check of existenceChecks) {
    if (check.exists) {
      skipped.push(check.candidate.normalized)
    } else {
      toAdd.push(check.candidate)
    }
  }

  if (toAdd.length === 0) {
    return NextResponse.json({ added: [], skipped, failed })
  }

  const addedToKV: Candidate[] = []
  let kvFailed = false

  for (const candidate of toAdd) {
    try {
      const listKey = getKVListKey(candidate.chainType)
      await addToKVList(listKey, candidate.normalized)
      addedToKV.push(candidate)
    } catch (error) {
      console.error('KV Store add failed:', error)
      failed.push(candidate.normalized)
      kvFailed = true
    }
  }

  if (kvFailed) {
    await Promise.all(
      addedToKV.map((candidate) =>
        removeFromKVList(getKVListKey(candidate.chainType), candidate.normalized)
          .catch((error) => {
            console.error('KV Store rollback failed:', error)
          })
      )
    )
    const rolledBack = addedToKV.map((candidate) => candidate.normalized)
    const failedCombined = Array.from(new Set([...failed, ...rolledBack]))
    return NextResponse.json(
      { added: [], skipped, failed: failedCombined },
      { status: 502 }
    )
  }

  const baseName = body.defaultName?.trim() ?? 'Wallet'

  try {
    const createdUsers = await prisma.$transaction(
      addedToKV.map((candidate, index) => {
        // Use provided name (label), or baseName + index
        const name = candidate.name || `${baseName} ${index + 1}`
        return prisma.user.create({
          data: {
            name,
            walletAddress: candidate.normalized,
            chainType: candidate.chainType,
          },
        })
      })
    )

    for (const user of createdUsers) {
      if (user.chainType === 'EVM') {
        void updateUserDisplayName(user.id, user.walletAddress)
      }
    }

    return NextResponse.json(
      { added: createdUsers, skipped, failed },
      { status: 201 }
    )
  } catch (error) {
    await Promise.all(
      addedToKV.map((candidate) =>
        removeFromKVList(getKVListKey(candidate.chainType), candidate.normalized)
          .catch((cleanupError) => {
            console.error('KV Store cleanup failed:', cleanupError)
          })
      )
    )

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return jsonError('Address already exists', 409)
    }

    console.error('Bulk create failed:', error)
    return jsonError('Failed to create users', 500)
  }
}
