'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminCollection } from '@/lib/admin/client';

/**
 * 后台资源列表的通用拉取 Hook。
 *
 * categories、tags、friend-links 这类后台管理页都遵循同一模式：
 * 首屏拉列表、维护 loading 状态、保存或删除后刷新。
 * 这里先只抽这部分共性，不介入表单字段和业务提示文案。
 */
export function useAdminResourceList<T>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);

    fetchAdminCollection<{ data?: T[] }>(endpoint)
      .then((result) => {
        if (!result.ok) {
          console.error(result.error);
          setItems([]);
          return;
        }

        setItems(result.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    const timeout = setTimeout(refresh, 0);
    return () => clearTimeout(timeout);
  }, [refresh]);

  return {
    items,
    loading,
    refresh,
    setItems,
  };
}
