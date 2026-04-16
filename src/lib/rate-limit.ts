/**
 * 基于内存的轻量限流器。
 *
 * 适用于当前单机场景下的登录、搜索、浏览量记录等接口保护。
 * 由于状态保存在进程内内存中，因此不适合多实例部署或需要跨节点共享限流状态的场景。
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// 通过定时清理过期窗口，避免长期运行时无效 key 一直滞留在内存中。
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetTime) {
        // 首次访问或窗口已过期时，重新开始计数。
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

