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

店に 1 つ持つ。B1 以降は島ビルダーで入力し、構造化データとして保存する。

```json
{
  "islands": [
    {
      "left": { "from": 101, "to": 105 },
      "right": { "from": 199, "to": 195 },
      "excluded": ["104"]
    }
  ],
  "updatedAt": "ISO8601",
  "errors": []
}
```

- `left` は左列、`right` は右列。右列が空欄の場合は `null` として片面島を表す。
- `from` と `to` は昇順・降順どちらでもよい。
- `excluded` は存在しない台番の一覧。プレビュー上の台番をタップして除外/復帰する。
- 旧テキスト定義 `{ source: "100-104 | 199-195" }` は読み込み時に `islands` へ自動変換する。
- 旧テキストに歯抜け指定がある場合は、先頭から末尾までの範囲に展開し、存在しない中間台を `excluded` に入れて台番構成を維持する。
- 重複台番など、読めても危険な状態は警告表示する。

### 2.3 Machine

```json
{
  "id": "string",
  "storeId": "string",
  "daiNo": "string",
  "modelName": "string",
  "roundBalls": null,
  "memo": ""
}
```

- マップ定義から台番だけの Machine を自動生成する。
- 機種名、1R 玉数、台メモ（釘・癖など）は後付け編集できる。
- B1 で `payoutType` は廃止。旧データに存在する場合も読み込み時に保持しない。
- 期待値算出は現在 P大海物語スペシャル5 のみ対応。将来の機種追加は別枠で検討する。

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
  "totalRounds": null,
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
| `ytv3:premigrate` | 将来のスキーマ変更時に、旧 schema の raw データを退避する | 読み込み時、保存済み `version` が実装中の `SCHEMA_VERSION` と異なり、かつ `ytv3:premigrate` が未作成の場合。B1 では schema 1 から 2 への更新時に作成される | 変更前の `ytv3:data` raw 文字列 |
| `ytv3:backup:latest` | 通常保存前の直近バックアップ | `persist()` 実行時、既存の `ytv3:data` がある場合に、新しい `ytv3:data` を書く直前 | 直前の `ytv3:data` raw 文字列 |

### 3.1 容量予算記録

`data.meta` に以下を持つ。

- `lastSaveChars`: 直近保存時の `JSON.stringify(data).length`
- `sampleSessionChars`: Session 1 件の `JSON.stringify(session).length`
- `sampleMachineChars`: Machine 1 件の `JSON.stringify(machine).length`
- `mapLayoutChars`: 現在の MapLayout 1 件の `JSON.stringify(layout).length`
- `schemaBudgetNote`: 容量予算の注記

実装上、画面下部にも保存キー、現在保存 chars、マップ定義 chars、Machine 1 件 chars、Session 1 件 chars を表示する。

B1 実測値:

- schema 2 空マップ定義: 14 chars (`{"islands":[]}`)
- schema 2 Machine 1 件サンプル: 111 chars

## 4. 派生値

保存せず表示時に計算する。

- 通常消費玉 = 開始持ち玉 + 投資玉換算 - 当選時残り玉
- 非パーソナル店または当選時残り玉未入力の場合は投入玉ベースにフォールバックする。
- セッション回転率 = 通常回転数 / 通常消費玉 * 250
- 台の参考回転率 = セッション群の通常回転数合計 / 通常消費玉合計 * 250
- 遊タイム玉減り = `hitVia === "yutime"` かつ突入時玉数と当選時残り玉がある場合に計算する。
- R数ベース出玉 = `roundBalls * totalRounds`
- 1回あたりR数ベース平均出玉 = `roundBalls * totalRounds / hitCount`

## 5. Phase

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | データモデル、店選択、マップ定義/描画 | B1更新済み |
| 2 | セッション記録一式、スキップ、補完編集 | B1更新済み |
| 3 | マップへのデータオーバーレイ、イベントフィルタ強化 | 一部土台のみ |
| 4 | 期待値エンジン | 未実装 |

## 6. QA 観点

- 全項目スキップでセッション保存できること。
- 後から全項目を補完編集できること。
- 旧テキスト定義が島構造へ自動変換され、同じ台番構成で表示されること。
- 島ビルダーで歯抜け配置を作成でき、保存後も除外が維持されること。
- 片面島が正しく描画されること。
- `payoutType` 削除後も、既存台データの機種名と 1R 玉数が残ること。
- 台メモが保存・再表示されること。
- 「イベントメモ」表記が画面上で統一されていること。
- `ytv3:` 以外の localStorage キーを読み書きしないこと。
- TOP ページ、既存ページ、sitemap から `yutime-v3.html` へリンクしないこと。
- 公開後、`https://slot-tools.jp/yutime-v3.html` が 200 応答すること。

## 7. 今回スコープ外

- v2 -> v3 データ移行。
- グラフィカルなマップエディタ。
- 複数店舗横断の集計。
- 期待値エンジン。

## 8. アイデアメモ

- 機種スペック登録の別枠化。
