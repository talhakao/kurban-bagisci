import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { MemberPageClient } from './MemberPageClient'

interface Props {
  params: Promise<{ uye: string }>
}

export async function generateMetadata({ params }: Props) {
  const { uye } = await params
  return { title: `${uye} | Kurban Bağışı` }
}

export default async function MemberPage({ params }: Props) {
  const { uye } = await params
  const session = await getServerSession(authOptions)

  const pageUser = await prisma.user.findUnique({
    where: { slug: uye },
    include: {
      donations: {
        orderBy: { createdAt: 'desc' },
        include: { reference: { select: { name: true, slug: true } } },
      },
      groups: {
        where: { isOzet: false },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!pageUser) notFound()

  const isOwner = session?.user?.slug === uye

  const donations = pageUser.donations.map((d) => ({
    ...d,
    groupId: d.groupId,
    createdAt: d.createdAt.toISOString(),
  }))

  const groups = pageUser.groups.map((g) => ({
    id: g.id,
    name: g.name,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MemberPageClient
        pageUser={{ id: pageUser.id, name: pageUser.name, slug: pageUser.slug }}
        donations={donations}
        groups={groups}
        isOwner={isOwner}
      />
    </div>
  )
}
