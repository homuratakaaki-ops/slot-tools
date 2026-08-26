const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'yutime-record.html'), 'utf8');

assert.match(html, /このツールは新版へ移行しました/);
assert.match(html, /遊タイム記録ツールは『遊タイム実戦ツール v3』として作り直しました。今後はこちらをご利用ください。/);
assert.match(html, /href="\/yutime-v3\.html"/);
assert.match(html, /遊タイム実戦ツール v3 を開く/);
assert.match(html, /この端末に保存されていた旧ツールの記録は消えていません/);
assert.doesNotMatch(html, /YUTIME_RECORD_ENGINE/);

console.log('yutime-record redirect page tests passed');
