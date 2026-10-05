// AGENTS.md §9-106【後読みの正規表現を使わない】の固定テスト。
// 後読み（(?<= / (?<!）は iOS Safari 16.4 未満ではパース時に構文エラーになり、
// そのファイル全体が読み込まれず画面が真っ白になる（実害が出たため条文化）。
//
// 対象は端末のブラウザへ配信される *.js / *.html。node でしか動かない検証スクリプト
// （tests/ 配下・test/ 配下）は条文の対象外なので除外する。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'tests', 'test']);
// 検出パターン。この行自身に後読みの文字列を書かないようエスケープで組む
const LOOKBEHIND = /\(\?<[=!]/;

function shippedFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...shippedFiles(path.join(dir, entry.name)));
    } else if (/\.(js|mjs|html)$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

test('配信される *.js / *.html に後読みの正規表現が無い（§9-106）', () => {
  const files = shippedFiles(root);
  assert.ok(files.length > 100, `走査対象が少なすぎる: ${files.length}件`);
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (LOOKBEHIND.test(line)) hits.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(hits, [], `後読みの正規表現が見つかった:\n${hits.join('\n')}`);
});

test('検出パターン自体が後読みを拾える（テストが空振りしていないことの確認）', () => {
  assert.ok(LOOKBEHIND.test('x.replace(' + '/(?<' + '=a)b/, "")'));
  assert.ok(LOOKBEHIND.test('x.match(' + '/(?<' + '!a)b/)'));
  assert.ok(!LOOKBEHIND.test('x.match(/(?=a)b/)'));
  assert.ok(!LOOKBEHIND.test('x.match(/(?!a)b/)'));
  assert.ok(!LOOKBEHIND.test('x.match(/(?<name>a)/)'));
});
