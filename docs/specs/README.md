# docs/specs — 仕様書・実装指示書・機種定義の置き場

2026/10/1 夢爽が決めた置き場。それまで仕様書が Downloads にあり、実装の途中で
「正本が見つからない」とミコトが止まる事故が起きたため、リポジトリ内に移した。

- **IDEAS.md から参照するときは `docs/specs/<ファイル名>` と書く**
- ここに置くのは、作るものを決めた文書（仕様書・実装指示書・機種定義）だけ。
  進捗や検証結果は `IDEAS.md`、全体の地図は `docs/ARCHITECTURE.md`、規約は `AGENTS.md`

## 置いてあるもの

| ファイル | 中身 |
|---|---|
| `nisshi-spec-v03.md` | 稼働日誌（tools/nisshi/）の仕様書 v0.3（確定）。**稼働日誌の正本** |
| `nisshi-phase1-instructions.md` | 稼働日誌 第1段の実装指示書（IndexedDB・取り込み・二重計上の防止・各画面・書き出しと復元） |
| `nisshi-phase2-instructions.md` | 稼働日誌 第2段の実装指示書（開始日・名前のまとめ・日記・狙い方・note用コピーほか） |
| `kanokari-spec-v02.md` | Lパチスロ 彼女、お借りします の機種定義 仕様 v0.2 |
| `kanokari-def-v21.js` | 彼女、お借りします の機種定義 v0.21。**定義の正本** |
| `rec-kanokari-engine-v01.md` | tools/rec-kanokari の器（エンジン）の拡張仕様 v0.1 |
| `rec-ledger-spec-v01.md` | tools/rec 簡易収支帳 第1段の実装仕様（rec91） |

## 注記

### 稼働日誌

**`nisshi-spec-v03.md` が正本。** `nisshi-phase1-instructions.md` と
`nisshi-phase2-instructions.md` は実装指示書で、正本の §8 の段ごとに切り出したもの。
仕様の判断は正本を見る。

### 彼女、お借りします（かのかり箱）

**`kanokari-def-v21.js` が定義の正本。**
`kanokari-spec-v02.md` は **v0.2 時点**の仕様で、**それ以降の変更は定義（v21）と `IDEAS.md` にある**。
仕様書だけを読んで実装しないこと。

`kanokari-def-v21.js` は `MACHINES` に差し込む**断片**（`kanokari:{…}` から始まる）で、
単体では実行できない（`node --check` は通らない）。読み物・貼り付け元として置いている。

### 簡易収支帳

**`rec-ledger-spec-v01.md` は rec91（第1段）の仕様。**
**rec93〜95 の変更は `IDEAS.md` にある**（第3段の月別・機種の絞り込み、第4段の使い勝手、
保存容量の削減）。仕様書には入っていない。
