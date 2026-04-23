import test from 'node:test';
import assert from 'node:assert/strict';

import { maskEmail, maskSecret } from './audit';

test('maskEmail keeps domain and masks local part', () => {
  assert.equal(maskEmail('admin@wayblog.local'), 'ad***@wayblog.local');
});

test('maskEmail handles missing or invalid email safely', () => {
  assert.equal(maskEmail(), 'unknown');
  assert.equal(maskEmail('not-email'), '***');
});

test('maskSecret never returns original secret', () => {
  assert.equal(maskSecret('way-local-demo-password'), '********');
  assert.equal(maskSecret(), 'not-set');
});
