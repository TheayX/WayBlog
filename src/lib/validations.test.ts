import test from 'node:test';
import assert from 'node:assert/strict';

import {
  adminPostQuerySchema,
  publicPostQuerySchema,
  updateAccountPasswordSchema,
  updateAccountProfileSchema,
} from '@/lib/validations';

test('publicPostQuerySchema rejects status filter', () => {
  const parsed = publicPostQuerySchema.safeParse({
    page: '1',
    pageSize: '10',
    status: 'DRAFT',
  });

  assert.equal(parsed.success, false);
});

test('adminPostQuerySchema accepts status filter', () => {
  const parsed = adminPostQuerySchema.safeParse({
    page: '1',
    pageSize: '10',
    status: 'DRAFT',
  });

  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  assert.equal(parsed.data.status, 'DRAFT');
});

test('post query schemas reject unknown parameters', () => {
  assert.equal(publicPostQuerySchema.safeParse({ foo: 'bar' }).success, false);
  assert.equal(adminPostQuerySchema.safeParse({ foo: 'bar' }).success, false);
});

test('updateAccountProfileSchema accepts basic admin profile fields', () => {
  const parsed = updateAccountProfileSchema.safeParse({
    email: 'admin@wayblog.local',
    name: 'Way',
    avatar: null,
  });

  assert.equal(parsed.success, true);
});

test('updateAccountPasswordSchema rejects short new password', () => {
  const parsed = updateAccountPasswordSchema.safeParse({
    currentPassword: 'old-password',
    newPassword: 'short',
  });

  assert.equal(parsed.success, false);
});
