interface FailedLoginAuditInput {
  email?: string;
  ip: string;
  reason: 'missing-credentials' | 'rate-limited' | 'user-not-found' | 'invalid-password';
}

interface AccountAuditInput {
  userId: string;
  email?: string | null;
}

/**
 * 脱敏邮箱地址。
 * 日志需要能定位大致账号，但不能把完整个人邮箱直接写入终端或集中日志。
 */
export function maskEmail(email?: string | null) {
  if (!email) return 'unknown';

  const [localPart, domain] = email.toLowerCase().split('@');
  if (!domain) return '***';

  const visiblePrefix = localPart.slice(0, 2);
  return `${visiblePrefix}${'*'.repeat(Math.max(localPart.length - 2, 3))}@${domain}`;
}

/** 将敏感字段统一显示为固定掩码，避免日志泄露密码、密钥或 token。 */
export function maskSecret(value?: string | null) {
  return value ? '********' : 'not-set';
}

/**
 * 记录失败登录事件。
 * 当前先输出到服务端日志，后续接入集中日志或告警系统时只需要替换这一层。
 */
export function auditFailedLogin({ email, ip, reason }: FailedLoginAuditInput) {
  const safeEmail = maskEmail(email);
  console.warn(`[auth] failed login reason=${reason} email=${safeEmail} ip=${ip}`);
}

/** 记录管理员资料更新事件。 */
export function auditAccountProfileUpdated({ userId, email }: AccountAuditInput) {
  console.info(`[auth] account profile updated user=${userId} email=${maskEmail(email)}`);
}

/** 记录管理员密码更新事件。 */
export function auditAccountPasswordUpdated({ userId, email }: AccountAuditInput) {
  console.info(`[auth] account password updated user=${userId} email=${maskEmail(email)} password=********`);
}
