'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignToOzetGroup,
  createOzetGroup,
  deleteOzetGroup,
} from '@/app/group-actions'

export type OzetDonation = {
  id: number
  ownerName: string
  sharesCount: number
  sharesType: string
  country: string
  groupId: number | null
  reference: { name: string; slug: string }
}

export type OzetGroup = {
  id: number
  name: string
  isOzet: boolean
  owner: { name: string; slug: string } | null
  donations: OzetDonation[]
}

interface Props {
  groups: OzetGroup[]
  ungrouped: OzetDonation[]
}

export function OzetGroupView({ groups: initialGroups, ungrouped: initialUngrouped }: Props) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [ungrouped, setUngrouped] = useState(initialUngrouped)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [creating, setCreating] = useState(false)
  const [assigningId, setAssigningId] = useState<number | null>(null)

  useEffect(() => { setGroups(initialGroups) }, [initialGroups])
  useEffect(() => { setUngrouped(initialUngrouped) }, [initialUngrouped])

  const memberGroups = groups.filter((g) => !g.isOzet)
  const ozetGroups = groups.filter((g) => g.isOzet)

  function getGroupShares(groupId: number, excludeId?: number) {
    const g = groups.find((g) => g.id === groupId)
    if (!g) return 0
    return g.donations
      .filter((d) => d.id !== excludeId)
      .reduce((s, d) => s + d.sharesCount, 0)
  }

  async function handleAssign(donationId: number, targetGroupId: number | null) {
    const donation =
      ungrouped.find((d) => d.id === donationId) ??
      ozetGroups.flatMap((g) => g.donations).find((d) => d.id === donationId)
    if (!donation) return

    if (targetGroupId !== null) {
      const current = getGroupShares(targetGroupId, donationId)
      if (current + donation.sharesCount > 7) {
        alert('Bu grupta yeterli kapasite yok (maks 7 hisse)')
        return
      }
    }

    const prevGroupId = donation.groupId

    // Optimistic update
    if (prevGroupId === null) {
      setUngrouped((prev) => prev.filter((d) => d.id !== donationId))
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === prevGroupId
            ? { ...g, donations: g.donations.filter((d) => d.id !== donationId) }
            : g
        )
      )
    }

    if (targetGroupId === null) {
      setUngrouped((prev) => [...prev, { ...donation, groupId: null }])
    } else {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === targetGroupId
            ? { ...g, donations: [...g.donations, { ...donation, groupId: targetGroupId }] }
            : g
        )
      )
    }

    setAssigningId(donationId)
    try {
      await assignToOzetGroup(donationId, targetGroupId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
      router.refresh()
    } finally {
      setAssigningId(null)
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return
    setCreating(true)
    try {
      await createOzetGroup(newGroupName.trim())
      setNewGroupName('')
      setShowNewGroup(false)
      router.refresh()
    } catch {
      alert('Grup oluşturulamadı')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteOzetGroup(groupId: number, groupName: string) {
    const g = ozetGroups.find((g) => g.id === groupId)
    if (!g) return
    if (
      !confirm(
        `"${groupName}" grubunu silmek istiyor musunuz?${
          g.donations.length > 0 ? ` ${g.donations.length} bağış grupsuz kalacak.` : ''
        }`
      )
    )
      return

    const freed = g.donations
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    setUngrouped((prev) => [...prev, ...freed.map((d) => ({ ...d, groupId: null }))])

    try {
      await deleteOzetGroup(groupId)
      router.refresh()
    } catch {
      alert('Grup silinemedi')
      router.refresh()
    }
  }

  const allOzetDonations = [...ungrouped, ...ozetGroups.flatMap((g) => g.donations)]

  return (
    <div className="space-y-6">
      {/* Member groups — read-only */}
      {memberGroups.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Üye Grupları
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberGroups.map((group) => {
              const totalShares = group.donations.reduce((s, d) => s + d.sharesCount, 0)
              const isFull = totalShares >= 7
              return (
                <div key={group.id} className={`rounded-xl border-2 ${isFull ? 'border-green-200' : 'border-gray-200'} bg-white`}>
                  <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                      {group.owner && (
                        <span className="text-xs text-gray-400">{group.owner.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isFull ? 'bg-green-500' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min((totalShares / 7) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isFull ? 'text-green-600' : 'text-gray-400'}`}>
                        {totalShares}/7{isFull && ' ✓'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {group.donations.map((d) => (
                      <ReadOnlyChip key={d.id} donation={d} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ozet groups + ungrouped — editable */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Özet Grupları
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {ozetGroups.map((group) => {
            const totalShares = group.donations.reduce((s, d) => s + d.sharesCount, 0)
            const isFull = totalShares >= 7
            return (
              <div key={group.id} className={`rounded-xl border-2 ${isFull ? 'border-green-200 bg-green-50/50' : 'border-blue-200 bg-blue-50/30'}`}>
                <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isFull ? 'bg-green-500' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min((totalShares / 7) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isFull ? 'text-green-600' : 'text-blue-500'}`}>
                        {totalShares}/7{isFull && ' ✓'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOzetGroup(group.id, group.name)}
                    className="text-red-400 hover:text-red-600 text-xs flex-shrink-0"
                  >
                    Sil
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  {group.donations.length === 0 && (
                    <p className="text-center py-2 text-gray-300 text-xs">Boş</p>
                  )}
                  {group.donations.map((d) => (
                    <AssignableChip
                      key={d.id}
                      donation={d}
                      groups={ozetGroups}
                      ungroupedLabel="Grupsuz"
                      onAssign={(gid) => handleAssign(d.id, gid)}
                      assigning={assigningId === d.id}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* New ozet group button */}
        {showNewGroup ? (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              placeholder="Grup adı (örn: Özet Grup 1)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <button
              onClick={handleCreateGroup}
              disabled={creating || !newGroupName.trim()}
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {creating ? '...' : 'Oluştur'}
            </button>
            <button
              onClick={() => { setShowNewGroup(false); setNewGroupName('') }}
              className="border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-500"
            >
              İptal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewGroup(true)}
            className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 rounded-xl py-2.5 text-sm font-medium transition-colors mb-4"
          >
            + Yeni Özet Grubu Oluştur
          </button>
        )}

        {/* Ungrouped */}
        {allOzetDonations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Gruplanabilir Bağışlar ({ungrouped.length} grupsuz,{' '}
              {ungrouped.reduce((s, d) => s + d.sharesCount, 0)} hisse)
            </h4>
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-2 space-y-1">
              {ungrouped.length === 0 && (
                <p className="text-center py-3 text-gray-300 text-xs">
                  Tüm bağışlar gruplandırıldı
                </p>
              )}
              {ungrouped.map((d) => (
                <AssignableChip
                  key={d.id}
                  donation={d}
                  groups={ozetGroups}
                  ungroupedLabel={null}
                  onAssign={(gid) => handleAssign(d.id, gid)}
                  assigning={assigningId === d.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReadOnlyChip({ donation }: { donation: OzetDonation }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border text-sm">
      <span className="flex-1 font-medium text-gray-700 truncate">{donation.ownerName}</span>
      <span className="text-xs text-gray-400">{donation.reference.name}</span>
      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
        {donation.sharesCount}h
      </span>
      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
        donation.sharesType === 'BUYUKBAS' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
      }`}>
        {donation.sharesType === 'BUYUKBAS' ? 'BB' : 'KB'}
      </span>
    </div>
  )
}

function AssignableChip({
  donation,
  groups,
  ungroupedLabel,
  onAssign,
  assigning,
}: {
  donation: OzetDonation
  groups: OzetGroup[]
  ungroupedLabel: string | null
  onAssign: (groupId: number | null) => void
  assigning: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border text-sm hover:shadow-sm">
      <span className="flex-1 font-medium text-gray-700 truncate">{donation.ownerName}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{donation.reference.name}</span>
      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
        {donation.sharesCount}h
      </span>
      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
        donation.sharesType === 'BUYUKBAS' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
      }`}>
        {donation.sharesType === 'BUYUKBAS' ? 'BB' : 'KB'}
      </span>
      {assigning ? (
        <span className="text-xs text-gray-400 flex-shrink-0">...</span>
      ) : (
        <select
          value={donation.groupId ?? ''}
          onChange={(e) => onAssign(e.target.value === '' ? null : Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500 flex-shrink-0 max-w-[110px]"
        >
          {ungroupedLabel !== null && <option value="">Grupsuz</option>}
          {groups.map((g) => {
            const shares = g.donations
              .filter((d) => d.id !== donation.id)
              .reduce((s, d) => s + d.sharesCount, 0)
            const remaining = 7 - shares
            return (
              <option key={g.id} value={g.id} disabled={remaining < donation.sharesCount}>
                {g.name} ({remaining} boş)
              </option>
            )
          })}
        </select>
      )}
    </div>
  )
}
