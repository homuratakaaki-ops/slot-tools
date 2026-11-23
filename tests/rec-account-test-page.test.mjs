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

// 正本の相反する条件について、通過した確認に紛れ込ませない。
test.todo('C05: 自動預入対象日のH=0は、§3.3のfinalDeposit/settleSkipだけでHを0にする定義と要調整');
test.todo('C23: 保存JSON全体の差分ゼロは、§2・§5.1のledger/storageKey追加と両立しない（台JSONはブラウザ検証で一致）');
test.todo('D: voidの自動預入を再生成するかは要確定（現状は取消履歴を保持し再生成を保留）');
