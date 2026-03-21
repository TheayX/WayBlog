import { optimizeFieldWithOllama } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth-guard';
import { badRequest, ok, serverError } from '@/lib/response';
import { aiFieldSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = aiFieldSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const result = await optimizeFieldWithOllama(parsed.data);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return serverError('POST /api/ai/field', new Error('Ollama request timed out'));
    }

    return serverError('POST /api/ai/field', error);
  }
}
