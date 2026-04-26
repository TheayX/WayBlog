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

  /**
   * 将新建项原地并入当前编辑页选项列表。
   * 这里按 id 和名称双重去重，避免并发创建或刷新回写时出现重复项。
   */
  const mergeCategory = useCallback((item: PostCategoryOption) => {
    setCategories((prev) => {
      const exists = prev.some(
        (current) =>
          current.id === item.id || current.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
      );

      if (exists) return prev;
      return [...prev, item].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    });
  }, []);

  /**
   * 标签和分类一样走本地并入，保证创建成功后不用刷新页面也能立即可选。
   */
  const mergeTag = useCallback((item: PostTagOption) => {
    setTags((prev) => {
      const exists = prev.some(
        (current) =>
          current.id === item.id || current.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
      );

      if (exists) return prev;
      return [...prev, item].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    });
  }, []);

  const refresh = useCallback(() => {
    Promise.all([
      fetchAdminCollection<{ data?: PostCategoryOption[] }>('/api/admin/categories'),
      fetchAdminCollection<{ data?: PostTagOption[] }>('/api/admin/tags'),
    ]).then(([categoryResult, tagResult]) => {
      if (categoryResult.ok) setCategories(categoryResult.data.data || []);
      if (tagResult.ok) setTags(tagResult.data.data || []);

      if (!categoryResult.ok) console.error(categoryResult.error);
      if (!tagResult.ok) console.error(tagResult.error);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    categories,
    tags,
    refresh,
    mergeCategory,
    mergeTag,
  };
}
