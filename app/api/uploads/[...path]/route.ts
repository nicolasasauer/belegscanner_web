import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import path from 'path'
import fs from 'fs/promises'

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads')

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
}

export async function GET(
  _: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Sicherheitscheck: Nutzer darf nur eigene Dateien sehen
  if (params.path[0] !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const filePath = path.join(UPLOADS_DIR, ...params.path)

  // Path-Traversal verhindern
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const file        = await fs.readFile(filePath)
    const ext         = path.extname(filePath).slice(1).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(file, { headers: { 'Content-Type': contentType } })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
