'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { assignToGroup, createGroup, deleteGroup } from '@/app/group-actions'

export type GroupDonation = {
  id: number
  ownerName: string
  sharesCount: number
  sharesType: string
  country: string
  groupId: number | null
}

export type DonationGroupData = {
  id: number
  name: string
}

interface Props {
  donations: GroupDonation[]
  groups: DonationGroupData[]
  isOwner: boolean
}

export function GroupBoard({ donations: initialDonations, groups: initialGroups, isOwner }: Props) {
  const router = useRouter()
  const [donations, setDonations] = useState(initialDonations)
  const [groups, setGroups] = useState(initialGroups)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | 'ungrouped' | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setDonations(initialDonations)
  }, [initialDonations])

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

  function getGroupShares(groupId: number, excludeId?: number) {
    return donations
      .filter((d) => d.groupId === groupId && d.id !== excludeId)
      .reduce((s, d) => s + d.sharesCount, 0)
  }

  const ungrouped = donations.filter((d) => d.groupId === null)

  async function handleDrop(targetGroupId: number | null) {
    if (draggingId === null) return
    const donation = donations.find((d) => d.id === draggingId)
    if (!donation || donation.groupId === targetGroupId) {
      setDragOver(null)
      return
    }

    if (targetGroupId !== null) {
      const sharesInTarget = getGroupShares(targetGroupId, draggingId)
      if (sharesInTarget + donation.sharesCount > 7) {
        alert('Bu grupta yeterli kapasite yok (maks 7 hisse)')
        setDragOver(null)
        return
      }
    }

    const prevGroupId = donation.groupId
    setDonations((prev) =>
      prev.map((d) => (d.id === draggingId ? { ...d, groupId: targetGroupId } : d))
    )
    setDragOver(null)
    setDraggingId(null)

    try {
      await assignToGroup(draggingId, targetGroupId)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
      setDonations((prev) =>
        prev.map((d) => (d.id === draggingId ? { ...d, groupId: prevGroupId } : d))
      )
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return
    setCreating(true)
    try {
      await createGroup(newGroupName.trim())
      setNewGroupName('')
      setShowNewGroup(false)
      router.refresh()
    } catch {
      alert('Grup oluşturulamadı')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteGroup(groupId: number, groupName: string) {
    const inGroup = donations.filter((d) => d.groupId === groupId).length
    if (
      !confirm(
        `"${groupName}" grubunu silmek istiyor musunuz?${inGroup > 0 ? ` ${inGroup} bağış grupsuz kalacak.` : ''}`
      )
    )
      return

    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    setDonations((prev) => prev.map((d) => (d.groupId === groupId ? { ...d, groupId: null } : d)))

    try {
      await deleteGroup(groupId)
      router.refresh()
    } catch {
      alert('Grup silinemedi')
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const groupDonations = donations.filter((d) => d.groupId === group.id)
        const totalShares = groupDonations.reduce((s, d) => s + d.sharesCount, 0)
        const isFull = totalShares >= 7
        const isOver = dragOver === group.id

        return (
          <div
            key={group.id}
            className={`rounded-xl border-2 transition-all ${
              isOver
                ? 'border-green-400 bg-green-50'
                : isFull
                ? 'border-green-200 bg-green-50/50'
                : 'border-gray-200 bg-white'
            }`}
            onDragOver={isOwner ? (e) => { e.preventDefault(); setDragOver(group.id) } : undefined}
            onDragLeave={isOwner ? () => setDragOver(null) : undefined}
            onDrop={isOwner ? (e) => { e.preventDefault(); handleDrop(group.id) } : undefined}
          >
            <div className="px-4 py-2.5 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isFull ? 'bg-green-500' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min((totalShares / 7) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isFull ? 'text-green-600' : 'text-gray-400'}`}>
                    {totalShares}/7 {isFull && '✓'}
                  </span>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleDeleteGroup(group.id, group.name)}
                  className="text-red-400 hover:text-red-600 text-xs flex-shrink-0"
                >
                  Sil
                </button>
              )}
            </div>

            <div className="p-2 space-y-1.5 min-h-[44px]">
              {groupDonations.length === 0 && (
                <p className="text-center py-3 text-gray-300 text-xs select-none">
                  Bağış sürükleyin...
                </p>
              )}
              {groupDonations.map((d) => (
                <DonationChip
                  key={d.id}
                  donation={d}
                  isOwner={isOwner}
                  isDragging={draggingId === d.id}
                  onDragStart={() => setDraggingId(d.id)}
                  onDragEnd={() => { setDraggingId(null); setDragOver(null) }}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Ungrouped zone */}
      <div
        className={`rounded-xl border-2 transition-all ${
          dragOver === 'ungrouped'
            ? 'border-orange-300 bg-orange-50'
            : 'border-dashed border-gray-200 bg-gray-50'
        }`}
        onDragOver={isOwner ? (e) => { e.preventDefault(); setDragOver('ungrouped') } : undefined}
        onDragLeave={isOwner ? () => setDragOver(null) : undefined}
        onDrop={isOwner ? (e) => { e.preventDefault(); handleDrop(null) } : undefined}
      >
        <div className="px-4 py-2.5 border-b border-dashed border-gray-200">
          <span className="font-medium text-gray-500 text-sm">
            Grupsuz ({ungrouped.length} bağış ·{' '}
            {ungrouped.reduce((s, d) => s + d.sharesCount, 0)} hisse)
          </span>
        </div>
        <div className="p-2 space-y-1.5 min-h-[44px]">
          {ungrouped.length === 0 ? (
            <p className="text-center py-3 text-gray-300 text-xs select-none">
              Tüm bağışlar gruplandırıldı
            </p>
          ) : (
            ungrouped.map((d) => (
              <DonationChip
                key={d.id}
                donation={d}
                isOwner={isOwner}
                isDragging={draggingId === d.id}
                onDragStart={() => setDraggingId(d.id)}
                onDragEnd={() => { setDraggingId(null); setDragOver(null) }}
              />
            ))
          )}
        </div>
      </div>

      {/* Create group */}
      {isOwner && (
        <div>
          {showNewGroup ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                placeholder="Grup adı (örn: Grup 1)"
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
              className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              + Yeni Grup Oluştur
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DonationChip({
  donation,
  isOwner,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  donation: GroupDonation
  isOwner: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable={isOwner}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border text-sm transition-all select-none ${
        isDragging ? 'opacity-40 scale-95 shadow-lg' : 'hover:shadow-sm'
      } ${isOwner ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {isOwner && (
        <span className="text-gray-300 text-base leading-none">⠿</span>
      )}
      <span className="flex-1 font-medium text-gray-700 truncate">{donation.ownerName}</span>
      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
        {donation.sharesCount}h
      </span>
      <span
        className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
          donation.sharesType === 'BUYUKBAS'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-purple-100 text-purple-700'
        }`}
      >
        {donation.sharesType === 'BUYUKBAS' ? 'BB' : 'KB'}
      </span>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {donation.country === 'CAD' ? '🇹🇩' : '🇹🇿'}
      </span>
    </div>
  )
}
