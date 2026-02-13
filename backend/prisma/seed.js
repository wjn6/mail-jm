const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const existingDefaultRule = await prisma.pricingRule.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefaultRule) {
    await prisma.pricingRule.create({
      data: {
        name: 'Per-use pricing',
        type: 'PER_USE',
        price: 0.1,
        description: 'Charge 0.10 per get-email request',
        isDefault: true,
        status: 'ACTIVE',
      },
    });
  }

  await prisma.upstreamSource.upsert({
    where: { name: 'GongXi Mail' },
    update: {},
    create: {
      name: 'GongXi Mail',
      type: 'gongxi',
      baseUrl: process.env.GONGXI_BASE_URL || 'http://localhost:3000',
      apiKey: process.env.GONGXI_API_KEY || 'sk_your_gongxi_api_key',
      status: 'ACTIVE',
      priority: 10,
      config: {},
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
