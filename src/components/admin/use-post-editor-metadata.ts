'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchAdminCollection } from '@/lib/admin/client';

export interface PostCategoryOption {
  id: string;
  name: string;
  slug?: string;
}

export interface PostTagOption {
  id: string;
  name: string;
  slug?: string;
}

/**
 * 文章编辑页的分类/标签选项加载 Hook。
 *
 * 文章编辑表单和 AI 助手都依赖这两组元数据；
 * 单独抽出后可以避免 PostForm 同时承担“表单状态”和“后台元数据拉取”两类职责。
 */
export function usePostEditorMetadata() {
  const [categories, setCategories] = useState<PostCategoryOption[]>([]);
  const [tags, setTags] = useState<PostTagOption[]>([]);

  const refresh = useCallback(() => {
    Promise.all([
      fetchAdminCollection<{ data?: PostCategoryOption[] }>('/api/categories'),
      fetchAdminCollection<{ data?: PostTagOption[] }>('/api/tags'),
    ]).then(([categoryResult, tagResult]) => {
      setCategories(categoryResult.data || []);
      setTags(tagResult.data || []);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    categories,
    tags,
    refresh,
  };
}
