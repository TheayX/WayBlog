import Redis from 'ioredis';

declare global {
  var wayblogRedis: Redis | undefined;
}

/**
 * 获取 Redis 客户端单例。
 * Redis 是运行期基础设施，构建阶段不会主动连接；缺少 REDIS_URL 时在实际使用处明确失败。
 */
export function getRedisClient() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required for Redis-backed runtime features');
  }

  if (!globalThis.wayblogRedis) {
    globalThis.wayblogRedis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
  }

  return globalThis.wayblogRedis;
}

/**
 * 构造项目内 Redis key。
 * 通过统一前缀隔离不同项目，避免共用 Redis 实例时 key 空间互相污染。
 */
export function buildRedisKey(...parts: string[]) {
  const prefix = process.env.REDIS_KEY_PREFIX || 'wayblog';
  return [prefix, ...parts].join(':');
}
