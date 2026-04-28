export const config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://bh_user:bh_password@localhost:5432/beyond_headlines',
    },
  },
};
