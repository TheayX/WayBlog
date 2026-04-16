import { badRequest, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { aiOptimizeSchema } from '@/lib/validations';
import { getAiConfig, getAiProviderLabel } from '@/lib/ai/config';
import { optimizePostWithAi } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = aiOptimizeSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const result = await optimizePostWithAi(parsed.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const providerLabel = getAiProviderLabel(getAiConfig().provider);
      return serverError('POST /api/ai/optimize', new Error(`${providerLabel} request timed out`));
    }

    return serverError('POST /api/ai/optimize', error);
  }
}
