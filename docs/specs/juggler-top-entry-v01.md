# ジャグラーをトップの独立した入口にする 実装指示書 v01

発行: ツムギ（2026-10-04）／実装: ミコト／裁可: 夢爽
訂正: ツムギ回答・夢爽承認の追加変更を反映（UI版表示は新設しない／§5-11の44px条件を撤回／§2のカード見出し2件を変更）。
ブランチ: `feat/juggler-top-entry`（main の `8b2b621` から分岐）

## 0. 守ってほしい歯止め

- **UI の変更を自分の判断で足さない。見た目を直したくなったら実装せずに報告すること。**
  **新しいデザイン要素を作らない。** 既存セクションの作りをそのまま使う
- **共通ファイル（`checker-engine.js` / `checker-bayes.js`）は変更しない**
- **`sitemap.xml` は変更しない**（ジャグラーのページ自体は残るため）。
  変更が必要と判断したら**止めて報告**する
- 今回やらないこと: ジャグラーの機種の並べ替え、ヘッダーの区切り記号の統一

---

## 1. 現状調査の結果（ツムギ実施済み・再調査不要）

| 項目 | 内容 |
|---|---|
| `checkers.html` のジャグラー掲載 | **86〜89行**（「スマスロ・AT機」の直後・ページ最下部）。掲載は**1行だけ** |
| リンク先と文言 | `juggler-record.html`「ジャグラー実戦記録・設定推測（6号機9機種）」＋ `juggler-guide.html`「使い方」 |
| 注記段落 | **90行** `<p class="note">今後、機種別の設定判別ツールやカウンターを追加する場合も…` |
| ツール本体 | `juggler-record.html` |
| ガイド | `juggler-guide.html` |
| **`checkers.html` へ戻るリンク** | **両ページとも0件。既に `← TOP`（`juggler-record.html:474` は `href="./"`、`juggler-guide.html:53` は `href="/"`）でトップへ戻る作り** |

→ **「ジャグラーのページ・ガイドのリンクを向け直す」作業は不要**（既にトップ向き）。
`juggler-record.html` / `juggler-guide.html` は**1バイトも触らない**。

### 対象外

- `settei-estimator.html`（「設定判別ツール（ジャグラー）」）は `checkers.html` に掲載が無い
- `myjuggler5-checker.html` / `myjuggler5-guide.html` は `checkers.html`・`sitemap.xml`・
  `index.html` のいずれにも載っていない（noindex・導線なし）

### `index.html` の現在のセクション並び

```
NEW → 設定判別 → パチンコ計算 → リコリス・リコイル → 実戦ログ
  → L南国育ち SPECIAL → 北斗の拳 転生の章2 →（説明文）
```

---

## 2【必須】`index.html`

### 2-1 既存セクションの見出しをそろえる（夢爽裁可）

`checkers.html` の `<h1>` を「設定判別カウンター」に変えたので、トップ側もそろえる。

```html
- <div class="section-label">設定判別</div>
+ <div class="section-label">設定判別カウンター</div>
```

### 2-2 既存カードの説明文を実態に合わせる

ジャグラーを一覧から外すので、現在の文が事実と違ってしまう。

```html
- <p>機種別の設定判別カウンター（スマスロ・ジャグラー）を選べます。タップでカウント、割合表示、テンプレ出力、共有カード画像の生成に対応しています。</p>
+ <p>機種別の設定判別カウンター（スマスロ・AT機）を選べます。タップでカウント、割合表示、テンプレ出力、共有カード画像の生成に対応しています。</p>
```

カード見出しは `<h2>設定判別カウンター（機種を選ぶ）</h2>` に変更する。リンクは**そのまま**。

### 2-3 ジャグラーのセクションを新設

**上の「設定判別カウンター」のカード（`</div>`）の直後、`<div class="section-label">パチンコ計算</div>` の前**に置く。

**作りは「L南国育ち SPECIAL」のモード推測ツールのカードと同じ**にする。
`section-label` ＋ `tool-card`（`role="link"` / `tabindex="0"` / `onclick` / `onkeydown`）＋
`h2` ＋ `p` ＋ `guide-link` 2本。**新しいクラスやスタイルを足さない。**

```html
<div class="section-label">ジャグラー</div>
<div class="tool-card" role="link" tabindex="0" onclick="location.href='juggler-record.html'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();location.href='juggler-record.html';}">
  <h2>ジャグラー実戦記録・設定推測</h2>
  <p>ぶどう・ボーナス内訳をタップでカウントし、投資を記録しながら、各設定である可能性を確認できます。入力は端末内にのみ保存します。</p>
  <a class="guide-link" href="juggler-record.html" onclick="event.stopPropagation();">ツールを開く →</a>
  <a class="guide-link" href="juggler-guide.html" onclick="event.stopPropagation();">📖 使い方・詳しい説明 →</a>
</div>
```

説明文は `juggler-record.html` の `description`（「ホールで使うジャグラーの実戦記録ツール。
ぶどう・ボーナス内訳をタップでカウントし、投資を記録しながら、各設定である可能性を
リアルタイムに確認できます。入力は端末内にのみ保存します。」）から作っている。
**解析値や新しい主張を足さないこと。**

### 2-4 NEW欄は触らない

8行のまま。今回は NEW欄に追記しない（夢爽の指示に無いため）。

## 3【必須】`checkers.html`

1. **86〜89行のジャグラーのセクション（`section-label` ＋ `checker-list` ＋ 1行）を削除**
2. **90行の `<p class="note">今後、機種別の設定判別ツールやカウンターを追加する場合も…` の段落を削除**（夢爽決定済み）

削除後、`<main>` の中身は `<h1>` ＋ 説明段落 ＋「スマスロ・AT機」のセクションだけになる。
**「スマスロ・AT機」の機種の並び・文言は1行も変えない。**

`description` / `og:description` にジャグラーへの言及があれば外す（無ければ触らない）。

## 4【必須】触らないもの

- `juggler-record.html` / `juggler-guide.html`（既にトップ向き。**1バイトも変えない**）
- `sitemap.xml`
- `settei-estimator.html` / `myjuggler5-*`
- 他機種の掲載・リンク

---

## 5 検証（項目ごとに PASS/FAIL と件数を報告）

1. **トップからジャグラーのツールとガイドに辿れる**（実リンクを辿って確認）
2. `checkers.html` に `juggler-record.html` / `juggler-guide.html` へのリンクが**0件**
3. `checkers.html` に `class="note"` の段落が**0件**
4. `juggler-record.html` / `juggler-guide.html` から `checkers.html` へのリンクが**0件**で、
   **トップへ戻れる**こと（`← TOP` が機能する）
5. **`juggler-record.html` / `juggler-guide.html` が1バイトも変わっていない**（`git diff` で示す）
6. **`checkers.html` の「スマスロ・AT機」の機種行が1行も変わっていない**
   （`8b2b621` と突き合わせて件数と内容を報告）
7. `index.html` の既存セクションの並びが変わっていないこと
   （NEW → 設定判別カウンター → **ジャグラー** → パチンコ計算 → … の順）
8. `index.html` の NEW欄が**8行のまま**
9. **`sitemap.xml` が無変更**
10. **他機種の掲載・リンクに変化なし**（`checkers.html` / `index.html` の他の行の差分0）
11. **360px / 390px の実ビューポートで表示崩れなし**（`index.html` と `checkers.html`。
    はみ出し0・表示崩れなし）。既存の `.guide-link` スタイルは変更せず、実測高さを報告する。
12. 新しいクラス・スタイルを足していないこと（`index.html` の `<style>` が無変更）
13. `node test/verify.mjs` → 全設定OK
14. `node --test` → 件数とPASS/FAIL（**22件** が期待値。減らさない）
15. `node tests/new-1005-four-machines.browser.mjs` → 件数と FAIL 0
16. `node tests/new-1005-public.verify.mjs` → 全PASS。
    **`checkers.html` / `index.html` を見ているアサーションがあれば期待値を追随させる。
    チェック内容は弱めない**
17. `node tests/magireco-remove-estimate.verify.mjs` → 全PASS
18. `node tests/wording-noukou.browser.mjs` → 既存の省略6機種8行以外にFAILが増えていない
19. `git diff --check` と LF

## 6 コミット・push

- コミット1本でよい。名義は `Mikoto <codex@slot-tools.local>`
- `feat/juggler-top-entry` を push する
- **PR作成とマージはツムギが行うので、ミコトはどちらもしないこと**
- push が環境で拒否される場合はコミットまでで止めて報告

## 7 報告に含めるもの

1. 変更ファイル一覧
2. §5 の1〜19の結果
3. 新設したセクションのHTML全文
4. 迷った点
