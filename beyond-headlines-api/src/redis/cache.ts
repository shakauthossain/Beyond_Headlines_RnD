import crypto from 'crypto';
import { redis } from './client';

export const makeKey = (prefix: string, content: string): string => {
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `${prefix}:${hash}`;
};

export const getCached = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? (JSON.parse(data) as T) : null;
};

export const setCached = async (key: string, value: unknown, ttl: number): Promise<void> => {
  await redis.setex(key, ttl, JSON.stringify(value));
};

export const deleteCached = async (key: string): Promise<void> => {
  await redis.del(key);
};
