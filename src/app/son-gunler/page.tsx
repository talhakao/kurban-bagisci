import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { SonGunlerClient } from './SonGunlerClient'

export const metadata = { title: 'Son Günler | Kurban Bağışı' }
export const dynamic = 'force-dynamic'

export default async function SonGunlerPage() {
  const session = await getServerSession(authOptions)

  const entries = await prisma.sonGunlerEntry.findMany({
    include: { addedBy: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Son Günler</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Son dakika bağışçı takip listesi — herkes ekleyebilir
          </p>
        </div>

        <SonGunlerClient
          entries={entries.map((e) => ({
            id: e.id,
            name: e.name,
            sharesCount: e.sharesCount,
            sharesType: e.sharesType,
            country: e.country,
            phone: e.phone,
            notes: e.notes,
            receipt: e.receipt,
            createdAt: e.createdAt.toISOString(),
            addedBy: e.addedBy,
          }))}
          currentSlug={session?.user?.slug ?? ''}
        />
      </main>
    </div>
  )
}
