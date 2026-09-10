import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const webRoot = resolve(projectRoot, 'apps', 'web');
const rootManifest = resolve(projectRoot, '.openai', 'hosting.json');
const webManifestDirectory = resolve(webRoot, '.openai');
const webManifest = resolve(webManifestDirectory, 'hosting.json');
const webDist = resolve(webRoot, 'dist');
const projectDist = resolve(projectRoot, 'dist');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function prepare() {
  await rm(webDist, { recursive: true, force: true });
  await mkdir(webManifestDirectory, { recursive: true });
  await cp(rootManifest, webManifest);
}

async function finalize() {
  await rm(projectDist, { recursive: true, force: true });
  await cp(webDist, projectDist, { recursive: true });

  const metadataDirectory = resolve(projectDist, '.openai');
  await mkdir(metadataDirectory, { recursive: true });
  await cp(rootManifest, resolve(metadataDirectory, 'hosting.json'));

  const migrations = resolve(projectRoot, 'drizzle');
  if (await exists(migrations)) {
    await cp(migrations, resolve(metadataDirectory, 'drizzle'), {
      recursive: true,
    });
  }

  const workerCandidates = [
    resolve(projectDist, 'worker', 'index.js'),
    resolve(projectDist, 'tuobao-legal-care', 'index.js'),
    resolve(projectDist, 'tuobao_legal_care', 'index.js'),
    resolve(projectDist, 'index.js'),
  ];
  const serverEntry = resolve(projectDist, 'server', 'index.js');
  if (!(await exists(serverEntry))) {
    const workerEntry = await Promise.all(
      workerCandidates.map(async (path) => ((await exists(path)) ? path : null)),
    ).then((paths) => paths.find(Boolean));
    if (!workerEntry) {
      throw new Error('Cloud worker entry was not generated.');
    }
    await mkdir(dirname(serverEntry), { recursive: true });
    await cp(workerEntry, serverEntry);
  }

  const clientEntry = resolve(projectDist, 'client', 'index.html');
  if (!(await exists(clientEntry))) {
    throw new Error('Client index.html was not generated.');
  }
}

const mode = process.argv[2];
if (mode === 'before') {
  await prepare();
} else if (mode === 'after') {
  await finalize();
} else {
  throw new Error('Expected mode: before or after.');
}
