// PostToolUse (Edit|Write): run Prettier on the file Claude just edited.
// ESLint is not run per edit (too slow); `pnpm check` and CI run it.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path;
if (typeof filePath !== 'string') process.exit(0);

const absolute = path.resolve(projectDir, filePath);
const relative = path.relative(projectDir, absolute);
const outsideProject = relative.startsWith('..') || path.isAbsolute(relative);
if (outsideProject || relative.split(path.sep).includes('node_modules')) process.exit(0);

function binPath(pkg, bin) {
  const pkgDir = path.join(projectDir, 'node_modules', pkg);
  const manifest = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  const entry = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin[bin];
  return path.join(pkgDir, entry);
}

function run(pkg, args) {
  return spawnSync(process.execPath, [binPath(pkg, pkg), ...args], {
    cwd: projectDir,
    encoding: 'utf8',
  });
}

const problems = [];

const prettier = run('prettier', ['--write', '--ignore-unknown', '--log-level', 'warn', absolute]);
if (prettier.status !== 0) problems.push(`Prettier failed:\n${prettier.stderr || prettier.stdout}`);

if (problems.length > 0) {
  console.error(`${relative}\n${problems.join('\n').trim()}`);
  process.exit(2);
}
