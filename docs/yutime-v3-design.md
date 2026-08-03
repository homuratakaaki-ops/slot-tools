# 遊タイム実戦ツール v3 設計図

作成: シオン

依頼者: 夢爽

実装対象: `yutime-v3.html`
公開形態: 限定公開。TOPページ・既存ページからリンクしない。URL直打ちのみ。

## 0. 開発方針

- v3 は現行 v2 とデータを共有しない。
- localStorage キーは `ytv3:` prefix に完全分離する。
- 現行 `yutime-record.html` は残置し、v3 安定後に移行ツールを別途検討する。
- SPA 構成は現行と同じく、単一 HTML・インライン JS とする。
- スキーマ変更時の容量予算記録ルールを v3 にも適用する。

## 1. 実戦フロー

```text
[店選択] -> [マップ（台探索）] -> 台番タップ
                              -> [打ち始めウィザード] -> セッション開始
                              -> [稼働中画面]
                              -> [当選ウィザード]
                              -> [終了ウィザード] -> セッション確定 -> マップへ戻る
```

- 全ウィザードは「次へ」で進む直列形式。
- 全項目スキップ可能。
- スキップ項目は `null` 保存する。
- 未入力項目があるセッションは「未入力あり」バッジを表示し、台帳から後で補完編集できる。

## 2. データモデル

### 2.1 Store

```json
{
  "id": "string",
  "name": "string",
  "isPersonal": true,
  "createdAt": "ISO8601"
}
```

### 2.2 MapLayout

店に 1 つ持つ。テキスト簡易定義方式。

```text
100-104 | 199-195
105-109 | 194-190
```

- 1 行 = 島の片面ペア。
- `|` の左右を通路を挟んだ対面として扱う。
- `100-104` は昇順、`199-195` は降順に展開する。
- 空行は無視する。
- 重複台番と不正トークンは警告表示する。

### 2.3 Machine

```json
{
  "id": "string",
  "storeId": "string",
  "daiNo": "string",
  "modelName": "string",
  "payoutType": "fixed",
  "roundBalls": null
}
```

- マップ定義から台番だけの Machine を自動生成する。
- 機種名、出玉タイプ、1R 玉数は後付け編集できる。

### 2.4 Session

```json
{
  "id": "string",
  "storeId": "string",
  "machineId": "string",
  "date": "YYYY-MM-DD",
  "status": "active",
  "labels": [],
  "startSpin": null,
  "startTime": null,
  "startMochidama": null,
  "startSaipurei": null,
  "startCredit": null,
  "prevDayEndSpin": null,
  "investments": [
    { "type": "cash", "amount": 1000, "time": "12:34" }
  ],
  "hitSpin": null,
  "hitRemainBalls": null,
  "hitVia": null,
  "yutimeEnterBalls": null,
  "hitCount": null,
  "endTotalBalls": null,
  "endSpin": null,
  "endTime": null,
  "zanhoryuBalls": null,
  "memo": "",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

## 3. 保存キー仕様

v3 は以下の localStorage キーのみを使用する。

| key | 用途 | 書き込みタイミング | データ形式 |
|---|---|---|---|
| `ytv3:data` | v3 本体データ | 店追加、マップ保存、台情報保存、セッション開始、投資追記、遊タイム突入、当選保存、終了保存、補完編集保存 | JSON.stringify された v3 全体データ |
| `ytv3:premigrate` | 将来のスキーマ変更時に、旧 schema の raw データを退避する | 読み込み時、保存済み `version` が実装中の `SCHEMA_VERSION` と異なり、かつ `ytv3:premigrate` が未作成の場合 | 変更前の `ytv3:data` raw 文字列 |
| `ytv3:backup:latest` | 通常保存前の直近バックアップ | `persist()` 実行時、既存の `ytv3:data` がある場合に、新しい `ytv3:data` を書く直前 | 直前の `ytv3:data` raw 文字列 |

### 3.1 容量予算記録

`data.meta` に以下を持つ。

- `lastSaveChars`: 直近保存時の `JSON.stringify(data).length`
- `sampleSessionChars`: Session 1 件の `JSON.stringify(session).length`
- `schemaBudgetNote`: 容量予算の注記

実装上、画面下部にも保存キー、現在保存 chars、Session 1 件サンプル chars を表示する。

## 4. 派生値

保存せず表示時に計算する。

- 通常消費玉 = 開始持ち玉 + 投資玉換算 - 当選時残り玉
- 非パーソナル店または当選時残り玉未入力の場合は投入玉ベースにフォールバックする。
- セッション回転率 = 通常回転数 / 通常消費玉 * 250
- 台の参考回転率 = セッション群の通常回転数合計 / 通常消費玉合計 * 250
- 遊タイム玉減り = `hitVia === "yutime"` かつ突入時玉数と当選時残り玉がある場合に計算する。

## 5. Phase

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | データモデル、店選択、マップ定義/描画 | 実装済み |
| 2 | セッション記録一式、スキップ、補完編集 | 実装済み |
| 3 | マップへのデータオーバーレイ、イベントフィルタ強化 | 一部土台のみ |
| 4 | 期待値エンジン | 未実装 |

## 6. QA 観点

- 全項目スキップでセッション保存できること。
- 後から全項目を補完編集できること。
- マップ定義の逆順レンジ、空行、重複台番、不正入力でパースが壊れないこと。
- `ytv3:` 以外の localStorage キーを読み書きしないこと。
- TOP ページ、既存ページ、sitemap から `yutime-v3.html` へリンクしないこと。
- 公開後、`https://slot-tools.jp/yutime-v3.html` が 200 応答すること。

## 7. 今回スコープ外

- v2 -> v3 データ移行。
- グラフィカルなマップエディタ。
- 複数店舗横断の集計。
- 期待値エンジン。
