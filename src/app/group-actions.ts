'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createGroup(name: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const user = await prisma.user.findUnique({ where: { slug: session.user.slug } })
  if (!user) throw new Error('Kullanıcı bulunamadı')

  await prisma.donationGroup.create({
    data: { name, ownerId: user.id, isOzet: false },
  })

  revalidatePath(`/${session.user.slug}`)
}

export async function deleteGroup(groupId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const group = await prisma.donationGroup.findUnique({
    where: { id: groupId },
    include: { owner: true },
  })

  if (!group || group.owner?.slug !== session.user.slug) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  await prisma.donation.updateMany({ where: { groupId }, data: { groupId: null } })
  await prisma.donationGroup.delete({ where: { id: groupId } })

  revalidatePath(`/${session.user.slug}`)
  revalidatePath('/ozet')
}

export async function assignToGroup(donationId: number, groupId: number | null) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: { reference: true },
  })

  if (!donation || donation.reference.slug !== session.user.slug) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  if (groupId !== null) {
    const group = await prisma.donationGroup.findUnique({
      where: { id: groupId },
      include: { donations: true },
    })
    if (!group) throw new Error('Grup bulunamadı')

    const currentShares = group.donations
      .filter((d) => d.id !== donationId)
      .reduce((s, d) => s + d.sharesCount, 0)

    if (currentShares + donation.sharesCount > 7) {
      throw new Error('Grupta yeterli kapasite yok (maks 7 hisse)')
    }
  }

  await prisma.donation.update({ where: { id: donationId }, data: { groupId } })

  revalidatePath(`/${session.user.slug}`)
  revalidatePath('/ozet')
}

export async function renameGroup(groupId: number, name: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const group = await prisma.donationGroup.findUnique({
    where: { id: groupId },
    include: { owner: true },
  })

  if (!group || group.owner?.slug !== session.user.slug) {
    throw new Error('Bu işlem için yetkiniz yok')
  }

  await prisma.donationGroup.update({ where: { id: groupId }, data: { name } })

  revalidatePath(`/${session.user.slug}`)
  revalidatePath('/ozet')
}

export async function renameOzetGroup(groupId: number, name: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const group = await prisma.donationGroup.findUnique({ where: { id: groupId } })
  if (!group || !group.isOzet) throw new Error('Bu işlem için yetkiniz yok')

  await prisma.donationGroup.update({ where: { id: groupId }, data: { name } })

  revalidatePath('/ozet')
}

export async function createOzetGroup(name: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const group = await prisma.donationGroup.create({
    data: { name, ownerId: null, isOzet: true },
  })

  revalidatePath('/ozet')
  return group.id
}

export async function deleteOzetGroup(groupId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const group = await prisma.donationGroup.findUnique({ where: { id: groupId } })
  if (!group || !group.isOzet) throw new Error('Bu işlem için yetkiniz yok')

  await prisma.donation.updateMany({ where: { groupId }, data: { groupId: null } })
  await prisma.donationGroup.delete({ where: { id: groupId } })

  revalidatePath('/ozet')
}

export async function assignToOzetGroup(donationId: number, groupId: number | null) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.slug) throw new Error('Giriş yapılmamış')

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: { group: true },
  })
  if (!donation) throw new Error('Bağış bulunamadı')

  // Only allow moving ungrouped donations or donations from özet groups
  if (donation.group && !donation.group.isOzet) {
    throw new Error('Üye grubundaki bağışlar özetten değiştirilemez')
  }

  if (groupId !== null) {
    const group = await prisma.donationGroup.findUnique({
      where: { id: groupId },
      include: { donations: true },
    })
    if (!group || !group.isOzet) throw new Error('Geçersiz özet grubu')

    const currentShares = group.donations
      .filter((d) => d.id !== donationId)
      .reduce((s, d) => s + d.sharesCount, 0)

    if (currentShares + donation.sharesCount > 7) {
      throw new Error('Grupta yeterli kapasite yok (maks 7 hisse)')
    }
  }

  await prisma.donation.update({ where: { id: donationId }, data: { groupId } })

  revalidatePath('/ozet')
}
