import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const clusters = await prisma.cluster.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(JSON.stringify(clusters, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
