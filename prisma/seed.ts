import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const users = [
  { name: 'Talha', slug: 'talha' },
  { name: 'Ahmet', slug: 'ahmet' },
  { name: 'Enis', slug: 'enis' },
  { name: 'Salih', slug: 'salih' },
  { name: 'Hamza', slug: 'hamza' },
  { name: 'Yahya', slug: 'yahya' },
  { name: 'Yusuf', slug: 'yusuf' },
  { name: 'Emirhan', slug: 'emirhan' },
  { name: 'Malik', slug: 'malik' },
  { name: 'Mürsel', slug: 'mursel' },
  { name: 'Ömer', slug: 'omer' },
]

async function main() {
  console.log('Seed başlatılıyor...')
  for (const user of users) {
    const password = await bcrypt.hash('kurban2025', 10)
    await prisma.user.upsert({
      where: { slug: user.slug },
      update: {},
      create: { ...user, password },
    })
    console.log(`✓ ${user.name} oluşturuldu`)
  }
  console.log('\nSeed tamamlandı!')
  console.log('Tüm kullanıcıların şifresi: kurban2025')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
