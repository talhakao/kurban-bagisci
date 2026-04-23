'use client'

import { useState } from 'react'
import { deleteDonation } from '@/app/actions'

export type DonationRow = {
  id: number
  ownerName: string
  sharesCount: number
  sharesType: string
  country: string
  phone: string | null
  notes: string | null
  receipt: string
  createdAt: string | Date
  reference?: { name: string; slug: string }
}

interface Props {
  donations: DonationRow[]
  isOwner: boolean
  showReference?: boolean
}

export function DonationTable({ donations, isOwner, showReference = false }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  async function handleDelete(id: number) {
    if (!confirm('Bu bağışı silmek istediğinizden emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteDonation(id)
    } catch {
      alert('Silme işlemi başarısız oldu.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = search.trim()
    ? donations.filter((d) => d.ownerName.toLowerCase().includes(search.toLowerCase()))
    : donations

  if (donations.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-sm">Henüz bağış kaydı yok</p>
      </div>
    )
  }

  const totalShares = filtered.reduce((sum, d) => sum + d.sharesCount, 0)
  const buyukbas = filtered.filter((d) => d.sharesType === 'BUYUKBAS').reduce((s, d) => s + d.sharesCount, 0)
  const kucukbas = filtered.filter((d) => d.sharesType === 'KUCUKBAS').reduce((s, d) => s + d.sharesCount, 0)
  const alindi = filtered.filter((d) => d.receipt === 'ALINDI').length

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsme göre ara..."
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-gray-400 mt-1">{filtered.length} sonuç bulundu</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-gray-400 text-sm">
          &ldquo;{search}&rdquo; için sonuç bulunamadı
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden divide-y">
            {filtered.map((d, i) => (
              <div key={d.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{d.ownerName}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {d.sharesCount} hisse
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.sharesType === 'BUYUKBAS' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                        {d.sharesType === 'BUYUKBAS' ? 'Büyükbaş' : 'Küçükbaş'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {d.country === 'CAD' ? '🇹🇩 Çad' : '🇹🇿 Tanzanya'}
                      </span>
                      {showReference && d.reference && (
                        <span className="text-xs text-gray-400">{d.reference.name}</span>
                      )}
                    </div>
                    {d.phone && (
                      <p className="text-xs text-gray-500 mt-1">📞 {d.phone}</p>
                    )}
                    {d.notes && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{d.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.receipt === 'ALINDI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {d.receipt === 'ALINDI' ? '✓ Alındı' : '✗ Bekliyor'}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        className="text-red-400 hover:text-red-600 text-xs disabled:opacity-40"
                      >
                        {deletingId === d.id ? '...' : 'Sil'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 font-medium">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Hisse Sahibi</th>
                  <th className="text-left px-4 py-3">Hisse</th>
                  <th className="text-left px-4 py-3">Tür</th>
                  <th className="text-left px-4 py-3">Ülke</th>
                  {showReference && <th className="text-left px-4 py-3">Referans</th>}
                  <th className="text-left px-4 py-3">Telefon</th>
                  <th className="text-left px-4 py-3">Not</th>
                  <th className="text-left px-4 py-3">Dekont</th>
                  {isOwner && <th className="text-left px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.ownerName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{d.sharesCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.sharesType === 'BUYUKBAS' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                        {d.sharesType === 'BUYUKBAS' ? 'Büyükbaş' : 'Küçükbaş'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{d.country === 'CAD' ? '🇹🇩 Çad' : '🇹🇿 Tanzanya'}</td>
                    {showReference && (
                      <td className="px-4 py-3 text-gray-600 text-sm">{d.reference?.name ?? '-'}</td>
                    )}
                    <td className="px-4 py-3 text-gray-600 text-xs">{d.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate" title={d.notes ?? ''}>{d.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.receipt === 'ALINDI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {d.receipt === 'ALINDI' ? '✓ Alındı' : '✗ Alınmadı'}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="text-red-400 hover:text-red-600 text-xs disabled:opacity-40 transition-colors"
                        >
                          {deletingId === d.id ? '...' : 'Sil'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer totals */}
      <div className="px-4 py-3 bg-green-50 border-t text-xs font-medium text-gray-600">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>{filtered.length}{search ? ` / ${donations.length}` : ''} kayıt</span>
          <span className="text-green-700 font-bold">{totalShares} hisse</span>
          <span>{buyukbas} büyükbaş</span>
          <span>{kucukbas} küçükbaş</span>
          <span className="text-green-600">{alindi} dekont ✓</span>
          {filtered.length - alindi > 0 && (
            <span className="text-red-500">{filtered.length - alindi} eksik</span>
          )}
        </div>
      </div>
    </div>
  )
}
