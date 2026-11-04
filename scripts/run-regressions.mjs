// One path-aware entry point for the historical regression suites.
import {readFileSync} from 'node:fs';
import {execFileSync, spawnSync} from 'node:child_process';
import {matchesGlob} from 'node:path';
import {fileURLToPath} from 'node:url';

export function selectSuites(suites, files) {
  const all = files === null || files.some(p => p.startsWith('.github/') ||
    ['scripts/run-regressions.mjs', 'scripts/regression-suites.json'].includes(p));
  return suites.filter(s => all || !s.paths.length || files.some(p =>
    s.paths.some(pattern => matchesGlob(p, pattern))));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const suites = JSON.parse(readFileSync(new URL('./regression-suites.json', import.meta.url)));
  const base = process.argv.indexOf('--base');
  const files = base < 0 ? null : execFileSync('git',
    ['diff', '--name-only', '--diff-filter=ACDMRTUXB', process.argv[base+1], 'HEAD'],
    {encoding:'utf8'}).trim().split('\n').filter(Boolean);
  const selected = selectSuites(suites, files);
  const unique = [...new Set(selected.flatMap(s => s.commands))];
  const tests = new Set();
  const commands = [];
  for (const command of unique) {
    const clean = command.split('\n').filter(line => !line.trim().startsWith('#')).join('\n').replace(/\\\n\s*/g, ' ').trim();
    if (/^node\s+--test(?:\s+tests\/[\w./-]+\.mjs)+$/.test(clean)) {
      clean.split(/\s+/).slice(2).forEach(file => tests.add(file));
    } else commands.push(command);
  }
  // Run overlapping Node test files only once, with bounded CPU/memory usage.
  if (tests.size) commands.push('node --test --test-concurrency=4 ' + [...tests].sort().join(' '));
  console.log(`Selected ${selected.length}/${suites.length} suites, ${commands.length} unique commands`);
  if (process.argv.includes('--list')) {
    console.log(selected.map(s => s.id).join('\n'));
  } else {
    let failures = 0;
    for (const command of commands) {
      console.log(`::group::${command.split('\n')[0]}`);
      const result = spawnSync('bash', ['-eo', 'pipefail', '-c', command],
        {stdio:'inherit', timeout: command.startsWith('node --test --test-concurrency=') ? 1200000 : 120000});
      console.log('::endgroup::');
      if (result.error || result.status !== 0) {
        failures++;
        console.error(`::error::Regression command failed: ${command.split('\n')[0]}`);
      }
    }
    console.log(`${commands.length-failures} commands passed; ${failures} failed`);
    process.exitCode = failures ? 1 : 0;
  }
}
