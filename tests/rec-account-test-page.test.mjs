import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildTestPage} from './rec-account-build-test-page.mjs';

test('H: テスト版の差分は指定された5か所のみ', () => {
  const source = fs.readFileSync(new URL('../tools/rec/index.html', import.meta.url), 'utf8');
  const generated = fs.readFileSync(new URL('../tools/rec/acct-test.html', import.meta.url), 'utf8');
  assert.equal(generated, buildTestPage(source));
  assert.ok(generated.includes('<meta name="robots" content="noindex, nofollow, noarchive">'));
  assert.throws(() => buildTestPage(source.replace('const KEY=', 'const OTHER_KEY=')));
  assert.throws(() => buildTestPage(source + '"slot-tools-rec:cycleLabel"'));
});
