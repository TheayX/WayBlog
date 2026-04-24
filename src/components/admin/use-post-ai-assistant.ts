'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Dispatch, SetStateAction } from 'react';
import type { AiField, AiFieldResult, AiOptimizeResult, AiSuggestionTag } from '@/lib/ai/types';
import {
  applyAiFieldValue,
  getAiFieldLabel,
  getMatchedCategoryId,
  getMatchedTagIds,
  normalizeFieldResult,
} from '@/components/admin/post-ai-helpers';

/**
 * 管理后台文章 AI 助手 Hook。
 *
 * 负责封装 AI 请求、字段级应用、分类/标签归一化匹配与交互提示，
 * 让 PostForm 只关心界面编排，不直接承载 AI 返回结构的解释细节。
 * 当前同时服务“整篇优化抽屉”“区块级直接回填”和“分类标签建议弹窗”三条交互链路。
 */
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
  categorySuggestion: AiOptimizeResult['categorySuggestion'];
  tagSuggestions: AiSuggestionTag[];
  warnings: string[];
}

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

  function buildAiPayload() {
    // 统一在 Hook 内收敛请求体形状，避免表单与不同 AI 入口各自拼装导致字段漂移。
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

  function applyFieldSuggestion(
    field: AiField,
    result: Pick<
      AiOptimizeResult,
      'title' | 'slug' | 'content' | 'excerpt' | 'categorySuggestion' | 'tagSuggestions'
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
          ? 'AI 暂未匹配到现有分类，请手动确认。'
          : 'AI 暂未匹配到现有标签，请手动确认。',
      );
      return;
    }

    toast.success(`已应用${getAiFieldLabel(field)}建议`);
  }

  function applyFieldResult(result: AiFieldResult) {
    showFieldWarnings(result.warnings);
    const normalized = normalizeFieldResult(result);
    const applyResult = applyAiFieldValue(result.field, normalized, categories, tags, {
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
          ? 'AI 暂未匹配到现有分类，请手动确认。'
          : 'AI 暂未匹配到现有标签，请手动确认。',
      );
      return;
    }

    if (result.field === 'content') {
      toast.success('已应用正文建议，当前正文已被覆盖');
      return;
    }

    toast.success(`已应用${getAiFieldLabel(result.field)}建议`);
  }

  function applyAllAi() {
    if (!aiResult) return;

    // 全量应用会覆盖当前表单内容，因此只在用户显式确认后从抽屉触发。
    setTitle(aiResult.title);
    setSlug(aiResult.slug);
    setSlugManuallyEdited(true);
    setContent(aiResult.content);
    setExcerpt(aiResult.excerpt);

    const matchedCategoryId = getMatchedCategoryId(categories, aiResult);
    if (matchedCategoryId) {
      setCategoryId(matchedCategoryId);
    }

    const matchedTagIds = getMatchedTagIds(tags, aiResult);
    if (matchedTagIds.length > 0) {
      setSelectedTagIds(matchedTagIds);
    }

    showFieldWarnings(aiResult.warnings);
    toast.success('已应用全部 AI 建议');
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
        // 正文是这些能力的主要语义来源，前置拦截可以减少无意义调用与误导性建议。
        if (content.trim()) return true;
        toast.warning('请先填写正文后再使用这个 AI 功能。');
        return false;
    }
  }

  async function fetchFieldAi(field: AiField) {
    const res = await fetch('/api/ai/field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (!content.trim()) {
      toast.warning('请先填写正文后再使用 AI 优化。');
      return;
    }

    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error(error);
      toast.error('AI 服务调用失败，请稍后重试。');
    } finally {
      setAiLoading(false);
    }
  }

  async function requestFieldAi(field: AiField) {
    if (!canRunFieldAi(field)) return;

    setAiLoading(true);

    try {
      const result = await fetchFieldAi(field);
      applyFieldResult(result);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'AI 服务调用失败，请稍后重试。');
    } finally {
      setAiLoading(false);
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
    if (!canRunFieldAi('category') || !canRunFieldAi('tags')) return;

    setAiLoading(true);

    try {
      const [categoryResult, tagsResult] = await Promise.all([
        fetchFieldAi('category'),
        fetchFieldAi('tags'),
      ]);

      const warnings = Array.from(new Set([...categoryResult.warnings, ...tagsResult.warnings]));
      showFieldWarnings(warnings);
      setTaxonomyAiState({
        categorySuggestion: categoryResult.categorySuggestion || null,
        tagSuggestions: tagsResult.tagSuggestions || [],
        warnings,
      });
      setTaxonomyAiOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'AI 服务调用失败，请稍后重试。');
    } finally {
      setAiLoading(false);
    }
  }

  return {
    aiLoading,
    aiOpen,
    aiResult,
    taxonomyAiOpen,
    taxonomyAiState,
    setAiOpen,
    setTaxonomyAiOpen,
    buildAiPayload,
    showFieldWarnings,
    getMatchedCategoryId: (result: { categorySuggestion?: AiOptimizeResult['categorySuggestion'] }) =>
      getMatchedCategoryId(categories, result),
    getMatchedTagIds: (result: { tagSuggestions?: AiSuggestionTag[] }) =>
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
  };
}
