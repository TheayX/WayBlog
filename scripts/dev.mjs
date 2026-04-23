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

const ensureDatabase = async () => {
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch {
    console.log('⏳ Docker 尚未运行，正在尝试为您唤起 Docker Desktop...');
    try {
      // 优先尝试项目当前开发机上的 Docker Desktop 路径，减少手动启动成本。
      execSync('start "" "E:\\DockerDesktop\\Docker Desktop.exe"');
    } catch {
      try {
        // 兼容另一条常见安装路径，避免开发机路径差异导致脚本直接失败。
        execSync('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"');
      } catch {
        console.log('⚠️ 无法自动打开 Docker Desktop，请确保它安装在默认路径，或者请手动将其打开。');
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
    console.log('📦 正在确保本地数据库 (PostgreSQL) 运行中...');
    execSync('docker-compose up -d', { stdio: 'inherit' });
  } catch {
    console.error('❌ 自动启动数据库遇到问题。');
  }
};

await ensureDatabase();

const port = process.env.PORT || '3333';
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
