# 機種プリセット追加ガイド（nerai-record.html）

作成：シオン（2026-07-12・南国育ちSPECIAL対応の知見より）
用途：新機種のプリセットを追加・修正する際の設計リファレンス。

---

## 1. 機種プリセットが持てる汎用機構（南国で実装済み・流用可）

| 機構 | 設定場所 | 用途 | 南国での例 |
|---|---|---|---|
| hitTriggers | machine.hitTriggers | 当選種別の定義（key/label/color） | BIG=red、REG=light-blue |
| hitTrigger variants | machine.hitTriggers[].variants | 稀な当選種別の後付けマーク。通常入力を邪魔せず、出た時だけ当選イベントにvariantを付与する | BIGの青7マーク（blue7） |
| chainRule | machine.chainRule | G数ベースの連チャン自動判定 | {maxGap:42, enterLabel:'飛翔モード突入', unitLabel:'連'} |
| intervalEstimate | log.intervalEstimate + timeline.intervalEvent | 有利区間差枚の推定。初期差枚・貸出レート・投資/クレジット記録から表示時点の推定差枚を残す | クレジット収支ベースの推定区間差枚 |
| subCounter | machine.subCounter | 機種固有カウンター（resetOn:'hit'で当選リセット） | スイカ回数 |
| subCounterDelta | tags[].subCounterDelta | タグ押下でカウンター自動加算 | スイカタグ→+1 |
| suggestLink | tags[].suggestLink | クイックタグ→示唆記録の自動連動 | さざなみ赤タグ→さざなみ前兆:赤 |
| entryCause | timeline.entryCause | 突入タグに契機を持たせ、後で契機別件数を拾えるようにする | SDC/超飛翔突入の契機（ときめき32G目等） |
| carryType | suggestMaster items | 示唆の分類（mode/setting）。まとめ集計・バッジ・引き継ぎの基準 | リール発光=mode、ボイス=setting |
| summaryDefault | suggestMaster items | 「情報なし」項目を集計の表示・分母から除外 | ボイスなし、リール発光変化なし |
| accent | suggestMaster items | 整理ビューでの値の色付け | 青=blue、緑=green、虹=gold |
| useLiquidOffsetCounter | machine | データG/液晶Gの差分管理（東京喰種のuseLcdCounterとは別物） | 朝一0・ボーナス後9 |

## 2. 最重要ルール：既存データへの後付けは「バージョンガードの前」

プリセット関数は `if(machine.suggestSeed◯◯V2)return;` のようなバージョンフラグで二重適用を防いでいる。**ガードの後ろにあるシード変更は、フラグが立った既存ユーザーには永久に届かない。**

既存データに属性を後付けする場合は、ガードの**前**にピンポイントのマイグレーションを置く（本日の実例：スイカタグのsubCounterDelta、chainRule、summaryDefault/accent）。または、フラグをV3に上げて全量再シードする。ただしユーザーのタグカスタムを壊すリスクがあるため、原則ピンポイント方式を推奨する。

## 3. 検証の鉄則

1. **新規localStorageだけで合格にしない。** 「V2フラグ済み・新属性なし」の既存データを再現して検証する。テスト環境と実機のデータ状態の差が、「直したのに直らない」ループの原因になる。
2. **集計値は実戦者の体感と照合する。** 設定示唆×7の多重カウントは、「そんなに出ていない」という実戦記憶で発覚した。集計系の受け入れ条件には実数照合を必ず入れる。
3. 対象外機種（chainRule/accent等を持たない機種）でエラーが出ないことを毎回確認する。
4. **下書きスキーマの互換性を維持する。** 実戦中の `draftLog` はリロードやデプロイ跨ぎで読まれる。新フィールド追加やカウンター仕様変更時も、旧下書きは全体を捨てず、読めないフィールドだけ既定値で補完する。復元に失敗した場合は下書きを削除せず、警告を出してバックアップ復旧できる状態を残す。

## 4. 既知の落とし穴

- **trigger keyの流用**：南国のBIGは内部キー`direct_at`、REGは`episode_bonus`（汎用キーをラベル上書きで流用）。キー名と意味が乖離しているので、hitTriggersを参照するロジック（青7昇格判定等）を書くときはラベルでなくその機種のkey定義を必ず確認すること。新機種では意味の合うkeyを使うか、専用keyを検討する。
- **示唆の引き継ぎ複製**：carryType付き示唆は区切りごとにclone複製され、各区切りに全量スナップショットが保存される。**示唆を数える・列挙する処理は必ずentry.idで重複排除する**（idなし旧データはplaceId+itemId+G数+createdAtの複合キーfallback）。
- **色の適用単位**：区切りヘッダー＝区切り単位の色（segmentToneClass）、整理ビュー・画像の当選行＝イベント単位の色（hitTriggerのcolor）。1行1当選の表示に区切り色を使うと「青いのにBIG」の混乱が起きる。
- **当選時モード示唆とチェーン**：chainRule機種では、非終端当選の当選時モード示唆は表示上ノイズ（次のモード推測に使えるのは終端のもののみ）。フィルタは示唆のhitEventId紐づけで判定し、IDなし旧データは安全側（表示）に倒す。

## 5. 新機種追加チェックリスト

1. 実機/動画でUI仕様を確認（G数表示の種類、カウンター、告知仕様）
2. hitTriggers（key/label/color）を定義。稀にだけ区別したい当選種別は、必須ステップにせず variants で後付け可能にする
3. 連チャン仕様があればchainRule（maxGap/enterLabel）を数値ごと確認
4. レア役・演出タグ＋必要ならsubCounter/subCounterDelta/suggestLink
5. 有利区間差枚や突入契機など、機種固有の検証軸がある場合は timeline の任意フィールドで残す。既存ログはフィールド欠落を許容する
6. 示唆マスタ：carryTypeをmode/settingで正しく分類（意味論を実戦者に確認）、デフォルト項目にsummaryDefault、色物にaccent
7. バージョンフラグ名を新規に切る（既存機種のフラグを使い回さない）
8. 検証：新規環境＋既存データ再現＋対象外機種の3系統
