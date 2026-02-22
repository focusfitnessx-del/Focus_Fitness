const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const existingOwner = await prisma.user.findUnique({
    where: { email: 'admin@focusfitness.lk' },
  });

  if (!existingOwner) {
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);
    await prisma.user.create({
      data: {
        name: 'Admin Owner',
        email: 'admin@focusfitness.lk',
        password: hashedPassword,
        role: 'OWNER',
      },
    });
    console.log('✅ Owner account created: admin@focusfitness.lk / Admin@1234');
  } else {
    console.log('ℹ️  Owner account already exists, skipping.');
  }

  const settings = [
    { key: 'AUTO_EXPIRE_ENABLED', value: 'false' },
    { key: 'MONTHLY_PACKAGE_AMOUNT', value: '3000' },
    { key: 'DUE_DAY', value: '10' },
    { key: 'GYM_NAME', value: 'Focus Fitness' },
    { key: 'REMINDER_DAYS_BEFORE', value: '3' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Default settings seeded.');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
