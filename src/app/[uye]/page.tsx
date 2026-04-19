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
    },
  })

  if (!pageUser) notFound()

  const isOwner = session?.user?.slug === uye

  const donations = pageUser.donations.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MemberPageClient
        pageUser={{ id: pageUser.id, name: pageUser.name, slug: pageUser.slug }}
        donations={donations}
        isOwner={isOwner}
      />
    </div>
  )
}
