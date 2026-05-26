import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { DonationTable } from '@/components/DonationTable'
import { ExportButton } from '@/components/ExportButton'
import { OzetGroupView, OzetGroup, OzetDonation } from '@/components/OzetGroupView'
import Link from 'next/link'

export const metadata = { title: 'Genel Özet | Kurban Bağışı' }
export const dynamic = 'force-dynamic'

export default async function OzetPage() {
  const allUsers = await prisma.user.findMany({
    include: {
      donations: {
        orderBy: { createdAt: 'desc' },
        include: { reference: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  const allDonations = allUsers.flatMap((u) => u.donations)

  const grandTotal = allDonations.reduce((s, d) => s + d.sharesCount, 0)
  const buyukbasTotal = allDonations.filter((d) => d.sharesType === 'BUYUKBAS').reduce((s, d) => s + d.sharesCount, 0)
  const kucukbasTotal = allDonations.filter((d) => d.sharesType === 'KUCUKBAS').reduce((s, d) => s + d.sharesCount, 0)
  const cadTotal = allDonations.filter((d) => d.country === 'CAD').reduce((s, d) => s + d.sharesCount, 0)
  const tanzanyaTotal = allDonations.filter((d) => d.country === 'TANZANYA').reduce((s, d) => s + d.sharesCount, 0)
  const alindi = allDonations.filter((d) => d.receipt === 'ALINDI').length
  const alinmadi = allDonations.filter((d) => d.receipt === 'ALINMADI').length

  // Son Günler totals
  const sonGunler = await prisma.sonGunlerEntry.findMany({
    include: { addedBy: { select: { name: true } } },
  })
  const sgTotal = sonGunler.reduce((s, e) => s + e.sharesCount, 0)
  const sgBuyukbas = sonGunler.filter((e) => e.sharesType === 'BUYUKBAS').reduce((s, e) => s + e.sharesCount, 0)
  const sgKucukbas = sonGunler.filter((e) => e.sharesType === 'KUCUKBAS').reduce((s, e) => s + e.sharesCount, 0)
  const sgAlindi = sonGunler.filter((e) => e.receipt === 'ALINDI').length
  const sgAlinmadi = sonGunler.filter((e) => e.receipt === 'ALINMADI').length

  // Fetch groups for group view
  const dbGroups = await prisma.donationGroup.findMany({
    include: {
      owner: { select: { name: true, slug: true } },
      donations: {
        include: { reference: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const groups: OzetGroup[] = dbGroups.map((g) => ({
    id: g.id,
    name: g.name,
    isOzet: g.isOzet,
    owner: g.owner,
    donations: g.donations.map((d) => ({
      id: d.id,
      ownerName: d.ownerName,
      sharesCount: d.sharesCount,
      sharesType: d.sharesType,
      country: d.country,
      groupId: d.groupId,
      reference: d.reference,
    })),
  }))

  const groupedIds = new Set(dbGroups.flatMap((g) => g.donations.map((d) => d.id)))

  const ungrouped: OzetDonation[] = allDonations
    .filter((d) => !groupedIds.has(d.id))
    .map((d) => ({
      id: d.id,
      ownerName: d.ownerName,
      sharesCount: d.sharesCount,
      sharesType: d.sharesType,
      country: d.country,
      groupId: null,
      reference: d.reference,
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Genel Özet</h1>
            <p className="text-gray-400 text-sm mt-0.5">Tüm üyelerin bağış toplamları</p>
          </div>
          <ExportButton />
        </div>

        {/* Genel istatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: 'Toplam Kayıt', value: allDonations.length, color: 'text-gray-800' },
            { label: 'Toplam Hisse', value: grandTotal, color: 'text-green-600' },
            { label: 'Büyükbaş', value: buyukbasTotal, color: 'text-amber-500' },
            { label: 'Küçükbaş', value: kucukbasTotal, color: 'text-purple-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-3.5 sm:p-5 border shadow-sm">
              <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-xs sm:text-sm text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3.5 sm:p-5 border shadow-sm flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🇹🇩</span>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{cadTotal}</div>
              <div className="text-xs sm:text-sm text-gray-400">Çad</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3.5 sm:p-5 border shadow-sm flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🇹🇿</span>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-800">{tanzanyaTotal}</div>
              <div className="text-xs sm:text-sm text-gray-400">Tanzanya</div>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-3.5 sm:p-5 border border-green-200 shadow-sm flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">✅</span>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-700">{alindi}</div>
              <div className="text-xs sm:text-sm text-gray-400">Dekont Alındı</div>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-3.5 sm:p-5 border border-red-200 shadow-sm flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">⏳</span>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{alinmadi}</div>
              <div className="text-xs sm:text-sm text-gray-400">Dekont Bekliyor</div>
            </div>
          </div>
        </div>

        {/* Son Günler özeti */}
        {sonGunler.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <h2 className="font-semibold text-gray-800">Son Günler</h2>
                <span className="text-xs text-gray-400">{sonGunler.length} bekleyen kayıt</span>
              </div>
              <Link href="/son-gunler" className="text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline">
                Tümünü Gör →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                <div className="font-bold text-gray-800 text-lg">{sgTotal}</div>
                <div className="text-xs text-gray-400">Toplam Hisse</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                <div className="font-bold text-amber-600 text-lg">{sgBuyukbas}</div>
                <div className="text-xs text-gray-400">Büyükbaş</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                <div className="font-bold text-purple-600 text-lg">{sgKucukbas}</div>
                <div className="text-xs text-gray-400">Küçükbaş</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                <div className="font-bold text-green-600 text-lg">{sgAlindi}</div>
                <div className="text-xs text-gray-400">Dekont ✓</div>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-orange-100">
                <div className="font-bold text-red-500 text-lg">{sgAlinmadi}</div>
                <div className="text-xs text-gray-400">Dekont ✗</div>
              </div>
            </div>
          </div>
        )}

        {/* Üye bazlı özet tablosu */}
        <div className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Üye Bazlı Özet</h2>
          </div>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 font-medium">
                  <th className="text-left px-4 py-3">Üye</th>
                  <th className="text-left px-4 py-3">Kayıt</th>
                  <th className="text-left px-4 py-3">Hisse</th>
                  <th className="text-left px-4 py-3">Büyükbaş</th>
                  <th className="text-left px-4 py-3">Küçükbaş</th>
                  <th className="text-left px-4 py-3">🇹🇩 Çad</th>
                  <th className="text-left px-4 py-3">🇹🇿 Tanzanya</th>
                  <th className="text-left px-4 py-3">Dekont</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => {
                  const shares = user.donations.reduce((s, d) => s + d.sharesCount, 0)
                  const bb = user.donations.filter((d) => d.sharesType === 'BUYUKBAS').reduce((s, d) => s + d.sharesCount, 0)
                  const kb = user.donations.filter((d) => d.sharesType === 'KUCUKBAS').reduce((s, d) => s + d.sharesCount, 0)
                  const cad = user.donations.filter((d) => d.country === 'CAD').reduce((s, d) => s + d.sharesCount, 0)
                  const tz = user.donations.filter((d) => d.country === 'TANZANYA').reduce((s, d) => s + d.sharesCount, 0)
                  const userAlindi = user.donations.filter((d) => d.receipt === 'ALINDI').length
                  const userAlinmadi = user.donations.length - userAlindi

                  return (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/${user.slug}`}
                          className="font-medium text-green-600 hover:text-green-700 hover:underline"
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.donations.length}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{shares || '-'}</td>
                      <td className="px-4 py-3 text-amber-600">{bb || '-'}</td>
                      <td className="px-4 py-3 text-purple-600">{kb || '-'}</td>
                      <td className="px-4 py-3">{cad || '-'}</td>
                      <td className="px-4 py-3">{tz || '-'}</td>
                      <td className="px-4 py-3">
                        {userAlindi > 0 && (
                          <span className="text-green-600 font-medium">{userAlindi}✓</span>
                        )}
                        {userAlinmadi > 0 && (
                          <span className="text-red-500 ml-1">{userAlinmadi}✗</span>
                        )}
                        {user.donations.length === 0 && '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 font-semibold text-gray-700">
                  <td className="px-4 py-3">TOPLAM</td>
                  <td className="px-4 py-3">{allDonations.length}</td>
                  <td className="px-4 py-3 text-green-700">{grandTotal}</td>
                  <td className="px-4 py-3 text-amber-600">{buyukbasTotal}</td>
                  <td className="px-4 py-3 text-purple-600">{kucukbasTotal}</td>
                  <td className="px-4 py-3">{cadTotal}</td>
                  <td className="px-4 py-3">{tanzanyaTotal}</td>
                  <td className="px-4 py-3">
                    <span className="text-green-600">{alindi}✓</span>
                    {alinmadi > 0 && <span className="text-red-500 ml-1">{alinmadi}✗</span>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Grup Yönetimi */}
        {(groups.length > 0 || ungrouped.length > 0) && (
          <div className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Kurban Grupları</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Her grup = 1 kurban (maks 7 hisse) · Üye grupları kilitli, özet grupları düzenlenebilir
                </p>
              </div>
              <div className="text-xs text-gray-400">
                {groups.length} grup · {ungrouped.length} grupsuz
              </div>
            </div>
            <div className="p-4">
              <OzetGroupView groups={groups} ungrouped={ungrouped} />
            </div>
          </div>
        )}

        {/* Üye detay tabloları */}
        {allUsers
          .filter((u) => u.donations.length > 0)
          .map((user) => (
            <div key={user.id} className="bg-white rounded-xl border shadow-sm mb-6 overflow-hidden">
              <div className="p-4 border-b flex items-center gap-3">
                <Link
                  href={`/${user.slug}`}
                  className="font-semibold text-gray-800 hover:text-green-600"
                >
                  {user.name}
                </Link>
                <span className="text-sm text-gray-400">
                  {user.donations.length} kayıt ·{' '}
                  {user.donations.reduce((s, d) => s + d.sharesCount, 0)} hisse
                </span>
              </div>
              <DonationTable
                donations={user.donations.map((d) => ({
                  ...d,
                  createdAt: d.createdAt.toISOString(),
                }))}
                isOwner={false}
              />
            </div>
          ))}

        {allDonations.length === 0 && (
          <div className="bg-white rounded-xl border p-16 text-center text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p>Henüz hiç bağış kaydı yok</p>
          </div>
        )}
      </main>
    </div>
  )
}
