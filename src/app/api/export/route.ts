import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

  const donations = await prisma.donation.findMany({
    include: { reference: { select: { name: true } } },
    orderBy: [{ reference: { name: 'asc' } }, { createdAt: 'desc' }],
  })

  const rows = donations.map((d, i) => ({
    '#': i + 1,
    'Hisse Sahibi': d.ownerName,
    'Hisse Adedi': d.sharesCount,
    'Hisse Türü': d.sharesType === 'BUYUKBAS' ? 'Büyükbaş' : 'Küçükbaş',
    'Ülke': d.country === 'CAD' ? 'Çad' : 'Tanzanya',
    'Referans (YK)': d.reference.name,
    'Not': d.notes ?? '',
    'Dekont': d.receipt === 'ALINDI' ? 'Alındı' : 'Alınmadı',
    'Tarih': new Date(d.createdAt).toLocaleDateString('tr-TR'),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 4 },   // #
    { wch: 28 },  // Hisse Sahibi
    { wch: 12 },  // Hisse Adedi
    { wch: 12 },  // Hisse Türü
    { wch: 12 },  // Ülke
    { wch: 16 },  // Referans
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
