#!/usr/bin/env python3
"""Build only the isolated acceptance snapshot; never publish or change source files."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'preview/mhsunbreak-lamp-20261021'
FILES = ['mhsunbreak-next-bz.html','mhsunbreak-checker.html','mhsunbreak-bz-import.html','mhsunbreak-guide.html','mhsunbreak-next-bz-guide.html','checker-data/mhsunbreak.js','checker-engine.js']
(DEST / 'checker-data').mkdir(parents=True, exist_ok=True)
for name in FILES:
    text = (ROOT / name).read_text()
    for a,b in [('mhsunbreak-checker-v1','mhsunbreak-lamp-preview-20261021-checker-v1'),('mhsunbreak-next-bz-recording-v1','mhsunbreak-lamp-preview-20261021-recording-v1'),('mhsunbreak-next-bz-transfer-v1','mhsunbreak-lamp-preview-20261021-transfer-v1')]:
        text = text.replace(a,b)
    if name.endswith('.html'):
        text = re.sub(r'<script[^>]*src="https://(?:www.googletagmanager.com|pagead2.googlesyndication.com)[^>]*></script>','',text)
        text = re.sub(r'<script>\s*window.dataLayer[\s\S]*?</script>','',text)
        text = re.sub(r'<link rel="canonical"[^>]*>|<meta property="og:url"[^>]*>','',text)
        text = text.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow,noarchive">',1)
        text = text.replace('href="checkers.html"','href="index.html"').replace('SETTING CHECKER ・ slot-tools.jp','TEST ・ 本番とは別の記録')
        text = text.replace('スロット稼働ノート / 無料ツール','テスト版 / 本番とは別の記録')
        text = re.sub(r'<details class="data-panel"><summary>関連ツール・無料実戦記事</summary>[\s\S]*?</details>','<p class="source"><a href="index.html">テスト入口へ戻る</a></p>',text)
    if name == 'checker-engine.js':
        text = text.replace("'assets/nana-icon.jpg'","'../../assets/nana-icon.jpg'")
    (DEST / name).write_text(text)
(DEST / 'index.html').write_text('''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>BZ履歴と失敗後PUSH｜確認用</title><style>body{background:#100f18;color:#f3edfc;font:16px/1.7 system-ui;padding:20px 16px}main{max-width:650px;margin:auto}h1{font-size:24px}a{display:block;color:#13111b;background:#c3eaff;text-align:center;text-decoration:none;padding:15px;border-radius:10px;margin:18px 0;font-weight:700}section{background:#241d32;padding:18px;border-radius:12px}small{color:#d5c8de}</style></head><body><main><small>検収テスト版 · UI 4.2 · 2026/10/21</small><h1>BZごとの履歴と失敗後のランプ</h1><section><p>失敗を押すと、青・黄・緑・赤・不明の5択が開きます。選んだランプは対象となる次回BZの枠へ。あとから枠内のランプを押して訂正できます。</p><p>青：デフォルト／黄：次回HI以上期待度UP／緑：次回HI以上濃厚／赤：次回SP濃厚。不明は推測に使いません。</p><p>本番の記録とは分かれています。試しの入力で確認してください。このURLを知っている人は閲覧できます。</p></section><a href="mhsunbreak-checker.html">設定判別カウンターを試す</a><a href="mhsunbreak-next-bz.html">新しいBZ予測ツールを試す</a><p>カウンターのBZタブで③を選択→失敗→緑を選ぶと、2回目の枠にランプが表示されます。そのランプを押して「ランプの色を訂正」も確認できます。</p><p>スマホで文字と操作を確認してから、本番へ反映します。</p></main></body></html>''')
print(DEST)
