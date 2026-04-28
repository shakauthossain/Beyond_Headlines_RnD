import { definePrismaConfig } from '@prisma/internals';

export const config = definePrismaConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://bh_user:bh_password@localhost:5432/beyond_headlines',
    },
  },
});
