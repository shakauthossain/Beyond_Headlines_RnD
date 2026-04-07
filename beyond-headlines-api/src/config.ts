import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // OpenRouter (single key for all AI models)
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  claudeSonnetModel: process.env.CLAUDE_SONNET_MODEL || 'anthropic/claude-sonnet-4-5',
  claudeHaikuModel:  process.env.CLAUDE_HAIKU_MODEL  || 'anthropic/claude-haiku-4-5',
  perplexitySonarModel: process.env.PERPLEXITY_SONAR_MODEL || 'perplexity/sonar-pro',

  // Worker intervals & cache TTLs
  scrapeIntervalMs: parseInt(process.env.SCRAPE_INTERVAL_MS || '1800000', 10),
  clusterCacheTtl:  parseInt(process.env.CLUSTER_CACHE_TTL  || '1800',    10),
  researchCacheTtl: parseInt(process.env.RESEARCH_CACHE_TTL || '7200',    10),
};
