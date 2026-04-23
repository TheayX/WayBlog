/**
 * 本地开发脚本辅助函数。
 *
 * 这些函数保持纯逻辑，便于测试 Docker Compose 探测和平台相关分支，
 * 避免启动脚本只能通过真实 Docker 环境验证。
 */

export function resolveDockerComposeCommand(commandExists) {
  if (commandExists('docker compose version')) {
    return 'docker compose';
  }

  if (commandExists('docker-compose version')) {
    return 'docker-compose';
  }

  return null;
}

export function getDockerDesktopCandidates(platform = process.platform) {
  if (platform !== 'win32') {
    return [];
  }

  return [
    'E:\\DockerDesktop\\Docker Desktop.exe',
    'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
  ];
}
