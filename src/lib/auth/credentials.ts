interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 归一化登录凭据。
 * 只做认证入口需要的最小清洗，避免把空字符串或非字符串值继续传给数据库查询和密码比对。
 */
export function normalizeLoginCredentials(
  credentials: Partial<Record<string, unknown>> | undefined,
) {
  const email = typeof credentials?.email === 'string' ? credentials.email.trim() : '';
  const password = typeof credentials?.password === 'string' ? credentials.password : '';

  if (!email || !password) {
    return null;
  }

  return { email, password } satisfies LoginCredentials;
}
