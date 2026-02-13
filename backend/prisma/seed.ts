import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. 创建默认管理员
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

  // 2. 创建默认计费规则（先检查是否存在，避免依赖 autoincrement id）
  const existingDefaultRule = await prisma.pricingRule.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefaultRule) {
    await prisma.pricingRule.create({
      data: {
        name: '按次计费',
        type: 'PER_USE',
        price: 0.10,
        description: '每次获取邮箱接码扣费 0.10 元',
        isDefault: true,
        status: 'ACTIVE',
      },
    });
  }

  // 3. 创建默认上游源（UpstreamSource 的 name 是 unique 的）
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

  console.log('✅ Seed data created successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
