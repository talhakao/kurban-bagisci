'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { MEMBERS } from '@/lib/members'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const pathname = usePathname()

  const close = () => {
    setMenuOpen(false)
    setMembersOpen(false)
  }

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <span className="text-2xl">🕌</span>
            <span className="font-bold text-gray-800">Kurban Bağışı</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5 text-sm">
            {session?.user?.slug && (
              <Link
                href={`/${session.user.slug}`}
                className={`font-medium transition-colors ${pathname === `/${session.user.slug}` ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}
              >
                Sayfam
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setMembersOpen(!membersOpen)}
                className="text-gray-600 hover:text-green-600 font-medium transition-colors flex items-center gap-1"
              >
                Üyeler
                <svg className={`w-3 h-3 transition-transform ${membersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {membersOpen && (
                <div className="absolute top-8 left-0 bg-white border rounded-xl shadow-lg py-1 w-36 z-50" onMouseLeave={() => setMembersOpen(false)}>
                  {MEMBERS.map((m) => (
                    <Link key={m.slug} href={`/${m.slug}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700" onClick={() => setMembersOpen(false)}>
                      {m.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/ozet" className={`font-medium transition-colors ${pathname === '/ozet' ? 'text-green-600' : 'text-gray-600 hover:text-green-600'}`}>
              Genel Özet
            </Link>

            <div className="w-px h-4 bg-gray-200" />
            <span className="text-gray-500">{session?.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-red-500 hover:text-red-700 font-medium transition-colors">
              Çıkış
            </button>
          </div>

          {/* Mobile: user name + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <span className="text-sm text-gray-500">{session?.user?.name}</span>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menü"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-1">
              {session?.user?.slug && (
                <Link href={`/${session.user.slug}`} onClick={close} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700">
                  <span>👤</span> Sayfam
                </Link>
              )}

              <Link href="/ozet" onClick={close} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700">
                <span>📊</span> Genel Özet
              </Link>

              <div className="pt-1 pb-1">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Üyeler</p>
                <div className="grid grid-cols-3 gap-1">
                  {MEMBERS.map((m) => (
                    <Link key={m.slug} href={`/${m.slug}`} onClick={close} className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 text-center">
                      {m.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full">
                  <span>🚪</span> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={close} />
      )}
    </>
  )
}
