import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

  const donations = await prisma.donation.findMany({
    include: {
      reference: { select: { name: true } },
      group: { select: { name: true, isOzet: true } },
    },
    orderBy: [{ group: { name: 'asc' } }, { reference: { name: 'asc' } }, { createdAt: 'desc' }],
  })

  const headers = ['#', 'Grup', 'Hisse Sahibi', 'Hisse Adedi', 'Hisse Türü', 'Ülke', 'Referans (YK)', 'Telefon', 'Not', 'Dekont', 'Tarih']

  const aoa: unknown[][] = [headers]
  let rowNum = 0
  let lastGroup: string | null = undefined as unknown as string | null

  for (const d of donations) {
    const groupName = d.group?.name ?? '-'

    if (lastGroup !== undefined && groupName !== lastGroup) {
      aoa.push([])
    }

    rowNum++
    aoa.push([
      rowNum,
      groupName,
      d.ownerName,
      d.sharesCount,
      d.sharesType === 'BUYUKBAS' ? 'Büyükbaş' : 'Küçükbaş',
      d.country === 'CAD' ? 'Çad' : 'Tanzanya',
      d.reference.name,
      d.phone ?? '',
      d.notes ?? '',
      d.receipt === 'ALINDI' ? 'Alındı' : 'Alınmadı',
      new Date(d.createdAt).toLocaleDateString('tr-TR'),
    ])

    lastGroup = groupName
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)

  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 18 },  // Grup
    { wch: 28 },  // Hisse Sahibi
    { wch: 12 },  // Hisse Adedi
    { wch: 12 },  // Hisse Türü
    { wch: 12 },  // Ülke
    { wch: 16 },  // Referans
    { wch: 16 },  // Telefon
    { wch: 30 },  // Not
    { wch: 12 },  // Dekont
    { wch: 12 },  // Tarih
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bağışlar')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="kurban-bagislari-${date}.xlsx"`,
    },
  })
}
