'use client';

import { KeyRound, UserRound } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AdminComposerActions,
  AdminFormPanel,
  adminPrimarySubmitClassName,
} from '@/components/admin/AdminCrudLayout';
import { PageIntro } from '@/components/ui/PageIntro';

interface AccountProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

interface ApiErrorResult {
  error?: string;
  details?: Record<string, string[] | undefined>;
}

function getApiErrorMessage(result: ApiErrorResult | null, fallback: string) {
  const firstFieldError = result?.details
    ? Object.values(result.details).flat().find(Boolean)
    : undefined;

  return firstFieldError || result?.error || fallback;
}

/**
 * 管理后台账号设置页。
 *
 * 当前项目采用单管理员模型，因此页面只提供当前账号的资料维护和密码修改；
 * 密码表单提交后立即清空输入，避免明文长期停留在页面状态中。
 */
export default function AdminSettingsPage() {
  const { update } = useSession();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/account')
      .then((response) => response.json())
      .then((result: { data?: AccountProfile }) => {
        const data = result.data;
        if (!data) return;

        setEmail(data.email);
        setName(data.name);
        setAvatar(data.avatar || '');
      })
      .catch(() => toast.error('账号资料加载失败'))
      .finally(() => setLoading(false));
  }, []);

  async function handleProfileSave() {
    if (!email.trim() || !name.trim()) {
      toast.error('邮箱和昵称不能为空');
      return;
    }

    setProfileSaving(true);

    const response = await fetch('/api/admin/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim(),
        avatar: avatar.trim() || null,
      }),
    });
    const result = await response.json().catch(() => null);

    setProfileSaving(false);

    if (!response.ok) {
      toast.error(getApiErrorMessage(result, '账号资料保存失败'));
      return;
    }

    const updated = result.data as AccountProfile;
    await update({
      user: {
        email: updated.email,
        name: updated.name,
        image: updated.avatar,
      },
    });
    toast.success('账号资料已更新');
  }

  async function handlePasswordSave() {
    if (!currentPassword || !newPassword) {
      toast.error('请填写当前密码和新密码');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('新密码至少 8 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    setPasswordSaving(true);

    const response = await fetch('/api/admin/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await response.json().catch(() => null);

    setPasswordSaving(false);

    if (!response.ok) {
      toast.error(getApiErrorMessage(result, '密码修改失败'));
      return;
    }

    resetPasswordForm();
    toast.success('密码已更新');
  }

  function resetPasswordForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordFormOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageIntro eyebrow="Account" title="账号设置" description="账号信息加载中，请稍候。" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Account"
        title="账号设置"
        description="当前后台采用单管理员模型，设置页只负责维护当前账号资料与密码，不承担复杂权限管理。"
        aside={
          <div className="rounded-[1.75rem] border border-border bg-primary px-6 py-6 text-primary-foreground">
            <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">
              Security
            </p>
            <p className="mt-4 text-sm text-primary-foreground/80">建议</p>
            <p className="mt-3 text-sm leading-7 text-primary-foreground/80">
              修改密码后会立即清空表单，避免明文长期停留在页面状态中。
            </p>
          </div>
        }
      />

      <AdminFormPanel title="基础资料" description="维护当前管理员的基础公开信息。">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <UserRound className="h-4 w-4 text-accent" />
              邮箱
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">昵称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-foreground">头像 URL</span>
            <input
              value={avatar}
              onChange={(event) => setAvatar(event.target.value)}
              placeholder="https://..."
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleProfileSave}
            disabled={profileSaving}
            className={`${adminPrimarySubmitClassName} disabled:opacity-50`}
          >
            {profileSaving ? '保存中...' : '保存资料'}
          </button>
        </div>
      </AdminFormPanel>

      <AdminFormPanel
        title="修改密码"
        description="密码修改成功后会立即清空输入框。"
        headerAction={
          <AdminComposerActions
            open={passwordFormOpen}
            saving={passwordSaving}
            itemLabel="密码"
            openLabel="修改密码"
            submitLabel="更新密码"
            onOpen={() => setPasswordFormOpen(true)}
            onSubmit={handlePasswordSave}
            onCollapse={resetPasswordForm}
          />
        }
      >
        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            passwordFormOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0">
            <div className="grid gap-4 pt-1 md:grid-cols-3">
              <label className="space-y-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="h-4 w-4 text-accent" />
                  当前密码
                </span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="请输入当前密码"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">新密码</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="请输入至少 8 位的新密码"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">确认新密码</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="请再次输入新密码"
                  className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>
        </div>
      </AdminFormPanel>
    </div>
  );
}
