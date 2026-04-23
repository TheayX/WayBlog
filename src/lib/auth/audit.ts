interface FailedLoginAuditInput {
  email?: string;
  ip: string;
  reason: 'missing-credentials' | 'rate-limited' | 'user-not-found' | 'invalid-password';
}

/**
 * 记录失败登录事件。
 * 当前先输出到服务端日志，后续接入集中日志或告警系统时只需要替换这一层。
 */
export function auditFailedLogin({ email, ip, reason }: FailedLoginAuditInput) {
  const safeEmail = email ? email.toLowerCase() : 'unknown';
  console.warn(`[auth] failed login reason=${reason} email=${safeEmail} ip=${ip}`);
}
