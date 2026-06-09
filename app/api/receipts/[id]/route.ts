import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getReceiptById, updateReceipt, deleteReceipt } from '@/lib/services/receipts'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const receipt = await getReceiptById(params.id, session.user.id)
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(receipt)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const receipt = await updateReceipt({ id: params.id, ...body }, session.user.id)
  return NextResponse.json(receipt)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await deleteReceipt(params.id, session.user.id)
  return new NextResponse(null, { status: 204 })
}
