// Stop: run the TypeScript type check when TS/JSON files have uncommitted changes.
// Exit 2 hands the errors back to Claude instead of ending the turn.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const MAX_LINES = 60;

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const input = JSON.parse(readFileSync(0, 'utf8'));

// Already continuing because of this hook: let the turn end rather than loop forever.
if (input.stop_hook_active) process.exit(0);

const status = spawnSync('git', ['status', '--porcelain', '--', '*.ts', '*.tsx', '*.json'], {
  cwd: projectDir,
  encoding: 'utf8',
});
if (status.status === 0 && status.stdout.trim() === '') process.exit(0);

const typecheck = spawnSync('pnpm typecheck', {
  cwd: projectDir,
  encoding: 'utf8',
  shell: true,
});
if (typecheck.status === 0) process.exit(0);

const output = `${typecheck.stdout}\n${typecheck.stderr}`.trim().split('\n');
const shown = output.slice(-MAX_LINES).join('\n');
console.error(`pnpm typecheck failed. Fix these type errors before finishing:\n${shown}`);
process.exit(2);
