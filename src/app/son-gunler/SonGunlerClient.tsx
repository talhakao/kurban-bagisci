'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addSonGunlerEntry, updateSonGunlerEntry, deleteSonGunlerEntry } from './actions'

export type SonGunlerRow = {
  id: number
  name: string
  sharesCount: number
  sharesType: string
  country: string
  phone: string | null
  notes: string | null
  receipt: string
  createdAt: string
  addedBy: { name: string; slug: string }
}

interface Props {
  entries: SonGunlerRow[]
  currentSlug: string
}

export function SonGunlerClient({ entries: initialEntries, currentSlug }: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<SonGunlerRow | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { setEntries(initialEntries) }, [initialEntries])

  const filtered = search.trim()
    ? entries.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : entries

  async function handleDelete(id: number) {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteSonGunlerEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Silinemedi')
    } finally {
      setDeletingId(null)
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  const totalShares = filtered.reduce((s, e) => s + e.sharesCount, 0)
  const buyukbas = filtered.filter((e) => e.sharesType === 'BUYUKBAS').reduce((s, e) => s + e.sharesCount, 0)
  const kucukbas = filtered.filter((e) => e.sharesType === 'KUCUKBAS').reduce((s, e) => s + e.sharesCount, 0)
  const alindi = filtered.filter((e) => e.receipt === 'ALINDI').length

  return (
    <div>
      {/* Search + add bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsme göre ara..."
            className="w-full pl-8 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 flex-shrink-0 shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          <span className="hidden sm:inline">Bağışçı Ekle</span>
          <span className="sm:hidden">Ekle</span>
        </button>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Kayıt', value: filtered.length + (search ? ` / ${entries.length}` : ''), color: 'text-gray-800' },
            { label: 'Hisse', value: totalShares, color: 'text-green-600' },
            { label: 'Büyükbaş', value: buyukbas, color: 'text-amber-500' },
            { label: 'Küçükbaş', value: kucukbas, color: 'text-purple-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-3 border shadow-sm">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border py-16 text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">Henüz kayıt yok — ilk ekleyen siz olun!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border py-10 text-center text-gray-400 text-sm">
          &ldquo;{search}&rdquo; için sonuç bulunamadı
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border shadow-sm px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{entry.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {entry.sharesCount} hisse
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.sharesType === 'BUYUKBAS' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                      {entry.sharesType === 'BUYUKBAS' ? 'Büyükbaş' : 'Küçükbaş'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {entry.country === 'CAD' ? '🇹🇩 Çad' : '🇹🇿 Tanzanya'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.receipt === 'ALINDI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {entry.receipt === 'ALINDI' ? '✓ Dekont Alındı' : '✗ Dekont Bekliyor'}
                    </span>
                  </div>
                  {entry.phone && <p className="text-sm text-gray-500 mt-1.5">📞 {entry.phone}</p>}
                  {entry.notes && <p className="text-sm text-gray-400 mt-1 italic">{entry.notes}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                      {entry.addedBy.name}
                    </span>
                    <span className="text-xs text-gray-300">{formatTime(entry.createdAt)}</span>
                  </div>
                </div>

                {entry.addedBy.slug === currentSlug && (
                  <div className="flex gap-3 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="text-blue-400 hover:text-blue-600 text-xs"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="text-red-400 hover:text-red-600 text-xs disabled:opacity-40"
                    >
                      {deletingId === entry.id ? '...' : 'Sil'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer totals */}
      {filtered.length > 0 && (
        <div className="mt-3 px-4 py-2.5 bg-green-50 rounded-xl border text-xs font-medium text-gray-600">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{filtered.length}{search ? ` / ${entries.length}` : ''} kayıt</span>
            <span className="text-green-700 font-bold">{totalShares} hisse</span>
            <span>{buyukbas} büyükbaş</span>
            <span>{kucukbas} küçükbaş</span>
            <span className="text-green-600">{alindi} dekont ✓</span>
            {filtered.length - alindi > 0 && (
              <span className="text-red-500">{filtered.length - alindi} eksik</span>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <SonGunlerForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); router.refresh() }}
        />
      )}

      {editingEntry && (
        <SonGunlerForm
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => { setEditingEntry(null); router.refresh() }}
        />
      )}
    </div>
  )
}

function SonGunlerForm({
  entry,
  onClose,
  onSaved,
}: {
  entry?: SonGunlerRow
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!entry
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const formData = new FormData(e.currentTarget)
      if (isEdit) {
        await updateSonGunlerEntry(entry.id, formData)
      } else {
        await addSonGunlerEntry(formData)
      }
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Kaydı Düzenle' : 'Son Günler — Bağışçı Ekle'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 text-lg">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                autoFocus
                defaultValue={entry?.name}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                placeholder="Bağışçının adı soyadı"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hisse Adedi <span className="text-red-500">*</span>
              </label>
              <select
                name="sharesCount"
                required
                defaultValue={entry?.sharesCount ?? 1}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-base"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n} Hisse</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hisse Türü <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'BUYUKBAS', label: '🐄 Büyükbaş' },
                  { value: 'KUCUKBAS', label: '🐑 Küçükbaş' },
                ].map(({ value, label }) => (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" name="sharesType" value={value} defaultChecked={(entry?.sharesType ?? 'BUYUKBAS') === value} className="peer sr-only" />
                    <div className="border-2 border-gray-200 rounded-xl py-3 text-center text-sm font-medium text-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ülke <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'CAD', label: '🇹🇩 Çad' },
                  { value: 'TANZANYA', label: '🇹🇿 Tanzanya' },
                ].map(({ value, label }) => (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" name="country" value={value} defaultChecked={(entry?.country ?? 'CAD') === value} className="peer sr-only" />
                    <div className="border-2 border-gray-200 rounded-xl py-3 text-center text-sm font-medium text-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <input
                name="phone"
                type="tel"
                defaultValue={entry?.phone ?? ''}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                placeholder="05XX XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Not</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={entry?.notes ?? ''}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-base"
                placeholder="İletişim durumu vb..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dekont <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'ALINMADI', label: '⏳ Alınmadı' },
                  { value: 'ALINDI', label: '✅ Alındı' },
                ].map(({ value, label }) => (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" name="receipt" value={value} defaultChecked={(entry?.receipt ?? 'ALINMADI') === value} className="peer sr-only" />
                    <div className="border-2 border-gray-200 rounded-xl py-3 text-center text-sm font-medium text-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">{error}</div>
            )}

            <div className="flex gap-3 pb-2">
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium text-base">
                İptal
              </button>
              <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 text-base">
                {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
