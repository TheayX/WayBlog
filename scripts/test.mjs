import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

function collectTestFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(relative(process.cwd(), fullPath));
    }
  }

  return files;
}

const testFiles = collectTestFiles(join(process.cwd(), 'src'));

if (testFiles.length === 0) {
  console.error('未找到测试文件：src/**/*.test.ts');
  process.exit(1);
}

// 显式传入文件列表，避免不同 shell 对 glob 展开规则不一致。
const result = spawnSync('tsx', ['--test', ...testFiles], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
