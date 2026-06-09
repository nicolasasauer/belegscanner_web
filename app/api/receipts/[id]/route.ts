import { NextRequest, NextResponse } from 'next/server'
import { resolveApiUser } from '@/lib/mobile-auth'
import { getReceiptById, updateReceipt, deleteReceipt } from '@/lib/services/receipts'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const receipt = await getReceiptById(params.id, user.id)
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(receipt)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const receipt = await updateReceipt({ id: params.id, ...body }, user.id)
  return NextResponse.json(receipt)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteReceipt(params.id, user.id)
  return new NextResponse(null, { status: 204 })
}
