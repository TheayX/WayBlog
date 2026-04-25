'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Dispatch, SetStateAction } from 'react';
import type { AiOverwritePreviewItem } from '@/components/admin/AiOverwriteConfirmDialog';
import {
  applyAiFields,
  applyAiFieldValue,
  getAiFieldLabel,
  getMatchedCategoryId,
  getMatchedTagIds,
  normalizeFieldResult,
} from '@/components/admin/post-ai-helpers';
import type { AiField, AiFieldResult, AiOptimizeResult } from '@/lib/ai/types';

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface UsePostAiAssistantParams {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: string;
  selectedTagIds: string[];
  categories: CategoryOption[];
  tags: TagOption[];
  setTitle: Dispatch<SetStateAction<string>>;
  setSlug: Dispatch<SetStateAction<string>>;
  setContent: Dispatch<SetStateAction<string>>;
  setExcerpt: Dispatch<SetStateAction<string>>;
  setCategoryId: Dispatch<SetStateAction<string>>;
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;
  setSlugManuallyEdited: Dispatch<SetStateAction<boolean>>;
}

interface TaxonomyAiState {
  selectedCategory: AiOptimizeResult['selectedCategory'];
  betterCategorySuggestion: AiOptimizeResult['betterCategorySuggestion'];
  selectedTags: AiOptimizeResult['selectedTags'];
  newTagSuggestions: AiOptimizeResult['newTagSuggestions'];
  warnings: string[];
}

interface OverwriteConfirmState {
  open: boolean;
  items: AiOverwritePreviewItem[];
}

interface AiOverwritePreviewPayload {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  selectedCategory: AiOptimizeResult['selectedCategory'];
  betterCategorySuggestion: AiOptimizeResult['betterCategorySuggestion'];
  selectedTags: AiOptimizeResult['selectedTags'];
  newTagSuggestions: AiOptimizeResult['newTagSuggestions'];
}

/**
 * 管理后台文章 AI 助手 Hook。
 *
 * 统一收口字段级 AI、整篇 AI、taxonomy 建议和覆盖确认，
 * 避免“抽屉应用”“区块按钮应用”“全部应用”逐渐分叉成多套行为。
 */
export function usePostAiAssistant({
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
}: UsePostAiAssistantParams) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiOptimizeResult | null>(null);
  const [taxonomyAiOpen, setTaxonomyAiOpen] = useState(false);
  const [taxonomyAiState, setTaxonomyAiState] = useState<TaxonomyAiState | null>(null);
  const [overwriteConfirmState, setOverwriteConfirmState] = useState<OverwriteConfirmState>({
    open: false,
    items: [],
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const overwriteConfirmActionRef = useRef<(() => void) | null>(null);
  const overwriteSkipActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      overwriteConfirmActionRef.current = null;
      overwriteSkipActionRef.current = null;
    };
  }, []);

  function buildAiPayload() {
    return {
      title: title.trim(),
      slug: slug.trim(),
      content,
      excerpt: excerpt.trim(),
      categoryId: categoryId || null,
      tagIds: selectedTagIds,
      categories: categories.map((item) => ({ id: item.id, name: item.name })),
      tags: tags.map((item) => ({ id: item.id, name: item.name })),
    };
  }

  function showFieldWarnings(warnings: string[]) {
    if (warnings.length > 0) {
      toast.warning(warnings[0]);
    }
  }

  function cancelAiRequest() {
    if (!abortControllerRef.current) return false;

    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setAiLoading(false);
    toast.message('AI 请求已取消');
    return true;
  }

  function startAiRequest() {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setAiLoading(true);
    return controller;
  }

  function finishAiRequest(controller: AbortController) {
    if (abortControllerRef.current === controller) {
      abortControllerRef.current = null;
      setAiLoading(false);
    }
  }

  function buildPreviewText(value: string, maxLength = 120) {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return '（空）';
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  function resultSlugPreview(nextSlug?: string) {
    return nextSlug?.trim() || '（空）';
  }

  function getOverwritePreviewItems(fields: AiField[], result: AiOverwritePreviewPayload) {
    const items: AiOverwritePreviewItem[] = [];
    const currentTitle = title.trim();
    const nextTitle = (result.title || '').trim();
    const currentSlug = slug.trim();
    const nextSlug = (result.slug || '').trim();
    const currentContent = content.trim();
    const nextContent = (result.content || '').trim();
    const shouldConfirmIdentity =
      (fields.includes('identity') || (fields.includes('title') && fields.includes('slug'))) &&
      ((currentTitle && nextTitle && currentTitle !== nextTitle) ||
        (currentSlug && nextSlug && currentSlug !== nextSlug));

    if (shouldConfirmIdentity) {
      items.push({
        key: 'identity',
        title: '标题与 slug',
        description: '继续后会覆盖当前标题，并同步更新 slug。',
        currentLabel: '当前内容',
        currentValue: `标题：${buildPreviewText(currentTitle, 80)}\nSlug：${currentSlug || '（空）'}`,
        nextLabel: 'AI 建议',
        nextValue: `标题：${buildPreviewText(nextTitle, 80)}\nSlug：${resultSlugPreview(nextSlug)}`,
      });
    } else if (fields.includes('title') && currentTitle && nextTitle && currentTitle !== nextTitle) {
      items.push({
        key: 'title',
        title: '标题',
        description: '继续后会覆盖当前标题。',
        currentLabel: '当前标题',
        currentValue: buildPreviewText(currentTitle, 80),
        nextLabel: 'AI 标题',
        nextValue: buildPreviewText(nextTitle, 80),
      });
    } else if (fields.includes('slug') && currentSlug && nextSlug && currentSlug !== nextSlug) {
      items.push({
        key: 'slug',
        title: 'Slug',
        description: '继续后会覆盖当前 Slug。',
        currentLabel: '当前 Slug',
        currentValue: currentSlug,
        nextLabel: 'AI Slug',
        nextValue: nextSlug,
      });
    }

    if (fields.includes('content') && currentContent && nextContent && currentContent !== nextContent) {
      items.push({
        key: 'content',
        title: '正文',
        description: '继续后会覆盖当前正文内容。',
        currentLabel: '当前正文',
        currentValue: buildPreviewText(currentContent, 220),
        nextLabel: 'AI 正文',
        nextValue: buildPreviewText(nextContent, 220),
      });
    }

    return items;
  }

  function openOverwriteConfirmation(
    items: AiOverwritePreviewItem[],
    onConfirm: () => void,
    onSkipOverwrite: () => void,
  ) {
    overwriteConfirmActionRef.current = onConfirm;
    overwriteSkipActionRef.current = onSkipOverwrite;
    setOverwriteConfirmState({
      open: true,
      items,
    });
  }

  function closeOverwriteConfirmation() {
    overwriteConfirmActionRef.current = null;
    overwriteSkipActionRef.current = null;
    setOverwriteConfirmState({
      open: false,
      items: [],
    });
  }

  function confirmOverwrite() {
    const action = overwriteConfirmActionRef.current;
    closeOverwriteConfirmation();
    action?.();
  }

  function skipOverwrite() {
    const action = overwriteSkipActionRef.current;
    closeOverwriteConfirmation();
    action?.();
  }

  function buildNormalizedResult(
    result: Partial<
      Pick<
        AiOptimizeResult,
        | 'title'
        | 'slug'
        | 'content'
        | 'excerpt'
        | 'selectedCategory'
        | 'betterCategorySuggestion'
        | 'selectedTags'
        | 'newTagSuggestions'
      >
    >,
  ) {
    return {
      title: result.title || '',
      slug: result.slug || '',
      content: result.content || '',
      excerpt: result.excerpt || '',
      selectedCategory: result.selectedCategory || null,
      betterCategorySuggestion: result.betterCategorySuggestion || null,
      selectedTags: result.selectedTags || [],
      newTagSuggestions: result.newTagSuggestions || [],
    };
  }

  function applySingleField(
    field: AiField,
    result: Partial<
      Pick<
        AiOptimizeResult,
        | 'title'
        | 'slug'
        | 'content'
        | 'excerpt'
        | 'selectedCategory'
        | 'betterCategorySuggestion'
        | 'selectedTags'
        | 'newTagSuggestions'
      >
    >,
  ) {
    const applyResult = applyAiFieldValue(field, result, categories, tags, {
      setTitle,
      setSlug,
      setContent,
      setExcerpt,
      setCategoryId,
      setSelectedTagIds,
      setSlugManuallyEdited,
    });

    if (!applyResult.success) {
      toast.warning(
        applyResult.reason === 'category'
          ? 'AI 这次更偏向新增分类建议，当前没有可直接应用的现有分类。'
          : 'AI 这次没有可直接应用的现有标签，请查看新增标签建议。',
      );
      return false;
    }

    return true;
  }

  /**
   * 统一判断当前 AI 结果是否需要先走覆盖确认弹窗。
   * 只有在字段本身已有值且 AI 建议会改写它时，才进入二次确认。
   */
  function resolveOverwriteItems(
    fields: AiField[],
    result: AiOverwritePreviewPayload,
    options?: { confirmed?: boolean },
  ) {
    return options?.confirmed ? [] : getOverwritePreviewItems(fields, result);
  }

  function applyFieldSuggestion(
    field: AiField,
    result: Partial<
      Pick<
        AiOptimizeResult,
        | 'title'
        | 'slug'
        | 'content'
        | 'excerpt'
        | 'selectedCategory'
        | 'betterCategorySuggestion'
        | 'selectedTags'
        | 'newTagSuggestions'
      >
    >,
    options?: { confirmed?: boolean },
  ) {
    const normalized = buildNormalizedResult(result);
    const overwriteFields: AiField[] = field === 'identity' ? ['identity'] : [field];
    const overwriteItems = resolveOverwriteItems(overwriteFields, normalized, options);

    if (overwriteItems.length > 0) {
      openOverwriteConfirmation(
        overwriteItems,
        () => applyFieldSuggestion(field, result, { confirmed: true }),
        () => {
          toast.message('已跳过这次覆盖项');
        },
      );
      return;
    }

    const targetField = field === 'identity' ? 'identity' : field;
    if (!applySingleField(targetField, result)) return;

    toast.success(`已应用 ${getAiFieldLabel(targetField)} 建议`);
  }

  function applyFieldResult(result: AiFieldResult, options?: { confirmed?: boolean }) {
    showFieldWarnings(result.warnings);
    const normalized = normalizeFieldResult(result);
    const overwriteItems = resolveOverwriteItems([result.field], normalized, options);

    if (overwriteItems.length > 0) {
      openOverwriteConfirmation(
        overwriteItems,
        () => applyFieldResult(result, { confirmed: true }),
        () => {
          toast.message('已跳过这次覆盖项');
        },
      );
      return;
    }

    if (!applySingleField(result.field, normalized)) return;

    if (result.field === 'content') {
      toast.success('已应用正文建议，当前正文已被覆盖');
      return;
    }

    toast.success(`已应用 ${getAiFieldLabel(result.field)} 建议`);
  }

  function applyAllAi(options?: { confirmed?: boolean; skipOverwrite?: boolean }) {
    if (!aiResult) return;

    const allFields: AiField[] = ['title', 'slug', 'content', 'excerpt', 'category', 'tags'];
    const overwriteItems =
      options?.skipOverwrite ? [] : resolveOverwriteItems(allFields, aiResult, options);

    if (overwriteItems.length > 0) {
      openOverwriteConfirmation(
        overwriteItems,
        () => applyAllAi({ confirmed: true }),
        () => applyAllAi({ skipOverwrite: true }),
      );
      return;
    }

    const fieldsToApply: AiField[] = options?.skipOverwrite
      ? allFields.filter(
          (field): field is AiField =>
            field !== 'title' && field !== 'slug' && field !== 'content',
        )
      : allFields;

    if (fieldsToApply.length === 0) {
      toast.message('已跳过这次覆盖项');
      return;
    }

    const applyResult = applyAiFields(fieldsToApply, aiResult, categories, tags, {
      setTitle,
      setSlug,
      setContent,
      setExcerpt,
      setCategoryId,
      setSelectedTagIds,
      setSlugManuallyEdited,
    });

    showFieldWarnings(aiResult.warnings);
    if (!applyResult.success) {
      toast.success('主要 AI 建议已应用；无法直接应用的分类或标签请结合新增建议人工确认。');
      return;
    }

    toast.success(
      options?.skipOverwrite ? '已跳过覆盖项，并应用其他 AI 建议' : '已应用全部 AI 建议',
    );
  }

  function canRunFieldAi(field: AiField) {
    switch (field) {
      case 'identity':
        if (title.trim() || content.trim()) return true;
        toast.warning('请先填写标题或正文，再生成标题与链接建议。');
        return false;
      case 'title':
        if (title.trim() || content.trim()) return true;
        toast.warning('请先填写标题或正文，再优化标题。');
        return false;
      case 'slug':
        if (title.trim() || content.trim()) return true;
        toast.warning('请先填写标题或正文，再生成 Slug。');
        return false;
      case 'content':
      case 'excerpt':
      case 'category':
      case 'tags':
        if (content.trim()) return true;
        toast.warning('请先填写正文后再使用这个 AI 功能。');
        return false;
    }
  }

  async function fetchFieldAi(field: AiField, signal: AbortSignal) {
    const res = await fetch('/api/ai/field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        field,
        ...buildAiPayload(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error('AI 处理暂时不可用，请稍后重试。');
    }

    return data.data as AiFieldResult;
  }

  async function requestAiSuggestions() {
    if (aiLoading) {
      cancelAiRequest();
      return;
    }

    if (!content.trim()) {
      toast.warning('请先填写正文后再使用 AI 优化。');
      return;
    }

    const controller = startAiRequest();

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(buildAiPayload()),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error('AI 优化暂时不可用，请稍后重试。');
        return;
      }

      setAiResult(data.data as AiOptimizeResult);
      setAiOpen(true);
      toast.success('AI 建议已生成');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error(error);
      toast.error('AI 服务调用失败，请稍后重试。');
    } finally {
      finishAiRequest(controller);
    }
  }

  async function requestFieldAi(field: AiField) {
    if (aiLoading) {
      cancelAiRequest();
      return;
    }

    if (!canRunFieldAi(field)) return;

    const controller = startAiRequest();

    try {
      const result = await fetchFieldAi(field, controller.signal);
      applyFieldResult(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error(error);
      toast.error(error instanceof Error ? error.message : 'AI 服务调用失败，请稍后重试。');
    } finally {
      finishAiRequest(controller);
    }
  }

  async function requestIdentityAi() {
    await requestFieldAi('identity');
  }

  async function requestContentSectionAi() {
    if (content.trim().length < 120) {
      toast.warning('正文内容过短，暂不建议直接用 AI 重写正文。请先补充到至少一小段完整内容。');
      return;
    }

    await requestFieldAi('content');
  }

  async function requestSummarySectionAi() {
    if (content.trim().length < 60) {
      toast.warning('请先补充更完整的正文，再生成摘要建议。');
      return;
    }

    await requestFieldAi('excerpt');
  }

  async function requestTaxonomyAi() {
    if (aiLoading) {
      cancelAiRequest();
      return;
    }

    if (!canRunFieldAi('category') || !canRunFieldAi('tags')) return;

    const controller = startAiRequest();

    try {
      const [categoryResult, tagsResult] = await Promise.all([
        fetchFieldAi('category', controller.signal),
        fetchFieldAi('tags', controller.signal),
      ]);

      const warnings = Array.from(new Set([...categoryResult.warnings, ...tagsResult.warnings]));
      showFieldWarnings(warnings);
      setTaxonomyAiState({
        selectedCategory: categoryResult.selectedCategory || null,
        betterCategorySuggestion: categoryResult.betterCategorySuggestion || null,
        selectedTags: tagsResult.selectedTags || [],
        newTagSuggestions: tagsResult.newTagSuggestions || [],
        warnings,
      });
      setTaxonomyAiOpen(true);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error(error);
      toast.error(error instanceof Error ? error.message : 'AI 服务调用失败，请稍后重试。');
    } finally {
      finishAiRequest(controller);
    }
  }

  return {
    aiLoading,
    aiOpen,
    aiResult,
    taxonomyAiOpen,
    taxonomyAiState,
    overwriteConfirmState,
    setAiOpen,
    setTaxonomyAiOpen,
    confirmOverwrite,
    skipOverwrite,
    closeOverwriteConfirmation,
    buildAiPayload,
    showFieldWarnings,
    getMatchedCategoryId: (result: { selectedCategory?: AiOptimizeResult['selectedCategory'] }) =>
      getMatchedCategoryId(categories, result),
    getMatchedTagIds: (result: { selectedTags?: AiOptimizeResult['selectedTags'] }) =>
      getMatchedTagIds(tags, result),
    applyFieldResult,
    applyFieldSuggestion,
    applyAllAi,
    canRunFieldAi,
    requestAiSuggestions,
    requestFieldAi,
    requestIdentityAi,
    requestContentSectionAi,
    requestSummarySectionAi,
    requestTaxonomyAi,
    cancelAiRequest,
  };
}
