'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addSonGunlerEntry(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const user = await prisma.user.findUnique({ where: { slug: session.user.slug } })
  if (!user) throw new Error('Kullanıcı bulunamadı')

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('İsim zorunludur')

  const sharesCount = parseInt(formData.get('sharesCount') as string)
  const sharesType = formData.get('sharesType') as string
  const country = formData.get('country') as string
  const phone = (formData.get('phone') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null
  const receipt = (formData.get('receipt') as string) || 'ALINMADI'

  await prisma.sonGunlerEntry.create({
    data: { name, sharesCount, sharesType, country, phone, notes, receipt, addedById: user.id },
  })

  revalidatePath('/son-gunler')
}

export async function updateSonGunlerEntry(id: number, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const entry = await prisma.sonGunlerEntry.findUnique({
    where: { id },
    include: { addedBy: true },
  })

  if (!entry || entry.addedBy.slug !== session.user.slug) {
    throw new Error('Bu kaydı düzenleme yetkiniz yok')
  }

  const name = (formData.get('name') as string)?.trim()
  if (!name) throw new Error('İsim zorunludur')

  await prisma.sonGunlerEntry.update({
    where: { id },
    data: {
      name,
      sharesCount: parseInt(formData.get('sharesCount') as string),
      sharesType: formData.get('sharesType') as string,
      country: formData.get('country') as string,
      phone: (formData.get('phone') as string)?.trim() || null,
      notes: (formData.get('notes') as string)?.trim() || null,
      receipt: formData.get('receipt') as string,
    },
  })

  revalidatePath('/son-gunler')
  revalidatePath('/ozet')
}

export async function deleteSonGunlerEntry(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const entry = await prisma.sonGunlerEntry.findUnique({
    where: { id },
    include: { addedBy: true },
  })

  if (!entry || entry.addedBy.slug !== session.user.slug) {
    throw new Error('Bu kaydı silme yetkiniz yok')
  }

  await prisma.sonGunlerEntry.delete({ where: { id } })
  revalidatePath('/son-gunler')
}
