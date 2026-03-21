import { spawn, execSync, exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const ensureDatabase = async () => {
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (err) {
    console.log('⏳ Docker 尚未运行，正在尝试为您唤起 Docker Desktop...');
    try {
      // 尝试启动 Docker Desktop
      execSync('start "" "E:\\DockerDesktop\\Docker Desktop.exe"');
    } catch (e) {
        try {
          // 尝试另一个常见路径
          execSync('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"');
        } catch (e2) {
          console.log('⚠️ 无法自动打开 Docker Desktop，请确保它安装在默认路径，或者请手动将其打开。');
        }
    }
    
    // 每两秒检测一次，等待 Docker 引擎就绪，最多等待约 60 秒
    let attempts = 0;
    while (attempts < 30) {
      try {
        execSync('docker info', { stdio: 'ignore' });
        console.log('✅ Docker 引擎现已就绪！\n');
        break;
      } catch (e) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000));
        process.stdout.write('.');
      }
    }
  }

  try {
    console.log('📦 正在确保本地数据库 (PostgreSQL) 运行中...');
    execSync('docker-compose up -d', { stdio: 'inherit' });
  } catch (e) {
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
