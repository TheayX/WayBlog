'use client';

import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * 管理后台登录页。
 *
 * 负责接收管理员邮箱与密码，并通过 NextAuth credentials 流程建立后台会话；
 * 页面本身不处理权限分级，只关注登录成功与失败反馈。
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('邮箱或密码错误');
      return;
    }

    router.push('/admin/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="page-shell flex min-h-[calc(100vh-4rem)] items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_28rem]">
          <section className="page-frame hidden px-8 py-10 lg:block">
            <p className="eyebrow">Way Admin</p>
            <h1 className="editorial-title mt-4 text-6xl font-semibold leading-tight text-foreground">
              后台入口保持克制，但必须足够正式。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              登录页不再只是一个默认卡片，而是和整个后台保持统一气质：清晰、稳定、偏编辑型，而不是通用模板风。
            </p>
          </section>

          <section className="page-frame mx-auto w-full max-w-md px-6 py-8 sm:px-8">
            <div className="text-center">
              <p className="eyebrow">Admin Login</p>
              <h2 className="mt-3 text-3xl font-semibold text-foreground">登录后台管理</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                使用管理员邮箱和密码进入内容控制台。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {error && (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-accent" />
                  邮箱
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="admin@wayblog.local"
                />
              </label>

              <label className="block space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <LockKeyhole className="h-4 w-4 text-accent" />
                  密码
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '登录中...' : '进入后台'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
