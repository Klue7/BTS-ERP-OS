import { spawn } from 'node:child_process';

const children = [
  spawn('tsx', ['src/server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      TMPDIR: '/tmp',
      TEMP: '/tmp',
      TMP: '/tmp',
    },
  }),
  spawn('vite', [], {
    stdio: 'inherit',
    env: process.env,
  }),
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    process.exit(code);
  }, 250);
}

for (const child of children) {
  child.on('exit', (code) => {
    shutdown(code ?? 0);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
