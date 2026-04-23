'use client';

import { useState } from 'react';
import type { AdminPostEditorData } from '@/lib/posts/queries';
import { slugify } from '@/lib/utils';

interface UsePostFormStateParams {
  initialData?: AdminPostEditorData;
  isEdit: boolean;
}

/**
 * 文章表单字段状态。
 *
 * 这里专门收敛文章基础字段和交互规则，例如“新建时标题驱动 slug 自动生成”、
 * “标签切换使用集合语义”等，避免这些状态细节继续堆在 PostForm 组件主体里。
 */
export function usePostFormState({ initialData, isEdit }: UsePostFormStateParams) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [status] = useState<'DRAFT' | 'PUBLISHED'>(initialData?.status || 'DRAFT');
  const [pinned, setPinned] = useState(initialData?.pinned || false);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (!slugManuallyEdited && !isEdit) {
      setSlug(slugify(newTitle));
    }
  }

  function handleSlugChange(newSlug: string) {
    setSlug(newSlug);
    setSlugManuallyEdited(true);
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  return {
    title,
    slug,
    content,
    excerpt,
    coverImage,
    status,
    pinned,
    categoryId,
    selectedTagIds,
    slugManuallyEdited,
    setTitle,
    setSlug,
    setContent,
    setExcerpt,
    setCoverImage,
    setPinned,
    setCategoryId,
    setSelectedTagIds,
    setSlugManuallyEdited,
    handleTitleChange,
    handleSlugChange,
    toggleTag,
  };
}
