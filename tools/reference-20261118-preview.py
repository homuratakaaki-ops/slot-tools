"""Local review only: python tools/reference-20261118-preview.py /tmp/slot-reference-preview
Serve the generated directory on localhost; never publish it automatically.
"""
from pathlib import Path
import shutil, sys
root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve()
if out.exists():
    raise SystemExit('Destination must not exist (protect existing work).')
out.mkdir(parents=True)
(out / 'checker-data').mkdir()
for file in ['checker-engine.js', 'checker-bayes.js']:
    shutil.copy2(root / file, out / file)
for directory in ['assets', 'icons', 'js']:
    shutil.copytree(root / directory, out / directory)
for machine in ['ggo', 'seiya12']:
    src = (root / f'checker-data/{machine}.js').read_text()
    src = src.replace(f'{machine}-checker-v1', f'{machine}-checker-v1-test')
    (out / f'checker-data/{machine}-test.js').write_text(src)
    html = (root / f'{machine}-checker.html').read_text()
    html = html.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">')
    html = html.replace('<body>', '<body><div style="padding:12px;text-align:center">検収用テスト版（保存は本番と別）</div>')
    html = html.replace(f'checker-data/{machine}.js?', f'checker-data/{machine}-test.js?')
    html = html.replace(f'{machine}-guide.html', f'{machine}-test-guide.html')
    (out / f'{machine}-test-checker.html').write_text(html)
    guide = (root / f'{machine}-guide.html').read_text().replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">')
    guide = guide.replace(f'{machine}-checker.html', f'{machine}-test-checker.html')
    (out / f'{machine}-test-guide.html').write_text(guide)
print(out)
