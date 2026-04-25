'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UnsavedChangesGuardDialogState {
  open: boolean;
  eyebrow: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}

interface UseUnsavedChangesGuardParams {
  enabled: boolean;
  leavingDescription?: string;
}

/**
 * 编辑页未保存离开守卫。
 *
 * 统一处理浏览器刷新/关闭、站内链接跳转、以及编辑页内主动离开，
 * 避免同一个“未保存离开”提示散落在按钮、导航和页面事件里重复实现。
 */
export function useUnsavedChangesGuard({
  enabled,
  leavingDescription = '如果继续离开，当前编辑页里尚未保存的改动将会丢失。',
}: UseUnsavedChangesGuardParams) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<UnsavedChangesGuardDialogState | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const bypassPopstateRef = useRef(false);

  const openLeaveDialog = useCallback((description: string, action: () => void) => {
    pendingActionRef.current = action;
    setDialogState({
      open: true,
      eyebrow: 'Unsaved Leave',
      title: '当前页面有未保存改动',
      description,
      confirmLabel: '继续离开',
      cancelLabel: '留在当前页',
    });
  }, []);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!enabled) return;

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);

  useEffect(() => {
    function handleDocumentNavigation(event: MouseEvent) {
      if (!enabled || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) return;

      const anchor =
        target.parentElement?.closest('a[href]') ||
        (target instanceof Element ? target.closest('a[href]') : null);
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;

      const url = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (url.origin !== currentUrl.origin) return;
      if (
        url.pathname === currentUrl.pathname &&
        url.search === currentUrl.search &&
        url.hash === currentUrl.hash
      ) {
        return;
      }

      event.preventDefault();
      openLeaveDialog(
        `如果继续前往 ${url.pathname}，当前编辑页里尚未保存的改动将会丢失。`,
        () => {
          router.push(`${url.pathname}${url.search}${url.hash}`);
        },
      );
    }

    document.addEventListener('click', handleDocumentNavigation, true);
    return () => {
      document.removeEventListener('click', handleDocumentNavigation, true);
    };
  }, [enabled, openLeaveDialog, router]);

  useEffect(() => {
    function handlePopstate() {
      if (!enabled || bypassPopstateRef.current) return;

      // popstate 已经把历史指针切走，这里先回到当前页，再把“是否离开”交给统一弹窗确认。
      bypassPopstateRef.current = true;
      window.history.go(1);
      window.setTimeout(() => {
        bypassPopstateRef.current = false;
      }, 0);

      openLeaveDialog(leavingDescription, () => {
        bypassPopstateRef.current = true;
        window.history.back();
        window.setTimeout(() => {
          bypassPopstateRef.current = false;
        }, 0);
      });
    }

    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [enabled, leavingDescription, openLeaveDialog]);

  function runGuardedNavigation(action: () => void, description?: string) {
    if (!enabled) {
      action();
      return;
    }

    openLeaveDialog(description || leavingDescription, action);
  }

  function confirmNavigation() {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setDialogState(null);
    action?.();
  }

  function cancelNavigation() {
    pendingActionRef.current = null;
    setDialogState(null);
  }

  return {
    dialogState,
    runGuardedNavigation,
    confirmNavigation,
    cancelNavigation,
  };
}
