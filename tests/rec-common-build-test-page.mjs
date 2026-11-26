// node tests/rec-common-build-test-page.mjs [7桁ハッシュ]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function buildTestPage(source, hash) {
  assert.match(hash, /^[a-f0-9]{7}$/i, '7桁のコミットハッシュ');
  for (const [from, to, count] of [
    ['const KEY="slot-tools-rec";', 'const KEY="slot-tools-rec-common-test";', 1],
    ['const DB_NAME="slot-tools-rec";', 'const DB_NAME="slot-tools-rec-common-test";', 1],
    ['"slot-tools-rec:cycleLabel"', '"slot-tools-rec-common-test:cycleLabel"', 2],
    ['<title>実戦記録</title>', '<title>実戦記録（共通改修テスト版）</title>', 1],
  ]) {
    assert.equal(source.split(from).length - 1, count, `置換数: ${from}`);
    source = source.replaceAll(from, to);
  }
  assert.match(source, /<meta[^>]+name="robots"[^>]+noindex/);
  assert.ok(source.startsWith('<!DOCTYPE html>\n'));
  return source.replace('<!DOCTYPE html>\n', `<!DOCTYPE html>\n<!-- common-test: built from feature/rec-common-1 ${hash} -->\n`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const hash = process.argv[2] || execFileSync('git', ['-c', 'safe.directory='+root.replace(/[\\/]$/, ''), 'rev-parse', '--short=7', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
  fs.writeFileSync(new URL('../tools/rec/common-test.html', import.meta.url), buildTestPage(fs.readFileSync(new URL('../tools/rec/index.html', import.meta.url), 'utf8'), hash));
}
