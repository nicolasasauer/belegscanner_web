import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads')

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Keine Datei übergeben' }, { status: 400 })

  const ext      = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const userDir  = path.join(UPLOADS_DIR, session.user.id)
  const filename = `${crypto.randomUUID()}.${ext}`
  const filePath = path.join(userDir, filename)

  await fs.mkdir(userDir, { recursive: true })
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/api/uploads/${session.user.id}/${filename}` })
}
