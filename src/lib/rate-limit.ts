import { buildRedisKey, getRedisClient } from '@/lib/redis';

/** 基于 Redis 的限流器，适用于多实例部署下的登录、搜索和浏览量接口保护。 */

interface RateLimitOptions {
  /** 单个时间窗口内允许通过的最大请求数。 */
  max: number;
  /** 时间窗口长度，单位为毫秒。 */
  windowMs: number;
}

/**
 * 创建一个按 key 计数的限流器。
 * key 通常由客户端 IP 或 "IP + 路由" 组合而成，用来区分不同访问方和接口。
 */
export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs } = options;

  return {
    /**
     * 检查给定 key 是否还能在当前窗口内继续请求。
     * 返回 `true` 表示放行，返回 `false` 表示命中限流。
     */
    async check(key: string): Promise<boolean> {
      const redis = getRedisClient();
      const redisKey = buildRedisKey('rate-limit', key);
      const count = await redis.incr(redisKey);

      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      } else if ((await redis.pttl(redisKey)) < 0) {
        // 极端情况下 key 没有 TTL 时补上过期时间，避免限流计数永久滞留。
        await redis.pexpire(redisKey, windowMs);
      }

      return count <= max;
    },
  };
}

// ─── 预定义限流器 ───

/** 登录接口：5 次/分钟/IP */
export const loginLimiter = rateLimit({ max: 5, windowMs: 60 * 1000 });

/** 浏览量记录：1 次/秒/IP */
export const viewsLimiter = rateLimit({ max: 1, windowMs: 1000 });

/** 搜索接口：30 次/分钟/IP */
export const searchLimiter = rateLimit({ max: 30, windowMs: 60 * 1000 });

/** 通用 API：60 次/分钟/IP */
export const apiLimiter = rateLimit({ max: 60, windowMs: 60 * 1000 });

/**
 * 从请求头中提取客户端 IP。
 * 优先读取反向代理常用头；本地开发或无法识别来源时回退到本机地址。
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}
