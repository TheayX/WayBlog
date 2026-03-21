import { badRequest, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { aiOptimizeSchema } from '@/lib/validations';
import { optimizePostWithOllama } from '@/lib/ai/client';

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = aiOptimizeSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const result = await optimizePostWithOllama(parsed.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return serverError('POST /api/ai/optimize', new Error('Ollama request timed out'));
    }

    return serverError('POST /api/ai/optimize', error);
  }
}
