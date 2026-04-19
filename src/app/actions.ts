'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addDonation(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const user = await prisma.user.findUnique({
    where: { slug: session.user.slug },
  })
  if (!user) throw new Error('Kullanıcı bulunamadı')

  const ownerName = formData.get('ownerName') as string
  const sharesCount = parseInt(formData.get('sharesCount') as string)
  const sharesType = formData.get('sharesType') as string
  const country = formData.get('country') as string
  const notes = (formData.get('notes') as string) || null
  const receipt = formData.get('receipt') as string

  if (!ownerName || !sharesCount || !sharesType || !country || !receipt) {
    throw new Error('Zorunlu alanlar eksik')
  }

  await prisma.donation.create({
    data: {
      ownerName,
      sharesCount,
      sharesType,
      country,
      referenceId: user.id,
      notes,
      receipt,
    },
  })

  revalidatePath(`/${session.user.slug}`)
  revalidatePath('/ozet')
}

export async function deleteDonation(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: { reference: true },
  })

  if (!donation || donation.reference.slug !== session.user.slug) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  await prisma.donation.delete({ where: { id } })

  revalidatePath(`/${session.user.slug}`)
  revalidatePath('/ozet')
}
