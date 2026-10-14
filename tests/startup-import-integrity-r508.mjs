// R508: Every authored relative JavaScript import must resolve to an actual
// file. This prevents a deleted feature module from taking down Tokyo SHIFT
// before Phaser can create the first canvas (October 2026 regression).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(projectRoot, 'src');

function allJavaScriptFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? allJavaScriptFiles(path)
      : entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
  });
}

test('all relative ES module imports in src resolve to existing files', () => {
  const missing = [];
  const files = allJavaScriptFiles(sourceRoot);
  const specifier = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])(\.[^'"]+)\1/g;
  let importsChecked = 0;
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(specifier)) {
      const spec = match[2].split('?')[0].split('#')[0];
      const target = resolve(dirname(file), spec);
      importsChecked++;
      if (!existsSync(target)) {
        missing.push(relative(projectRoot, file) + ' -> ' + match[2]);
      }
    }
  }
  assert.ok(importsChecked > 150, 'test must examine actual source imports');
  assert.deepEqual(missing, [], 'missing imports must be repaired before release');
});

test('Tokyo Central does not reference the retired driver silhouette module', () => {
  const scene = readFileSync(join(sourceRoot, 'scenes', 'CentralTokyoScene.js'), 'utf8');
  assert.doesNotMatch(scene, /DriverSilhouette|createDriverSilhouette/);
  const obsolete = join(sourceRoot, 'vehicles', 'DriverSilhouette.js');
  assert.equal(existsSync(obsolete), false);
});
