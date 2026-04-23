import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeLoginCredentials } from '@/lib/auth/credentials';

describe('normalizeLoginCredentials', () => {
  it('trims email and preserves password content', () => {
    const credentials = normalizeLoginCredentials({
      email: ' admin@example.com ',
      password: ' pass word ',
    });

    assert.deepEqual(credentials, {
      email: 'admin@example.com',
      password: ' pass word ',
    });
  });

  it('rejects missing credentials', () => {
    assert.equal(normalizeLoginCredentials({ email: '', password: 'secret' }), null);
    assert.equal(normalizeLoginCredentials({ email: 'admin@example.com' }), null);
  });
});
