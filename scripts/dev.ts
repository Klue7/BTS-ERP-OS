import { spawn, spawnSync, type ChildProcess } from 'node:child_process';

const children: ChildProcess[] = [];
const apiPort = process.env.API_PORT ?? '4010';
const apiOrigin = process.env.API_ORIGIN ?? `http://127.0.0.1:${apiPort}`;

let shuttingDown = false;

function spawnChild(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env,
  });

  children.push(child);
  child.on('exit', (code) => {
    shutdown(code ?? 0);
  });

  return child;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForApi(url: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isApiReady(url)) {
      return;
    }

    await sleep(150);
  }

  throw new Error(`API did not become ready at ${url} within ${timeoutMs}ms.`);
}

async function isApiReady(url: string) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

function killExistingApiProcess(port: string) {
  const lookup = spawnSync('lsof', ['-ti', `:${port}`], {
    encoding: 'utf8',
  });

  if (lookup.status !== 0 || !lookup.stdout.trim()) {
    return false;
  }

  const pids = Array.from(new Set(lookup.stdout.split('\n').map((value) => value.trim()).filter(Boolean)));
  for (const pid of pids) {
    spawnSync('kill', ['-TERM', pid], { stdio: 'ignore' });
  }

  return pids.length > 0;
}

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

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  const healthUrl = `${apiOrigin}/api/health`;
  if (await isApiReady(healthUrl)) {
    const killed = killExistingApiProcess(apiPort);
    if (killed) {
      console.log(`Restarting API on port ${apiPort} so dev uses the current server code.`);
      await sleep(350);
    } else {
      console.log(`API already listening at ${apiOrigin}; unable to terminate existing process automatically, attempting to reuse it.`);
    }
  }

  if (!(await isApiReady(healthUrl))) {
    spawnChild('tsx', ['src/server/index.ts'], {
      ...process.env,
      TMPDIR: '/tmp',
      TEMP: '/tmp',
      TMP: '/tmp',
    });

    await waitForApi(healthUrl);
  }

  if (shuttingDown) {
    return;
  }

  spawnChild('vite', [], {
    ...process.env,
    TMPDIR: '/tmp',
    TEMP: '/tmp',
    TMP: '/tmp',
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
});
