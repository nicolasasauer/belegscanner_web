/**
 * GET /api/health
 * Öffentlicher Health-Check für TailscaleService (Mobile-App).
 * Keine Auth erforderlich — gibt immer 200 zurück wenn der Server läuft.
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', version: '1.0.0' })
}
