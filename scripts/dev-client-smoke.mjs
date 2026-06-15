import { spawn } from 'node:child_process';

const backendPort = readPort(process.env.BACKEND_PORT ?? process.env.PORT ?? '3000', 'BACKEND_PORT');
const expoPort = readPort(process.env.EXPO_PORT ?? '8081', 'EXPO_PORT');
const apiBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || `http://127.0.0.1:${backendPort}`);
const expoHost = process.env.EXPO_HOST?.trim() || 'localhost';
const expoStatusUrl = `http://localhost:${expoPort}/status`;

const children = [];
let shuttingDown = false;

process.on('SIGINT', () => {
  void cleanup(130);
});
process.on('SIGTERM', () => {
  void cleanup(143);
});

try {
  console.log(`dev-client smoke: starting backend dev server on port ${backendPort}`);
  const backend = spawnManaged('npm', ['--workspace', 'backend', 'run', 'dev'], {
    APP_ENV: 'development',
    PORT: String(backendPort),
  });

  await waitForHttp(`${apiBaseUrl}/health`, async (response) => {
    if (!response.ok) return false;
    const payload = await response.json();
    return payload.status === 'ok';
  }, 45_000);
  console.log(`dev-client smoke: backend health passed at ${apiBaseUrl}/health`);

  console.log(`dev-client smoke: starting Expo Dev Client Metro on port ${expoPort}`);
  const expo = spawnManaged('npm', ['--workspace', 'mobile', 'run', 'dev', '--', `--${expoHost}`, '--port', String(expoPort)], {
    CI: '1',
    EXPO_NO_TELEMETRY: '1',
    EXPO_PUBLIC_API_BASE_URL: apiBaseUrl,
  });

  await waitForOutput(expo, /Metro waiting on|Waiting on|Development server running|exp\+noteai/, 90_000);
  await waitForHttp(expoStatusUrl, async (response) => {
    const body = await response.text();
    return response.ok && body.includes('packager-status:running');
  }, 30_000);

  console.log('dev-client smoke passed: backend dev server and Expo Dev Client Metro are running.');
  console.log(`dev-client smoke used EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}`);
  console.log('Open an installed Note AI dev build in iOS Simulator/Android emulator and connect to the displayed dev-client URL for manual screen smoke.');
  await cleanup(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await cleanup(1);
}

function spawnManaged(command, args, env) {
  const child = spawn(command, args, {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  children.push(child);

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    child.smokeOutput = `${child.smokeOutput ?? ''}${chunk}`;
    process.stdout.write(prefixLines(commandLabel(command, args), chunk));
  });
  child.stderr.on('data', (chunk) => {
    child.smokeOutput = `${child.smokeOutput ?? ''}${chunk}`;
    process.stderr.write(prefixLines(commandLabel(command, args), chunk));
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${commandLabel(command, args)} exited unexpectedly: code=${code} signal=${signal}`);
    }
  });

  return child;
}

async function waitForOutput(child, pattern, timeoutMs) {
  const startedAt = Date.now();
  let buffered = child.smokeOutput ?? '';

  return new Promise((resolve, reject) => {
    if (pattern.test(buffered)) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      cleanupListeners();
      reject(new Error(`Timed out waiting for Expo output matching ${pattern} after ${timeoutMs}ms.`));
    }, timeoutMs);

    function onData(chunk) {
      buffered += chunk;
      if (pattern.test(buffered)) {
        cleanupListeners();
        resolve();
      } else if (Date.now() - startedAt > timeoutMs) {
        cleanupListeners();
        reject(new Error(`Timed out waiting for Expo output matching ${pattern}.`));
      }
    }

    function onExit(code, signal) {
      cleanupListeners();
      reject(new Error(`Process exited before expected output: code=${code} signal=${signal}`));
    }

    function cleanupListeners() {
      clearTimeout(timeout);
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
      child.off('exit', onExit);
    }

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', onExit);
  });
}

async function waitForHttp(url, predicate, timeoutMs) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (await predicate(response)) return;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : lastError}`);
}

async function cleanup(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  await Promise.all(children.map((child) => stopChild(child)));
  process.exitCode = exitCode;
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform === 'win32') {
    child.kill('SIGTERM');
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }

  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(2_000).then(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }),
  ]);
}

function readPort(value, name) {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer.`);
  const port = Number(value);
  if (port <= 0 || port > 65535) throw new Error(`${name} must be between 1 and 65535.`);
  return port;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, '');
}

function prefixLines(label, chunk) {
  return chunk
    .split('\n')
    .map((line, index, lines) => {
      if (index === lines.length - 1 && line === '') return '';
      return `[${label}] ${line}`;
    })
    .join('\n');
}

function commandLabel(command, args) {
  if (args.includes('backend')) return 'backend';
  if (args.includes('mobile')) return 'expo';
  return command;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
