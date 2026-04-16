'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Dispatch, SetStateAction } from 'react';
import type { AiField, AiFieldResult, AiOptimizeResult, AiSuggestionTag } from '@/lib/ai/types';

/**
 * 管理后台文章 AI 助手 Hook。
 *
 * 负责封装 AI 请求、字段级应用、分类/标签归一化匹配与交互提示，
 * 让 PostForm 只关心界面编排，不直接承载 AI 返回结构的解释细节。
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

  function getMatchedCategoryId(result: { categorySuggestion?: AiOptimizeResult['categorySuggestion'] }) {
    const suggestion = result.categorySuggestion;
    if (!suggestion) return '';

    if (suggestion.id) return suggestion.id;

    const matched = categories.find(
      (item) => item.name.toLowerCase() === suggestion.name.toLowerCase(),
    );

    return matched?.id || '';
  }

  function getMatchedTagIds(result: { tagSuggestions?: AiSuggestionTag[] }) {
    const suggestions = result.tagSuggestions || [];

    const ids = suggestions
      // 仅回填已存在标签；标记为 isNew 的建议保留给人工判断，避免前端伪造不存在的关联 id。
      .filter((item) => !item.isNew)
      .map((item) => {
        if (item.id) return item.id;
        const matched = tags.find((tag) => tag.name.toLowerCase() === item.name.toLowerCase());
        return matched?.id || '';
      })
      .filter(Boolean);

    return Array.from(new Set(ids));
  }

  function applyFieldSuggestion(
    field: AiField,
    result: Pick<
      AiOptimizeResult,
      'title' | 'slug' | 'content' | 'excerpt' | 'categorySuggestion' | 'tagSuggestions'
    >,
  ) {
    switch (field) {
      case 'title':
        setTitle(result.title);
        break;
      case 'slug':
        setSlug(result.slug);
        setSlugManuallyEdited(true);
        break;
      case 'content':
        setContent(result.content);
        break;
      case 'excerpt':
        setExcerpt(result.excerpt);
        break;
      case 'category': {
        const matchedCategoryId = getMatchedCategoryId(result);
        if (!matchedCategoryId) {
          toast.warning('AI 暂未匹配到现有分类，请手动确认。');
          return;
        }
        setCategoryId(matchedCategoryId);
        break;
      }
      case 'tags': {
        const matchedTagIds = getMatchedTagIds(result);
        if (matchedTagIds.length === 0) {
          toast.warning('AI 暂未匹配到现有标签，请手动确认。');
          return;
        }
        setSelectedTagIds(matchedTagIds);
        break;
      }
    }

    toast.success(`已应用${getFieldLabel(field)}建议`);
  }

  function applyFieldResult(result: AiFieldResult) {
    showFieldWarnings(result.warnings);

    switch (result.field) {
      case 'title':
        if (result.value) setTitle(result.value);
        break;
      case 'slug':
        if (result.value) {
          setSlug(result.value);
          setSlugManuallyEdited(true);
        }
        break;
      case 'content':
        if (result.value) setContent(result.value);
        break;
      case 'excerpt':
        if (result.value) setExcerpt(result.value);
        break;
      case 'category': {
        const matchedCategoryId = getMatchedCategoryId(result);
        if (!matchedCategoryId) {
          toast.warning('AI 暂未匹配到现有分类，请手动确认。');
          return;
        }
        setCategoryId(matchedCategoryId);
        break;
      }
      case 'tags': {
        const matchedTagIds = getMatchedTagIds(result);
        if (matchedTagIds.length === 0) {
          toast.warning('AI 暂未匹配到现有标签，请手动确认。');
          return;
        }
        setSelectedTagIds(matchedTagIds);
        break;
      }
    }

    toast.success(`已应用${getFieldLabel(result.field)}建议`);
  }

  function applyAllAi() {
    if (!aiResult) return;

    // 全量应用会覆盖当前表单内容，因此只在用户显式确认后从抽屉触发。
    setTitle(aiResult.title);
    setSlug(aiResult.slug);
    setSlugManuallyEdited(true);
    setContent(aiResult.content);
    setExcerpt(aiResult.excerpt);

    const matchedCategoryId = getMatchedCategoryId(aiResult);
    if (matchedCategoryId) {
      setCategoryId(matchedCategoryId);
    }

    const matchedTagIds = getMatchedTagIds(aiResult);
    if (matchedTagIds.length > 0) {
      setSelectedTagIds(matchedTagIds);
    }

    showFieldWarnings(aiResult.warnings);
    toast.success('已应用全部 AI 建议');
  }

  function canRunFieldAi(field: AiField) {
    switch (field) {
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
        toast.error('AI 处理暂时不可用，请稍后重试。');
        return;
      }

      applyFieldResult(data.data as AiFieldResult);
    } catch (error) {
      console.error(error);
      toast.error('AI 服务调用失败，请稍后重试。');
    } finally {
      setAiLoading(false);
    }
  }

  return {
    aiLoading,
    aiOpen,
    aiResult,
    setAiOpen,
    buildAiPayload,
    showFieldWarnings,
    getMatchedCategoryId,
    getMatchedTagIds,
    applyFieldResult,
    applyFieldSuggestion,
    applyAllAi,
    canRunFieldAi,
    requestAiSuggestions,
    requestFieldAi,
  };
}

function getFieldLabel(field: AiField) {
  switch (field) {
    case 'title':
      return '标题';
    case 'slug':
      return 'Slug';
    case 'content':
      return '正文';
    case 'excerpt':
      return '摘要';
    case 'category':
      return '分类';
    case 'tags':
      return '标签';
  }
}
