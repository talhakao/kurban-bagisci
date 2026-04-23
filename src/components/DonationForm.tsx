'use client'

import { useState } from 'react'
import { addDonation } from '@/app/actions'

interface Props {
  onClose: () => void
}

export function DonationForm({ onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      await addDonation(formData)
      onClose()
    } catch {
      setError('Bir hata oluştu, tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Yeni Bağış Ekle</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-lg">
            ✕
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hisse Sahibinin Adı Soyadı <span className="text-red-500">*</span>
              </label>
              <input
                name="ownerName"
                type="text"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hisse Adedi <span className="text-red-500">*</span>
              </label>
              <select
                name="sharesCount"
                required
                defaultValue="1"
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
                    <input type="radio" name="sharesType" value={value} defaultChecked={value === 'BUYUKBAS'} className="peer sr-only" />
                    <div className="border-2 border-gray-200 rounded-xl py-3 text-center text-sm font-medium text-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kurbanın Kesileceği Ülke <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'CAD', label: '🇹🇩 Çad' },
                  { value: 'TANZANYA', label: '🇹🇿 Tanzanya' },
                ].map(({ value, label }) => (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" name="country" value={value} defaultChecked={value === 'CAD'} className="peer sr-only" />
                    <div className="border-2 border-gray-200 rounded-xl py-3 text-center text-sm font-medium text-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon Numarası
              </label>
              <input
                name="phone"
                type="tel"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                placeholder="05XX XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Not</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-base"
                placeholder="Opsiyonel not..."
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
                    <input type="radio" name="receipt" value={value} defaultChecked={value === 'ALINMADI'} className="peer sr-only" />
                    <div className="border-2 border-gray-200 rounded-xl py-3 text-center text-sm font-medium text-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all">
                      {label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium text-base"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors font-medium disabled:opacity-50 text-base"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
