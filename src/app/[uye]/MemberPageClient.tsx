'use client'

import { useState } from 'react'
import { DonationForm } from '@/components/DonationForm'
import { DonationTable, DonationRow } from '@/components/DonationTable'

interface Props {
  pageUser: { id: number; name: string; slug: string }
  donations: DonationRow[]
  isOwner: boolean
}

export function MemberPageClient({ pageUser, donations, isOwner }: Props) {
  const [showForm, setShowForm] = useState(false)

  const totalShares = donations.reduce((s, d) => s + d.sharesCount, 0)
  const buyukbas = donations.filter((d) => d.sharesType === 'BUYUKBAS').reduce((s, d) => s + d.sharesCount, 0)
  const kucukbas = donations.filter((d) => d.sharesType === 'KUCUKBAS').reduce((s, d) => s + d.sharesCount, 0)
  const alindi = donations.filter((d) => d.receipt === 'ALINDI').length

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            {pageUser.name}
            {isOwner && (
              <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Sen
              </span>
            )}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Bağış Listesi</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 text-sm shadow-sm"
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">Yeni Bağış Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Toplam Kayıt', value: donations.length, color: 'text-gray-800' },
          { label: 'Toplam Hisse', value: totalShares, color: 'text-green-600' },
          { label: 'Büyükbaş', value: buyukbas, color: 'text-amber-500' },
          { label: 'Küçükbaş', value: kucukbas, color: 'text-purple-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-3.5 border shadow-sm">
            <div className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Dekont uyarısı */}
      {alindi < donations.length && donations.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-orange-700">
          <span>⚠️</span>
          <span><strong>{donations.length - alindi}</strong> bağışın dekontu henüz alınmadı.</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <DonationTable donations={donations} isOwner={isOwner} />
      </div>

      {showForm && <DonationForm onClose={() => setShowForm(false)} />}
    </main>
  )
}
