# サンブレイク シナリオ参考％の表示モード（3択）v01

シオン発行の指示書（2026-10-20）の原文。

```
【作業】fix/mhsunbreak-pct-mode — サンブレイク：シナリオ参考％の表示モード（3択）
発行：シオン 2026-10-20　実装：ミコト（Codex）へ委任可　発案：夢爽
前提：PR #58（feature/mhsunbreak-scenario-display-mode-20261020、ドラフト）はクローズし、その差分を下敷きに main から作り直す。
方針（夢爽決定）：既定は現行どおり（設定1否定が出たら％を消す）。手動で切り替えたときだけ％を出す。
対象：checker-data/mhsunbreak.js、mhsunbreak-checker.html（?v=）、mhsunbreak-guide.html、index.html NEW欄、docs/specs/mhsunbreak-pct-mode-v01.md（新規）、tests
テスト版先行（§9-108）。保存データ（記録）は変えない。prefs のみ追加なので、マージは夢爽確認後すぐで可。

■ 1. モード（prefs.scenarioPctMode、記録とは別保存。既定 'auto'）
  auto      ：現行どおり。設定1否定（setting1Denied）があれば％と次のBZレベル別％を出さない
  p1        ：設定1否定があっても％を出す。警告文「⚠ 設定1否定の記録があります。表示中の％は設定1の場合の参考値で、実際の設定の確率ではありません。」を％の上に出す
  candidates：常に％と次のBZレベル別％を出さない。候補の絞り込みは変えない
  scenarioPct / nextBzLevelPct の「出す条件」はこの3状態で決める。それ以外の条件（開始不明／候補0〜1件／8回目以降／福引SP）は現行のまま。
  不正値や未設定は 'auto' とみなす。

■ 2. UI（BZタブ「現在地」、福引チェックの下）
  見出し「シナリオ参考％の表示」、3ボタン「自動」「設定1基準％」「候補のみ」（44px以上、aria-pressed）。
  hint：「自動は、設定1否定の記録が出ると％を隠します。設定1基準％は否定があっても％を出します（警告付き）。候補のみは％を出しません。どれを選んでも候補の絞り込みは同じです。」
  シナリオカード（scenarioCardModel の note）も同じモードに追随。note の文言：
   auto      ：「％は設定1の選択率に基づく参考値。設定1否定が出ると表示しません」（現行）
   p1        ：「％は設定1の場合の参考値。設定1否定時も実際の設定の確率ではありません」
   candidates：「候補のみ：参考％は非表示。候補の絞り込み条件は同じです」
  ボタン操作は取消の履歴に積まない（fukuMode と同じ扱い）。

■ 3. ガイド追随・NEW欄・キャッシュ
  mhsunbreak-guide.html に3モードの説明を追加。
  index.html NEW欄先頭「MM/DD｜モンハンサンブレイク シナリオ参考％の表示を3択（自動／設定1基準％／候補のみ）に」（日付はマージ日、8行上限、テスト版には載せない）。
  ?v=20261020（本番・テスト版とも。慣例の YYYYMMDD 形式）。

■ 4. テスト
  既存の mhsunbreak-scenario-pct / next-bz-pct / scenario / next-bz の各 verify は「auto」で現行どおり全通過すること（期待値を変えない）。
  tests/mhsunbreak-pct-mode.verify.mjs を追加：
   (1) 既定（prefs なし）＝auto で、設定1否定ありなら scenarioPct・nextBzLevelPct が null
   (2) p1 で同じ状態なら値が返り、警告文が出る
   (3) candidates では否定の有無にかかわらず null
   (4) 不正値は auto 扱い
   (5) 記録（storageKey の JSON）がモード切替で1バイトも変わらない
  tests/mhsunbreak-pct-mode.browser.mjs：3ボタンの切替・再読み込み後の保持・360/390/412px ではみ出しなし・シナリオカードの note が追随。

■ 5. push・報告
  PR #58 をクローズ（コメント「fix/mhsunbreak-pct-mode で作り直し」）。
  ブランチ fix/mhsunbreak-pct-mode、テスト版を main に公開→削除コミット→PR作成。マージはしない。
  報告：テスト版URL、PR番号、PNG（3モードそれぞれの現在地、警告表示、カード note）。
  commit名義：実装者 Mikoto <codex@slot-tools.local>（ツムギ直接なら Tsumugi）。
```

## 実装メモ（ツムギ）

- 警告文は「設定1基準％」かつ設定1否定ありのときに、現在の状況のモード選択の直下（候補行の上）に1か所だけ出す。過去のAT間の行には出さない（否定は記録全体で1つの判定のため）。
- 既存 `tests/mhsunbreak-next-bz-pct.verify.mjs` の g（改修前の画面と一致）は、福引切替と同じ方法で新しいモード選択のブロックとCSSを比較から外した。期待値は変えていない。
