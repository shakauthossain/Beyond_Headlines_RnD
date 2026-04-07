import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
  lazyConnect: false,
});

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('error',   (err) => console.error('[Redis] Error:', err.message));
