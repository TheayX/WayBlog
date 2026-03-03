import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

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
