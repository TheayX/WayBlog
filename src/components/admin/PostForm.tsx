'use client';

import { useEffect, useSyncExternalStore, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { AiSuggestionDrawer } from '@/components/admin/AiSuggestionDrawer';
import { AiTaxonomyDialog } from '@/components/admin/AiTaxonomyDialog';
import {
  ContentEditorSection,
  PostAiToolbar,
  PostFormActionBar,
  SummaryCoverSection,
  TaxonomySection,
  TitleSlugSection,
} from '@/components/admin/post-form-sections';
import { usePostEditorMetadata } from '@/components/admin/use-post-editor-metadata';
import { usePostFormState } from '@/components/admin/use-post-form-state';
import { usePostAiAssistant } from '@/components/admin/use-post-ai-assistant';
import { createAdminResource } from '@/lib/admin/client';
import { savePost, uploadPostImage } from '@/lib/admin/post-client';
import { slugify } from '@/lib/utils';
import type { AdminPostEditorData } from '@/lib/posts/queries';

interface PostFormProps {
  initialData?: AdminPostEditorData;
  isEdit?: boolean;
  showToolbar?: boolean;
  toolbarPortalTargetId?: string;
}

function subscribeClientReady() {
  return () => {};
}

function normalizeOptionalText(value: string | null | undefined) {
  return (value || '').trim();
}

function normalizeIdList(value: string[] | null | undefined) {
  return [...(value || [])].sort();
}

function buildSavedSnapshot(data: {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null | undefined;
  coverImage: string | null | undefined;
  pinned: boolean;
  categoryId: string | null | undefined;
  selectedTagIds: string[] | null | undefined;
}) {
  return {
    title: data.title,
    slug: data.slug,
    content: data.content,
    excerpt: normalizeOptionalText(data.excerpt),
    coverImage: normalizeOptionalText(data.coverImage),
    pinned: data.pinned,
    categoryId: data.categoryId || '',
    selectedTagIds: normalizeIdList(data.selectedTagIds),
  };
}

/**
 * 管理后台文章编辑表单。
 *
 * 当前组件只负责界面编排，把字段状态、元数据加载和接口调用分别委托给专门 Hook / 客户端辅助层，
 * 避免继续把整个编辑流程压成一个不可维护的大组件。
 */
export function PostForm({
  initialData,
  isEdit = false,
  showToolbar = true,
  toolbarPortalTargetId,
}: PostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    buildSavedSnapshot({
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      content: initialData?.content || '',
      excerpt: initialData?.excerpt,
      coverImage: initialData?.coverImage,
      pinned: Boolean(initialData?.pinned),
      categoryId: initialData?.categoryId,
      selectedTagIds: initialData?.tagIds || [],
    }),
  );
  const [creatingCategoryNames, setCreatingCategoryNames] = useState<string[]>([]);
  const [creatingTagNames, setCreatingTagNames] = useState<string[]>([]);
  const [dismissedCategorySuggestionNames, setDismissedCategorySuggestionNames] = useState<string[]>([]);
  const [dismissedTagSuggestionNames, setDismissedTagSuggestionNames] = useState<string[]>([]);
  const [promotedCategorySuggestionName, setPromotedCategorySuggestionName] = useState('');
  const [promotedTagSuggestionNames, setPromotedTagSuggestionNames] = useState<string[]>([]);
  const { categories, tags, mergeCategory, mergeTag } = usePostEditorMetadata();
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
    taxonomyAiOpen,
    taxonomyAiState,
    requestAiSuggestions,
    requestIdentityAi,
    requestContentSectionAi,
    requestSummarySectionAi,
    requestTaxonomyAi,
    applyFieldSuggestion,
    applyAllAi,
    setAiOpen,
    setTaxonomyAiOpen,
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

  /**
   * 每次拿到新一轮 AI 结果后，重置本轮已处理建议的本地隐藏状态。
   * 这样旧建议的关闭行为不会污染下一轮结果展示。
   */
  useEffect(() => {
    setDismissedCategorySuggestionNames([]);
    setDismissedTagSuggestionNames([]);
    setPromotedCategorySuggestionName('');
    setPromotedTagSuggestionNames([]);
  }, [aiResult, taxonomyAiState]);

  useEffect(() => {
    setSavedSnapshot(
      buildSavedSnapshot({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        content: initialData?.content || '',
        excerpt: initialData?.excerpt,
        coverImage: initialData?.coverImage,
        pinned: Boolean(initialData?.pinned),
        categoryId: initialData?.categoryId,
        selectedTagIds: initialData?.tagIds || [],
      }),
    );
  }, [initialData]);

  const hasUnsavedChanges =
    title !== savedSnapshot.title ||
    slug !== savedSnapshot.slug ||
    content !== savedSnapshot.content ||
    normalizeOptionalText(excerpt) !== savedSnapshot.excerpt ||
    normalizeOptionalText(coverImage) !== savedSnapshot.coverImage ||
    pinned !== savedSnapshot.pinned ||
    categoryId !== savedSnapshot.categoryId ||
    JSON.stringify(normalizeIdList(selectedTagIds)) !== JSON.stringify(savedSnapshot.selectedTagIds);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges || saving) return;

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, saving]);

  function confirmLeaveWhenDirty() {
    if (!hasUnsavedChanges || saving) return true;

    return confirm('当前页面有未保存改动，确定要离开吗？');
  }

  function blockAiWhenDirty() {
    if (!hasUnsavedChanges) return false;

    toast.warning('当前有未保存改动，请先保存后再使用 AI。');
    return true;
  }

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

  async function handleSave(
    saveStatus: 'DRAFT' | 'PUBLISHED',
    options?: { stayOnPage?: boolean },
  ) {
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

    setSavedSnapshot(
      buildSavedSnapshot({
        title: title.trim(),
        slug: slug.trim(),
        content,
        excerpt,
        coverImage,
        pinned,
        categoryId,
        selectedTagIds,
      }),
    );

    if (options?.stayOnPage) {
      const savedPost = result.data?.data as { id?: string } | null;

      toast.success(saveStatus === 'PUBLISHED' ? '已保存发布内容' : '已保存当前内容');

      if (!initialData?.id && savedPost?.id) {
        router.replace(`/admin/posts/${savedPost.id}/edit`);
      }

      router.refresh();
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

  /**
   * 原地创建前先检查当前编辑页是否已有同名分类。
   * 能直接复用时就不再发创建请求，避免把 taxonomy 弄脏。
   */
  function findExistingCategoryByName(name: string) {
    const normalizedName = name.trim().toLowerCase();
    return categories.find((item) => item.name.trim().toLowerCase() === normalizedName) || null;
  }

  /**
   * 标签按名称做本地查重即可满足当前场景。
   * 这样 AI 建议如果本来就存在，可以直接选中。
   */
  function findExistingTagByName(name: string) {
    const normalizedName = name.trim().toLowerCase();
    return tags.find((item) => item.name.trim().toLowerCase() === normalizedName) || null;
  }

  /**
   * 创建分类后立刻写回当前编辑页选项并应用。
   * 这样用户不需要跳去分类管理页单独补建。
   */
  async function createCategoryAndApply(name: string) {
    const existing = findExistingCategoryByName(name);
    if (existing) {
      setCategoryId(existing.id);
      setDismissedCategorySuggestionNames((prev) => Array.from(new Set([...prev, name])));
      setPromotedCategorySuggestionName(name);
      toast.success(`已应用现有分类「${existing.name}」`);
      return;
    }

    setCreatingCategoryNames((prev) => Array.from(new Set([...prev, name])));

    try {
      const slug = slugify(name).slice(0, 100) || 'category';
      const result = await createAdminResource('/api/categories', {
        name: name.trim(),
        slug,
        description: null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const created = result.data?.data as { id: string; name: string; slug?: string } | null;
      if (!created?.id || !created?.name) {
        toast.error('分类创建成功，但返回数据不完整');
        return;
      }

      mergeCategory(created);
      setCategoryId(created.id);
      setDismissedCategorySuggestionNames((prev) => Array.from(new Set([...prev, name])));
      setPromotedCategorySuggestionName(created.name);
      toast.success(`已创建并应用分类「${created.name}」`);
    } finally {
      setCreatingCategoryNames((prev) => prev.filter((item) => item !== name));
    }
  }

  /**
   * 创建标签后立刻加入候选列表并选中。
   * 已存在时直接复用，减少重复创建。
   */
  async function createTagAndSelect(name: string) {
    const existing = findExistingTagByName(name);
    if (existing) {
      setSelectedTagIds((prev) => Array.from(new Set([...prev, existing.id])));
      setDismissedTagSuggestionNames((prev) => Array.from(new Set([...prev, name])));
      setPromotedTagSuggestionNames((prev) => Array.from(new Set([...prev, name])));
      toast.success(`已选中现有标签「${existing.name}」`);
      return;
    }

    setCreatingTagNames((prev) => Array.from(new Set([...prev, name])));

    try {
      const slug = slugify(name).slice(0, 100) || 'tag';
      const result = await createAdminResource('/api/tags', {
        name: name.trim(),
        slug,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const created = result.data?.data as { id: string; name: string; slug?: string } | null;
      if (!created?.id || !created?.name) {
        toast.error('标签创建成功，但返回数据不完整');
        return;
      }

      mergeTag(created);
      setSelectedTagIds((prev) => Array.from(new Set([...prev, created.id])));
      setDismissedTagSuggestionNames((prev) => Array.from(new Set([...prev, name])));
      setPromotedTagSuggestionNames((prev) => Array.from(new Set([...prev, name])));
      toast.success(`已创建并选中标签「${created.name}」`);
    } finally {
      setCreatingTagNames((prev) => prev.filter((item) => item !== name));
    }
  }

  /**
   * 批量创建时顺序执行，避免并发请求放大冲突概率。
   */
  async function createAllTagsAndSelect(names: string[]) {
    for (const name of names) {
      await createTagAndSelect(name);
    }
  }

  const publishButtonLabel = isEdit && status === 'PUBLISHED' ? '更新发布' : '发布文章';
  const promotedAiCategory =
    aiResult?.betterCategorySuggestion &&
    promotedCategorySuggestionName &&
    aiResult.betterCategorySuggestion.name.trim().toLowerCase() ===
      promotedCategorySuggestionName.trim().toLowerCase()
      ? (() => {
          const existing = findExistingCategoryByName(aiResult.betterCategorySuggestion.name);

          return {
            id: existing?.id,
            name: aiResult.betterCategorySuggestion.name,
            level: aiResult.betterCategorySuggestion.level,
            reason: aiResult.betterCategorySuggestion.reason,
          };
        })()
      : null;
  const promotedTaxonomyCategory =
    taxonomyAiState?.betterCategorySuggestion &&
    promotedCategorySuggestionName &&
    taxonomyAiState.betterCategorySuggestion.name.trim().toLowerCase() ===
      promotedCategorySuggestionName.trim().toLowerCase()
      ? (() => {
          const existing = findExistingCategoryByName(taxonomyAiState.betterCategorySuggestion.name);

          return {
            id: existing?.id,
            name: taxonomyAiState.betterCategorySuggestion.name,
            level: taxonomyAiState.betterCategorySuggestion.level,
            reason: taxonomyAiState.betterCategorySuggestion.reason,
          };
        })()
      : null;
  const filteredAiResult = aiResult
    ? {
        ...aiResult,
        selectedCategory: promotedAiCategory || aiResult.selectedCategory,
        selectedTags: [
          ...aiResult.selectedTags,
          ...aiResult.newTagSuggestions
            .filter((tag) => promotedTagSuggestionNames.includes(tag.name))
            .map((tag) => {
              const existing = findExistingTagByName(tag.name);

              return {
                id: existing?.id,
                name: tag.name,
                level: tag.level,
                reason: tag.reason,
              };
            }),
        ].filter(
          (tag, index, array) =>
            array.findIndex((item) => item.name.trim().toLowerCase() === tag.name.trim().toLowerCase()) ===
            index,
        ),
        betterCategorySuggestion:
          aiResult.betterCategorySuggestion &&
          !dismissedCategorySuggestionNames.includes(aiResult.betterCategorySuggestion.name)
            ? aiResult.betterCategorySuggestion
            : null,
        newTagSuggestions: aiResult.newTagSuggestions.filter(
          (tag) => !dismissedTagSuggestionNames.includes(tag.name),
        ),
      }
    : null;
  const filteredTaxonomyAiState = taxonomyAiState
    ? {
        ...taxonomyAiState,
        selectedCategory: promotedTaxonomyCategory || taxonomyAiState.selectedCategory,
        selectedTags: [
          ...taxonomyAiState.selectedTags,
          ...taxonomyAiState.newTagSuggestions
            .filter((tag) => promotedTagSuggestionNames.includes(tag.name))
            .map((tag) => {
              const existing = findExistingTagByName(tag.name);

              return {
                id: existing?.id,
                name: tag.name,
                level: tag.level,
                reason: tag.reason,
              };
            }),
        ].filter(
          (tag, index, array) =>
            array.findIndex((item) => item.name.trim().toLowerCase() === tag.name.trim().toLowerCase()) ===
            index,
        ),
        betterCategorySuggestion:
          taxonomyAiState.betterCategorySuggestion &&
          !dismissedCategorySuggestionNames.includes(taxonomyAiState.betterCategorySuggestion.name)
            ? taxonomyAiState.betterCategorySuggestion
            : null,
        newTagSuggestions: taxonomyAiState.newTagSuggestions.filter(
          (tag) => !dismissedTagSuggestionNames.includes(tag.name),
        ),
      }
    : null;
  const clientReady = useSyncExternalStore(subscribeClientReady, () => true, () => false);
  const toolbarPortalTarget =
    clientReady && toolbarPortalTargetId
      ? document.getElementById(toolbarPortalTargetId)
      : null;
  const toolbarNode =
    showToolbar || toolbarPortalTarget ? (
      <PostAiToolbar
        aiLoading={aiLoading}
        onOptimizeAllAction={() => {
          if (blockAiWhenDirty()) return;
          void requestAiSuggestions();
        }}
      />
    ) : null;

  return (
    <>
      {toolbarPortalTarget && toolbarNode ? createPortal(toolbarNode, toolbarPortalTarget) : null}

      <div className="space-y-6">
        {showToolbar && !toolbarPortalTarget ? toolbarNode : null}

        <TitleSlugSection
          title={title}
          slug={slug}
          aiLoading={aiLoading}
          onTitleChange={handleTitleChange}
          onSlugChange={handleSlugInputChange}
          onOpenAi={() => {
            if (blockAiWhenDirty()) return;
            void requestIdentityAi();
          }}
        />

        <ContentEditorSection
          content={content}
          aiLoading={aiLoading}
          onContentChange={setContent}
          onUploadImage={handleUploadImage}
          onOpenAi={() => {
            if (blockAiWhenDirty()) return;
            void requestContentSectionAi();
          }}
        />

        <SummaryCoverSection
          excerpt={excerpt}
          coverImage={coverImage}
          aiLoading={aiLoading}
          onExcerptChange={setExcerpt}
          onCoverImageChange={setCoverImage}
          onOpenAi={() => {
            if (blockAiWhenDirty()) return;
            void requestSummarySectionAi();
          }}
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
          onOpenAi={() => {
            if (blockAiWhenDirty()) return;
            void requestTaxonomyAi();
          }}
        />

        <PostFormActionBar
          saving={saving}
          hasUnsavedChanges={hasUnsavedChanges}
          publishButtonLabel={publishButtonLabel}
          onSaveDraft={() => handleSave('DRAFT')}
          onSaveStay={() => handleSave(status, { stayOnPage: true })}
          onPublish={() => handleSave('PUBLISHED')}
          onCancel={() => {
            if (!confirmLeaveWhenDirty()) return;
            router.back();
          }}
        />
      </div>

      <AiSuggestionDrawer
        open={aiOpen}
        result={filteredAiResult}
        currentCategoryId={categoryId}
        currentSelectedTagIds={selectedTagIds}
        creatingCategoryNames={creatingCategoryNames}
        creatingTagNames={creatingTagNames}
        onClose={() => setAiOpen(false)}
        onApplyField={(field) => {
          if (!filteredAiResult) return;
          applyFieldSuggestion(field, filteredAiResult);
        }}
        onApplyAll={applyAllAi}
        onCreateCategoryAndApply={(name) => {
          void createCategoryAndApply(name);
        }}
        onCreateTagAndSelect={(name) => {
          void createTagAndSelect(name);
        }}
        onCreateAllTagsAndSelect={(names) => {
          void createAllTagsAndSelect(names);
        }}
        onToggleSelectedTag={(tagId) => {
          toggleTag(tagId);
        }}
      />

      <AiTaxonomyDialog
        open={taxonomyAiOpen}
        selectedCategory={filteredTaxonomyAiState?.selectedCategory || null}
        betterCategorySuggestion={filteredTaxonomyAiState?.betterCategorySuggestion || null}
        selectedTags={filteredTaxonomyAiState?.selectedTags || []}
        newTagSuggestions={filteredTaxonomyAiState?.newTagSuggestions || []}
        currentCategoryId={categoryId}
        currentSelectedTagIds={selectedTagIds}
        warnings={filteredTaxonomyAiState?.warnings || []}
        creatingCategory={Boolean(
          filteredTaxonomyAiState?.betterCategorySuggestion &&
            creatingCategoryNames.includes(filteredTaxonomyAiState.betterCategorySuggestion.name),
        )}
        creatingTagNames={creatingTagNames}
        canQuickCreateCategory={Boolean(
          filteredTaxonomyAiState?.betterCategorySuggestion &&
            filteredTaxonomyAiState.betterCategorySuggestion.level !== 'weak',
        )}
        canQuickCreateTagNames={(filteredTaxonomyAiState?.newTagSuggestions || [])
          .filter((tag) => tag.level !== 'weak')
          .map((tag) => tag.name)}
        onClose={() => setTaxonomyAiOpen(false)}
        onApplyCategory={() => {
          if (!filteredTaxonomyAiState) return;
          applyFieldSuggestion('category', filteredTaxonomyAiState);
        }}
        onCreateCategoryAndApply={() => {
          const suggestion = filteredTaxonomyAiState?.betterCategorySuggestion;
          if (!suggestion) return;
          void createCategoryAndApply(suggestion.name);
        }}
        onToggleSelectedTag={(tagId) => {
          toggleTag(tagId);
        }}
        onCreateTagAndSelect={(name) => {
          void createTagAndSelect(name);
        }}
        onCreateAllTagsAndSelect={() => {
          const names = (filteredTaxonomyAiState?.newTagSuggestions || [])
            .filter((tag) => tag.level !== 'weak')
            .map((tag) => tag.name);

          void createAllTagsAndSelect(names);
        }}
      />
    </>
  );
}
