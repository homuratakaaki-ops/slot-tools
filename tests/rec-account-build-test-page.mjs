// node tests/rec-account-build-test-page.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

export function buildTestPage(source) {
  for (const [from, to, count] of [
    ['const KEY="slot-tools-rec";', 'const KEY="slot-tools-rec-acct-test";', 1],
    ['const DB_NAME="slot-tools-rec";', 'const DB_NAME="slot-tools-rec-acct-test";', 1],
    ['"slot-tools-rec:cycleLabel"', '"slot-tools-rec-acct-test:cycleLabel"', 2],
    ['<title>実戦記録</title>', '<title>実戦記録（口座テスト版）</title>', 1],
  ]) {
    assert.equal(source.split(from).length - 1, count, `置換数: ${from}`);
    source = source.replaceAll(from, to);
  }
  return source;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(new URL('../tools/rec/acct-test.html', import.meta.url),
    buildTestPage(fs.readFileSync(new URL('../tools/rec/index.html', import.meta.url), 'utf8')));
}
