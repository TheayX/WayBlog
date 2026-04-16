import { requireAuth } from '@/lib/auth-guard';
import { badRequest, ok, serverError } from '@/lib/response';
import { aiFieldSchema } from '@/lib/validations';
import { getAiConfig, getAiProviderLabel } from '@/lib/ai/config';
import { optimizeFieldWithAi } from '@/lib/ai/service';

/**
 * AI 单字段优化路由处理器。
 *
 * 该接口服务于管理后台内容编辑流程，调用成本与结果都不适合暴露给公开页，因此必须先鉴权。
 * 请求体会先经过 schema 校验，确保字段类型、原始内容与提示词满足服务层约束，再统一交由 AI 服务执行。
 * 这里没有单独叠加限流，主要因为接口已受后台鉴权保护；但字段优化依然要受模型成本、超时与输入长度约束影响。
 * 成功时返回单字段优化结果，包含目标字段值或推荐项与 warnings，便于编辑器按标题、摘要、Slug 等局部场景直接应用。
 */
export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = aiFieldSchema.safeParse(body);

    if (!parsed.success) {
      // 校验失败直接返回结构化字段错误，便于管理后台按字段展示并保留原始输入。
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    /**
     * 字段级优化只返回目标字段的 AI 结果，适合标题、摘要等局部编辑场景。
     *
     * 路由层不直接拼装提示词，避免接口协议和 Provider 细节耦合；提示词策略统一收敛在 AI 服务内部。
     */
    const result = await optimizeFieldWithAi(parsed.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const providerLabel = getAiProviderLabel(getAiConfig().provider);
      // 超时信息带上 Provider 标签，便于管理后台快速区分是模型响应慢还是业务校验失败。
      return serverError('POST /api/ai/field', new Error(`${providerLabel} request timed out`));
    }

    return serverError('POST /api/ai/field', error);
  }
}
