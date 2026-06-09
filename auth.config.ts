/**
 * Edge-Runtime-kompatibler Teil der NextAuth-Konfiguration.
 * Darf keine Node.js-nativen Module importieren (kein better-sqlite3, kein bcrypt).
 */
import type { NextAuthConfig } from 'next-auth'

export default {
  secret: process.env.AUTH_SECRET ?? 'bitte-aendern-mindestens-32-zeichen-lang-xyz',
  // Nötig für Docker/Reverse-Proxy: vertraut dem Host-Header
  trustHost: true,
  providers: [], // Credentials-Provider wird in auth.ts hinzugefügt (Node.js only)
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
