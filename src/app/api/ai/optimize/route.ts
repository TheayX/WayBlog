import { badRequest, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { aiOptimizeSchema } from '@/lib/validations';
import { getAiConfig, getAiProviderLabel } from '@/lib/ai/config';
import { optimizePostWithAi } from '@/lib/ai/service';

/**
 * AI 全文优化路由处理器。
 *
 * 该接口面向管理后台文章编辑器，用于让模型一次处理标题、摘要、正文等更大范围内容。
 * 由于请求体更大、提示词更重、模型耗时更高，因此必须在路由层先完成鉴权与 schema 校验，避免无效请求进入 AI Provider。
 * 这里没有单独叠加限流，主要依赖后台鉴权缩小调用范围；但全文优化天然更受请求体大小、模型成本和超时约束影响。
 * 成功时返回完整优化结果，通常包含标题、slug、摘要、正文以及分类/标签建议，供编辑器统一预览和批量应用。
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = aiOptimizeSchema.safeParse(body);

    if (!parsed.success) {
      // 校验失败直接返回结构化字段错误，便于管理后台保留原始输入并提示用户修正。
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    /**
     * 路由处理器只负责协议边界，具体提示词编排、Provider 调用与结果归一化全部收敛在服务层。
     * 这样可以在不改动接口契约的前提下调整 AI 策略。
     */
    const result = await optimizePostWithAi(parsed.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const providerLabel = getAiProviderLabel(getAiConfig().provider);
      // 显式区分超时错误，便于调用方把它视为暂时性 AI 不可用，而不是业务参数错误。
      return serverError('POST /api/ai/optimize', new Error(`${providerLabel} request timed out`));
    }

    return serverError('POST /api/ai/optimize', error);
  }
}
