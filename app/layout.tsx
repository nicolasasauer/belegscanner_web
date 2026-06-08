import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getRuntimeConfig } from '@/lib/config/runtime'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Belegscanner',
  description: 'Belege scannen, kategorisieren und verwalten',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Config aus Datei lesen und als globales window.__BSCONFIG__ injizieren
  // → der Browser-seitige Supabase-Client liest sie von dort
  const config = await getRuntimeConfig()
  const clientConfig = {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
  }

  return (
    <html lang="de">
      <head>
        {/* Runtime-Config für Client-Components (kein Build-Time Baking nötig) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BSCONFIG__=${JSON.stringify(clientConfig)};`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
