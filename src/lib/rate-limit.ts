/**
 * 基于内存的滑动窗口 Rate Limiter
 * MVP 阶段足够，不引入 Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// 定期清理过期条目（每 5 分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** 时间窗口内最大请求数 */
  max: number;
  /** 时间窗口（毫秒） */
  windowMs: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs } = options;

  return {
    /**
     * 检查是否超出限流
     * @param key 唯一标识（通常是 IP 或 IP + 端点）
     * @returns true = 允许通过, false = 超出限制
     */
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetTime) {
        store.set(key, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (entry.count >= max) {
        return false;
      }

      entry.count++;
      return true;
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
 * 从请求头中提取客户端 IP
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

