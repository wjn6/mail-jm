import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const backendDir = path.join(repoRoot, 'backend');

const warningBudget = Number(process.env.BACKEND_LINT_WARNING_BUDGET ?? '0');
if (!Number.isFinite(warningBudget) || warningBudget < 0) {
  console.error(
    `[backend-lint-budget] invalid BACKEND_LINT_WARNING_BUDGET="${process.env.BACKEND_LINT_WARNING_BUDGET}"`,
  );
  process.exit(1);
}

const eslintBin = path.join(backendDir, 'node_modules', 'eslint', 'bin', 'eslint.js');
const eslintArgs = ['{src,apps,libs,test}/**/*.ts', '--format', 'json'];

const result = spawnSync(process.execPath, [eslintBin, ...eslintArgs], {
  cwd: backendDir,
  encoding: 'utf8',
});

if (result.error) {
  console.error(`[backend-lint-budget] failed to run eslint: ${result.error.message}`);
  process.exit(1);
}

const raw = result.stdout?.trim();
if (!raw) {
  if (result.stderr) process.stderr.write(result.stderr);
  console.error('[backend-lint-budget] eslint returned empty output.');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(raw);
} catch (error) {
  if (result.stderr) process.stderr.write(result.stderr);
  console.error('[backend-lint-budget] failed to parse eslint JSON output.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const summary = report.reduce(
  (acc, item) => {
    acc.errors += item.errorCount + item.fatalErrorCount;
    acc.warnings += item.warningCount;
    return acc;
  },
  { errors: 0, warnings: 0 },
);

console.log(
  `[backend-lint-budget] errors=${summary.errors}, warnings=${summary.warnings}, budget=${warningBudget}`,
);

if (summary.errors > 0) {
  console.error('[backend-lint-budget] lint errors detected.');
  process.exit(1);
}

if (summary.warnings > warningBudget) {
  console.error(
    `[backend-lint-budget] warning budget exceeded (${summary.warnings} > ${warningBudget}).`,
  );
  process.exit(1);
}

if (summary.warnings < warningBudget) {
  console.log(
    `[backend-lint-budget] warning count improved. Consider lowering budget to ${summary.warnings}.`,
  );
}
