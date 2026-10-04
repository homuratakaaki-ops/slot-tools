# 公開2機種への絞り込み・転生王女追加項目 検証結果

検証日: 2026-10-04 / 実装: ミコト / 比較元: `abbe054f7caba452e803dde7eb9633f86e78a452`

正本: `docs/specs/new-1005-public-v01.md` の追補v02。原本の再取得・再照合は行わず、ツムギ照合済みの指示値を使用した。

## V02-4 の結果

| No. | 結果 | 件数・確認内容 |
|---|---|---|
| 1 | PASS | 確率36値（AT6・CZ6・EP LV1〜3の設定1/6で6・全体成功6・150G6・ポイント6）と示唆14行。機種データの生成する入力・ガイドを照合済み指示書と照合。設定順も検証 |
| 2 | PASS | checkers / sitemap / index の3ファイルでjuuou・paripi各0件 |
| 3 | PASS | 一覧先頭2機種、sitemap XML74件、NEW8行・先頭2行10/4、25機種表記2箇所。履歴の21機種は不変 |
| 4 | PASS | juuou-guide / paripi-guide の2本をgit rm。不存在を検証 |
| 5 | PASS | 保留2機種をローカルHTTP200で実表示。noindexあり・使い方リンクなし・案内文追加なし |
| 6 | PASS | 公開2機種×360/390px。実リンクでchecker→guide→checkerの4往復 |
| 7 | PASS | 確定演出10行の有無、全1,024組合せ。単体検証と実ボタン経由のcanvas描画で数値rank・同rankの安定順・画素を検証 |
| 8 | PASS | 裁定後の条件で確認。全項目入力時のサマリー10枠、左右5行、最終Y896、文字16px以上、はみ出し0。終了画面内訳に省略1行（許容）、詳細カードに示唆14行の正式名を全件表示。通常・詳細カードの画素確認 |
| 9 | PASS | 360/390px×3タブの6条件、空に近い状態と全項目入力状態で確認。はみ出し0、ボタン最小44px |
| 10 | PASS | 旧games1000/counts.at3をlocalStorageへ投入し実リロード。AT3・1/333.3を維持、エラー0 |
| 11 | PASS | n/d5行で成功/当選、失敗/ハズレ、減算、外れ側無効化、Undoを実操作。読み込み時の5組のn<=d補正も検証 |
| 12 | PASS | AT/CZは通常G未入力で実測1/xを出さず、入力後に表示。入力・カード・詳細・テンプレを確認。n/d型の成功割合は別に保持 |
| 13 | PASS | 公開ガイド2本×実ビューポート360/390pxの4条件、横はみ出し0。CSSはtonski-guideから不変 |
| 14 | PASS | なな様テンプレricorico/toaru2/mhsunbreakのzero/mixed/all、9状態でabbe054とバイト一致 |
| 15 | PASS | node test/verify.mjs：サニティ6設定・区間分割6設定ともOK |
| 16 | PASS | node --test：22件PASS / FAIL 0 / skip 0。既存17件維持＋転生王女5件追加 |
| 17 | PASS | node tests/new-1005-four-machines.browser.mjs：82件PASS / FAIL 0、未捕捉例外0 |
| 18 | PASS | node tests/new-1005-public.verify.mjs：6群すべてPASS。公開2機種・保留2機種・74件・NEW8行・25機種を検証 |
| 19 | PASS（既知FAIL維持） | wording-noukou.browser.mjs：8 PASS / 6 FAIL。既知の省略6機種8行から増加0。コマンド終了コード1 |
| 20 | PASS | git diff --check、ステージ差分チェック、変更ファイルのLF確認 |

表記検証の既知省略: かのかり2行、モンハンサンブレイク2行、モグモグ・マギレコ・見える子・タコスロ各1行。

ブラウザはローカルHTTP＋Chrome headless、実iframeで検証した。広告・アクセス解析・Google Fontsは空応答とし、代替フォントによる測定。実機の最終確認は夢爽が行う。保留ページの200/noindexはローカル実装に対する検証であり、main/Pagesへ反映済みという意味ではない。

## 変更ファイル

- `checker-data/tenten.js`: n/d5行、LV4、CZ自動合算、示唆14行、カード・詳細・テンプレ・旧データ補完
- `tenten-checker.html`: 入力/示唆/カードの3タブ、変更JSの参照クエリのみ20261004-2へ
- `tenten-guide.html`: 実装に追随した説明と照合済み表
- `juuou-checker.html`, `paripi-checker.html`: noindex、使い方リンク除去
- `juuou-guide.html`, `paripi-guide.html`: 削除
- `checkers.html`, `sitemap.xml`, `index.html`, `docs/ARCHITECTURE.md`: 公開2機種へ。NEW末尾の9/25の2行は579c8afからそのまま復元
- `tests/new-1005-four-machines.test.mjs`: 3タブと公開/保留の契約に追随
- `tests/new-1005-four-machines.browser.mjs`: 保留2機種、転生王女の旧データ・n/d・割合・全1,024組合せ・全項目カードを追加
- `tests/new-1005-public.verify.mjs`: 公開対象・件数・比較元abbe054に追随。保留ファイル・導線・復元NEW行も検証
- `tests/tenten-v02.test.mjs`: 指示値・移行・n/d補正・段位・分母・割合の5テスト新設
- `docs/specs/new-1005-public-v01.md`: ツムギ提供の追補v02を含める
- 本検証記録

共通checker-engine/checker-bayes、mhsunbreak/paripi/juuouの機種データ、MH zero goldenはabbe054とバイト一致。獣王のマイスロ入力・保存データ移行は維持。

## 判断した点・裁定の反映

- EP LV4はレベル別成功率に独立のn/dを設けず回数だけ記録。CZ全体では指示のczWin/czTotalどおり成功に含め、ガイドにも分母を明記した。
- 同rankでは終了画面を先にし、続いて枚数表示の定義順とした。数値rankだけで順位を決め、1010枚rank5より666枚rank6を優先する。
- サマリー内訳は裁定に従いmogumoguのshown()をそのまま移植し、「略号×件数」を「・」で繋ぐ。EP LV行も「・」区切り。§9-85の省略を許容し、最終Y936以下・はみ出し0・最小16pxと、詳細カードで全件確認できることを検証した。
- 見送り理由はツムギが原本を再取得して確認した以下の2文を、そのままガイドへ反映した。見送り項目の解析数値は掲載していない。
  - 上位CZ中の成立役別のボーナス当選率は、上位CZ自体の出現がまれで分母が溜まらないため扱っていません。
  - 革命ジャッジ経由のボーナス種別は、設定1と設定6の差が小さく、実戦で集まる回数では判別に使いにくいため扱っていません。
- 未確定事項なし。追加コミット・pushでPR #10へ反映し、mainへのマージは行わない。
- sitemapは2026-10-04、NEWは10/4を維持。マージしない。
- WISHLIST更新案: §8の完了記録は「モンハンサンブレイク・転生王女の2機種公開」に変更し、獣王・パリピ孔明は公開保留として区別する。実機検収・マージ完了後に反映する。

## 追加検証: EP LV1〜3の中間設定補完（2026-10-04）

ツムギの追加指示に従い、CZヒントとガイドに各6設定・計18値を掲載。既存のサブラベルは維持した。ガイドは他項目と同様に設定1〜6を行に並べ、EP LV1〜3を列にした。JS参照クエリは20261004-3へ更新。

- 数値: 両ファイルで18値・設定順が一致。既存の端点6値から中間12値を補完し、確率検証の総数は36値から48値へ。PASS。
- `node test/verify.mjs`: サニティ6設定・区間分割6設定ともPASS。
- `node --test`: 22件PASS、FAIL 0、skip 0。既存の数値照合テストを拡張。
- `node tests/new-1005-four-machines.browser.mjs`: 82件PASS、FAIL 0。360/390pxの入力タブでCZヒントを実クリックで展開して測定し、はみ出し0。ガイドも両幅で表示崩れ・はみ出し0。
- `node tests/new-1005-public.verify.mjs`: 6群すべてPASS。
- `git diff --check`・LF: PASS。
- 変更6ファイル: checker-data/tenten.js、tenten-checker.html、tenten-guide.html、tests/tenten-v02.test.mjs、tests/new-1005-four-machines.browser.mjs、本記録。
- 追加の未確定事項なし。WISHLIST更新案: §8の公開完了記録に「EP LV1〜3の6設定値を補完」を含める。
