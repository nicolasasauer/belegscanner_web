'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/receipts', label: 'Belege', icon: Receipt },
  { href: '/dashboard/settings', label: 'Einstellungen', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden flex border-b border-gray-200 bg-white px-4">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium flex-1 transition-colors',
            pathname === href
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
