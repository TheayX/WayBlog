import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { parseJsonBody } from './admin';

test('parseJsonBody returns 400 for invalid JSON body', async () => {
  const request = new Request('http://localhost/api/admin/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ invalid json',
  }) as NextRequest;

  const result = await parseJsonBody(request, z.object({ title: z.string() }));

  assert.equal(result.success, false);
  if (result.success) return;

  assert.equal(result.response.status, 400);
  assert.deepEqual(await result.response.json(), { error: 'Invalid JSON body' });
});
