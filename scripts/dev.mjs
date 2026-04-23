/**
 * 本地开发启动脚本。
 *
 * 负责在启动 Next.js dev server 前尽量确保本地 PostgreSQL 容器可用，
 * 并在终端输出额外的后台管理地址提示，减少开发时的重复准备步骤。
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { getDockerDesktopCandidates, resolveDockerComposeCommand } from './dev-utils.mjs';

function commandExists(command) {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const ensureDatabase = async () => {
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch {
    console.log('⏳ Docker 尚未运行，请先确保 Docker Desktop 或 Docker Engine 可用...');

    for (const candidate of getDockerDesktopCandidates()) {
      try {
        // Windows 本地开发时尝试唤起常见安装路径，失败后继续提示手动启动。
        execSync(`start "" "${candidate}"`);
        break;
      } catch {
        // 多个候选路径逐个尝试，全部失败后交给下面的等待与提示处理。
      }
    }

    // 最多等待约 60 秒让 Docker 引擎就绪，避免数据库容器启动命令过早失败。
    let attempts = 0;
    while (attempts < 30) {
      try {
        execSync('docker info', { stdio: 'ignore' });
        console.log('✅ Docker 引擎现已就绪！\n');
        break;
      } catch {
        attempts++;
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
        process.stdout.write('.');
      }
    }
  }

  try {
    const composeCommand = resolveDockerComposeCommand(commandExists);
    if (!composeCommand) {
      throw new Error('未找到 docker compose 或 docker-compose 命令');
    }

    console.log('📦 正在确保本地数据库和 Redis 运行中...');
    execSync(`${composeCommand} up -d`, { stdio: 'inherit' });
  } catch {
    console.error('❌ 自动启动本地基础设施遇到问题，请手动运行 docker compose up -d。');
  }
};

await ensureDatabase();

const port = process.env.PORT || '3610';
const baseUrl =
  process.env.SITE_URL ||
  process.env.NEXTAUTH_URL ||
  `http://localhost:${port}`;
const adminUrl = new URL('/admin', baseUrl).toString();
const nextBin = resolve('node_modules/next/dist/bin/next');

// 直接使用安装后的 Next.js CLI 入口，避免依赖 shell PATH 是否已正确配置。
if (!existsSync(nextBin)) {
  throw new Error(`Next.js CLI entry not found: ${nextBin}`);
}

const child = spawn(
  process.execPath,
  [nextBin, 'dev', '--port', port],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  }
);

let injected = false;

const stdout = createInterface({ input: child.stdout });
stdout.on('line', (line) => {
  if (!injected && line.includes('Environments:')) {
    process.stdout.write(`- Admin:         ${adminUrl}\n`);
    injected = true;
  }

  process.stdout.write(`${line}\n`);
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
});

child.on('exit', (code, signal) => {
  stdout.close();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
