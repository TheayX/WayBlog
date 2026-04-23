'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AiSuggestionDrawer } from '@/components/admin/AiSuggestionDrawer';
import {
  ContentEditorSection,
  PostFormActionBar,
  SummaryCoverSection,
  TaxonomySection,
  TitleSlugSection,
} from '@/components/admin/post-form-sections';
import { usePostEditorMetadata } from '@/components/admin/use-post-editor-metadata';
import { usePostFormState } from '@/components/admin/use-post-form-state';
import { usePostAiAssistant } from '@/components/admin/use-post-ai-assistant';
import { savePost, uploadPostImage } from '@/lib/admin/post-client';
import type { AdminPostEditorData } from '@/lib/posts/queries';

interface PostFormProps {
  initialData?: AdminPostEditorData;
  isEdit?: boolean;
}

/**
 * 管理后台文章编辑表单。
 *
 * 当前组件只负责界面编排，把字段状态、元数据加载和接口调用分别委托给专门 Hook / 客户端辅助层，
 * 避免继续把整个编辑流程压成一个不可维护的大组件。
 */
export function PostForm({ initialData, isEdit = false }: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { categories, tags } = usePostEditorMetadata();
  const {
    title,
    slug,
    content,
    excerpt,
    coverImage,
    status,
    pinned,
    categoryId,
    selectedTagIds,
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
  } = usePostFormState({
    initialData,
    isEdit,
  });

  const {
    aiLoading,
    aiOpen,
    aiResult,
    requestAiSuggestions,
    requestFieldAi,
    applyFieldSuggestion,
    applyAllAi,
    setAiOpen,
    getMatchedCategoryId,
  } = usePostAiAssistant({
    title,
    slug,
    content,
    excerpt,
    categoryId,
    selectedTagIds,
    categories,
    tags,
    setTitle,
    setSlug,
    setContent,
    setExcerpt,
    setCategoryId,
    setSelectedTagIds,
    setSlugManuallyEdited,
  });

  async function handleUploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const result = await uploadPostImage(file);
      if (!result.ok || !result.url) {
        toast.error('图片上传失败');
        return;
      }

      const textarea = document.getElementById('content-editor') as HTMLTextAreaElement | null;

      if (textarea) {
        const start = textarea.selectionStart;
        const before = content.slice(0, start);
        const after = content.slice(start);
        setContent(`${before}![${file.name}](${result.url})${after}`);
      } else {
        setContent((prev) => `${prev}\n![${file.name}](${result.url})`);
      }

      toast.success('图片已上传并插入正文');
    };
    input.click();
  }

  async function handleSave(saveStatus: 'DRAFT' | 'PUBLISHED') {
    if (!title.trim()) {
      toast.error('标题不能为空');
      return;
    }

    if (!slug.trim()) {
      toast.error('Slug 不能为空');
      return;
    }

    setSaving(true);

    const body = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      excerpt: excerpt.trim() || null,
      coverImage: coverImage.trim() || null,
      status: saveStatus,
      pinned,
      categoryId: categoryId || null,
      tagIds: selectedTagIds,
    };

    // 提交前统一做最小归一化，避免把空字符串写入后端，减少 Prisma 层判空分支。
    const result = await savePost(initialData?.id || null, body);

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(saveStatus === 'PUBLISHED' ? '文章已发布' : '草稿已保存');
    router.push('/admin/posts');
    router.refresh();
  }

  function handleSlugInputChange(val: string) {
    if (val === '' || /^[a-z0-9-]+$/.test(val)) {
      handleSlugChange(val);
    } else {
      toast.warning('Slug 只能包含小写字母、数字和连字符');
    }
  }

  const publishButtonLabel = isEdit && status === 'PUBLISHED' ? '更新发布' : '发布文章';
  const matchedCategoryId = aiResult ? getMatchedCategoryId(aiResult) : '';

  return (
    <>
      <div className="space-y-6">
        <TitleSlugSection
          title={title}
          slug={slug}
          aiLoading={aiLoading}
          onTitleChange={handleTitleChange}
          onSlugChange={handleSlugInputChange}
          onOptimizeAll={requestAiSuggestions}
          onOptimizeTitle={() => requestFieldAi('title')}
          onOptimizeSlug={() => requestFieldAi('slug')}
        />

        <ContentEditorSection
          content={content}
          aiLoading={aiLoading}
          onContentChange={setContent}
          onUploadImage={handleUploadImage}
          onOptimizeContent={() => requestFieldAi('content')}
        />

        <SummaryCoverSection
          excerpt={excerpt}
          coverImage={coverImage}
          aiLoading={aiLoading}
          onExcerptChange={setExcerpt}
          onCoverImageChange={setCoverImage}
          onOptimizeExcerpt={() => requestFieldAi('excerpt')}
        />

        <TaxonomySection
          categories={categories}
          tags={tags}
          categoryId={categoryId}
          selectedTagIds={selectedTagIds}
          pinned={pinned}
          aiLoading={aiLoading}
          onCategoryChange={setCategoryId}
          onPinnedChange={setPinned}
          onToggleTag={toggleTag}
          onOptimizeCategory={() => requestFieldAi('category')}
          onOptimizeTags={() => requestFieldAi('tags')}
        />

        <PostFormActionBar
          saving={saving}
          publishButtonLabel={publishButtonLabel}
          onSaveDraft={() => handleSave('DRAFT')}
          onPublish={() => handleSave('PUBLISHED')}
          onCancel={() => router.back()}
        />
      </div>

      <AiSuggestionDrawer
        open={aiOpen}
        result={aiResult}
        matchedCategoryId={matchedCategoryId}
        onClose={() => setAiOpen(false)}
        onApplyField={(field) => {
          if (!aiResult) return;
          applyFieldSuggestion(field, aiResult);
        }}
        onApplyAll={applyAllAi}
      />
    </>
  );
}
