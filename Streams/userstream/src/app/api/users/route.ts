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
import { updateUserDisplayName, resolveEnsAddress } from '@/lib/ens'

export const runtime = 'nodejs'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { activities: true } },
    },
  })

  const formatted = users.map(({ _count, ...user }) => ({
    ...user,
    activityCount: _count.activities,
  }))

  return NextResponse.json({ users: formatted })
}

export async function POST(request: NextRequest) {
  let body: { name?: string; walletAddress?: string }

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON', 400)
  }

  let name = body.name?.trim()
  let walletAddress = body.walletAddress?.trim()

  if (!walletAddress) {
    return jsonError('Missing walletAddress', 400)
  }

  // Handle ENS
  if (walletAddress.endsWith('.eth')) {
    const resolved = await resolveEnsAddress(walletAddress);
    if (!resolved) {
      return jsonError(`Could not resolve ENS: ${walletAddress}`, 400);
    }
    // If name is missing, use the ENS name as the Label for convenience
    if (!name) {
      name = walletAddress;
    }
    walletAddress = resolved;
  }

  // Auto-generate name if still missing
  if (!name) {
    const count = await prisma.user.count();
    name = `Wallet ${count + 1}`;
  }

  const chainType = detectChainType(walletAddress)
  if (!chainType) {
    return jsonError('Invalid wallet address', 400)
  }

  const normalizedAddress = normalizeAddress(walletAddress, chainType)

  // 1. Check local DB first (Fastest)
  const existingUser = await prisma.user.findFirst({
    where: { walletAddress: normalizedAddress }
  })

  if (existingUser) {
    return jsonError('Address already monitored (DB)', 409)
  }

  // 2. Then check KV Store (Slower)
  const listKey = getKVListKey(chainType)
  const exists = await checkKVListContains(listKey, normalizedAddress)
  if (exists) {
    return jsonError('Address already monitored (KV)', 409)
  }

  try {
    await addToKVList(listKey, normalizedAddress)
  } catch (error) {
    console.error('KV Store add failed:', error)
    return jsonError('KV Store error', 502)
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        walletAddress: normalizedAddress,
        chainType,
      },
    })

    if (chainType === 'EVM') {
      void updateUserDisplayName(user.id, normalizedAddress)
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    await removeFromKVList(listKey, normalizedAddress).catch((cleanupError) => {
      console.error('KV Store cleanup failed:', cleanupError)
    })

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return jsonError('Address already exists', 409)
    }

    console.error('User create failed:', error)
    return jsonError('Failed to create user', 500)
  }
}

export async function PATCH(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('id')
  if (!userId) {
    return jsonError('Missing user id', 400)
  }

  let body: { name?: string; displayName?: string }

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON', 400)
  }

  const updateData: { name?: string; displayName?: string } = {}

  if (typeof body.name === 'string') {
    const trimmedName = body.name.trim()
    if (trimmedName) {
      updateData.name = trimmedName
    }
  }

  if (typeof body.displayName === 'string') {
    const trimmedDisplay = body.displayName.trim()
    if (trimmedDisplay) {
      updateData.displayName = trimmedDisplay
    }
  }

  if (Object.keys(updateData).length === 0) {
    return jsonError('Nothing to update', 400)
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return jsonError('User not found', 404)
    }

    console.error('User update failed:', error)
    return jsonError('Failed to update user', 500)
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('id')
  if (!userId) {
    return jsonError('Missing user id', 400)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return jsonError('User not found', 404)
  }

  await prisma.user.delete({ where: { id: userId } })

  const listKey = getKVListKey(user.chainType as 'EVM' | 'SOL')
  void removeFromKVList(listKey, user.walletAddress).catch((error) => {
    console.error('KV Store removal failed:', error)
  })

  return NextResponse.json({ success: true })
}
