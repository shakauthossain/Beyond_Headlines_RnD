import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const clusters = await prisma.cluster.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      headlines: {
        select: { headline: true, content: true }
      }
    }
  });

  console.log(JSON.stringify(clusters, null, 2));
  await prisma.$disconnect();
}

main();
