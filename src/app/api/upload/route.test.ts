import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import {
  getExtensionForMime,
  getUploadMaxSize,
  hasValidImageSignature,
  resolveUploadDirectory,
} from './route';

test('getExtensionForMime maps allowed image mime types to server extensions', () => {
  assert.equal(getExtensionForMime('image/jpeg'), 'jpg');
  assert.equal(getExtensionForMime('image/png'), 'png');
  assert.equal(getExtensionForMime('image/gif'), 'gif');
  assert.equal(getExtensionForMime('image/webp'), 'webp');
});

test('hasValidImageSignature accepts matching image signatures', () => {
  assert.equal(hasValidImageSignature('image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x00])), true);
  assert.equal(
    hasValidImageSignature(
      'image/png',
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    true,
  );
  assert.equal(hasValidImageSignature('image/gif', Buffer.from('GIF89a', 'ascii')), true);
  assert.equal(hasValidImageSignature('image/webp', Buffer.from('RIFFxxxxWEBP', 'ascii')), true);
});

test('hasValidImageSignature rejects disguised files', () => {
  assert.equal(hasValidImageSignature('image/png', Buffer.from('<script>alert(1)</script>')), false);
});

test('resolveUploadDirectory keeps local uploads inside public directory', () => {
  const config = resolveUploadDirectory('public/uploads');

  assert.equal(config.uploadRoot, resolve(process.cwd(), 'public/uploads'));
  assert.equal(config.publicPrefix, 'uploads');
});

test('resolveUploadDirectory rejects paths outside public directory', () => {
  assert.throws(() => resolveUploadDirectory('../outside'), /UPLOAD_DIR must be inside public directory/);
});

test('getUploadMaxSize falls back when env value is invalid', () => {
  assert.equal(getUploadMaxSize('not-a-number'), 5242880);
});
