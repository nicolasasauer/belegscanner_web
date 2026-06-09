import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
  }

  const existing = db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    return NextResponse.json({ error: 'E-Mail bereits registriert' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  db.insert(users).values({ id: crypto.randomUUID(), email, password: hashed }).run()

  return NextResponse.json({ success: true }, { status: 201 })
}
