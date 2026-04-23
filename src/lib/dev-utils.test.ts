import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const devUtilsUrl = pathToFileURL(join(process.cwd(), 'scripts/dev-utils.mjs')).href;

async function loadDevUtils() {
  return (await import(devUtilsUrl)) as {
  resolveDockerComposeCommand(commandExists: (command: string) => boolean): string | null;
  getDockerDesktopCandidates(platform?: NodeJS.Platform): string[];
};
}

test('resolveDockerComposeCommand prefers docker compose plugin', async () => {
  const devUtils = await loadDevUtils();
  const command = devUtils.resolveDockerComposeCommand((candidate) => candidate === 'docker compose version');

  assert.equal(command, 'docker compose');
});

test('resolveDockerComposeCommand falls back to legacy docker-compose binary', async () => {
  const devUtils = await loadDevUtils();
  const command = devUtils.resolveDockerComposeCommand((candidate) => candidate === 'docker-compose version');

  assert.equal(command, 'docker-compose');
});

test('getDockerDesktopCandidates only returns Windows launch paths on Windows', async () => {
  const devUtils = await loadDevUtils();

  assert.equal(devUtils.getDockerDesktopCandidates('linux').length, 0);
  assert.ok(devUtils.getDockerDesktopCandidates('win32').length > 0);
});
