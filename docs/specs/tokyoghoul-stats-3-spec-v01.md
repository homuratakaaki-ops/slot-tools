# 東京喰種 第1号 段3（旧111件の手集計を取り込む）仕様書 v0.1

- 作成：シオン／2026-11-28（JST）
- 根拠：骨格書 `docs/specs/tokyoghoul-nisshi-stats-skeleton-v02.md`（Q1＝A・Q4＝11/27までの111件はネネの数字）、段2 仕様書 §4、夢爽の決定（2026-11-28 23:28 有馬はネネに確認）
- 入力ファイル：ネネの `tokyo_ghoul_111sessions_20261128_arima.json`（夢爽のスマホの中だけ。**リポジトリに置かない**）
- 基準：main `ec7ebbe`
- 対象：`js/play-stats.js`（読み込み用の関数を足す）、`tools/nisshi/index.html`（設定の読み込み画面・集計の表示の補足）、検証

> 要するに：設定画面からネネのファイルを1回読み込むと、11/27までの111件が東京喰種の集計に入ります。円の収支には入れません。同じファイルを読み直しても数字は変わらず、いつでも取り消せます。

---

## 0. 絶対ルール

1. 円の収支（plays・日別・機種別・店別などの既存の分析）に**一切入れない**。入るのは「東京喰種の集計」だけ
2. 置き場所は段2で用意した `meta.statsConfirmed.tokyoghoul[sessionId]`。IndexedDB の版は上げない
3. ファイルの中身は**数字だけ**を取り出して保存する。元のログ（`original`）・注記（`annotations`）・ファイル全体は保存しない
4. 夢爽の実データ（111件のファイル）はリポジトリ・検証・fixture に置かない。検証は同じ形の**匿名の合成データ**で行う
5. 段2・段2-UI の集計の計算式・表示の形は変えない（足すのは §4 の補足だけ）
6. 既存の取り込み（rec・JSON・バックアップ復元）の動きを変えない

---

## 1. 入力ファイルの形（シオンが 2026-11-28 に実ファイルで確認）

```
{
  summary: {...},            // 合計（照合に使う）
  rules: {...},              // 説明（読まない）
  session_data: [            // 111件
    {
      sessionId: "…",                          // 重複なし
      storeNormalized: "DSG高岡" | "店舗未記録" | …,
      normalG_estimated: 整数,
      cz_awards, normalCZ_awards, normalCZ_success, upperCZ_awards, upperCZ_success: 整数,
      at_awards: 整数,
      calculated_delta_medals: 数,
      arima_judgment_success, arima_judgment_failure, arima_judgment_failure_inferred: 整数,
      original: { startedAt: "2026-09-02T15:31:47+09:00", payload: { machineDef: "generic" | "tokyoghoul", … }, … },
      …（ほかの項目は読まない）
    }
  ]
}
```

実ファイルの合計（取り込み後に一致すべき値）：通常G 22,170／CZ 133（通常112・成功64、上位21・成功16）／AT 97／実差枚 +23,342／勝ち46台／有馬 成功4・失敗7（失敗のうち推定1）

---

## 2. 変換（`PlayStats.importConfirmed(json)`、新しい関数）

DOM なし。Node からも呼べる。戻り値は `{rows, totals, errors}`。

| 保存する項目 | 元 | 備考 |
|---|---|---|
| `sessionId` | `sessionId` | キー |
| `date` | `original.startedAt` の日付（端末の日付。既存の `localDate` と同じ規則） | 期間の絞り込み用 |
| `shop` | `storeNormalized`。`"店舗未記録"` は空文字 | 店の絞り込み用 |
| `kind` | `"slot"` | |
| `normalG` | `normalG_estimated` | |
| `cz.レミニセンス` | `{count:normalCZ_awards, success:normalCZ_success, failure:count−success, unknown:0}` | |
| `cz.大喰いの利世` | `{count:upperCZ_awards, success:upperCZ_success, failure:count−success, unknown:0}` | |
| `at` | `at_awards` | 経路は無い（`atCauses` は全部0） |
| `ep` | 0 | 記録なし |
| `judge` | `{count:成功+失敗, success, failure, unknown:0}` | |
| `afterJudgeCz` | 0 | 記録なし |
| `medalDiff` | `calculated_delta_medals` | |
| `estimated`・`corrected`・`inconsistent` | false | |
| `setup` | `{}` | 着席項目は無い |
| `machineId` | `"tokyoghoul"` | |
| `importSource` | ファイル名 | 画面の表示用 |

- エラーで止める（1件でもあれば保存しない）：`session_data` が無い／sessionId の重複・空／数字の項目が整数でない・マイナス（差枚はマイナス可）／成功数が当選数を超える／`cz_awards ≠ normalCZ_awards + upperCZ_awards`
- `totals`：通常G・CZ（種別ごと）・AT・実差枚・勝ち台数・有馬（成功・失敗・推定）の合計。`summary` にある値と比べ、違えばプレビューに「ファイルの合計と違います」と出す（保存は止めない。夢爽が判断する）

---

## 3. 設定画面の読み込み

- 設定に「東京喰種の手集計を読み込む」の節（既存のファイル選択と同じ部品）
- 流れ：ファイルを選ぶ → プレビュー（台数・期間・合計の一覧・`summary` との一致）→「読み込む」で保存
- 保存：`meta.statsConfirmed.tokyoghoul` を**丸ごと置き換える**（同じファイルを読み直しても結果は同じ）。ほかの機種の `statsConfirmed` は触らない
- 読み込み済みなら、節に「読み込み済み：111台（ファイル名・読み込んだ日時）」と「取り消す」。取り消すと `meta.statsConfirmed.tokyoghoul` を消す（確認を1回出す）
- バックアップの書き出し・復元に含まれる（meta ごと保存されるので追加作業はない想定。検証で確かめる）

---

## 4. 集計の表示の補足（段2-UI の画面に足すだけ）

- **詳細タブ ATの経路別**：AT初当たりの合計から経路の合計を引いた数が1以上なら、「経路の記録なし ◯回」の行を足す（0回の項目と同じ扱い）
- **詳細タブ**：確定値の台があるとき、ATの経路別の下に小さく「手集計の台（◯台）は、ATの経路とEPの記録がありません」
- **履歴タブ**：確定値の台があるとき、先頭に小さく「手集計の台（◯台）は履歴に出ません」
- **絞り込み**：着席項目の条件を1つでもかけたとき、確定値の台は対象から外れる（段2で実装済み）。帯の対象台数でそれが分かること（今の表示のままでよい）
- **台の詳細**：確定値に同じ sessionId がある台（11/26〜27 の専用記録の3台）は、「この台の集計」の下に小さく「東京喰種の集計では、手集計の値を使っています」

---

## 5. 検収項目

N＝Node（`play-stats`）、B＝ブラウザ。データはすべて匿名の合成データ（実ファイルと同じ形で5〜6件）。

| # | 種類 | 確かめること | 期待 |
|---|---|---|---|
| T1 | N | 合成ファイルを `importConfirmed` | 行の値が §2 の対応どおり。totals が手計算と一致 |
| T2 | N | エラーの各条件（重複・負の数・成功＞当選・CZ合計の不一致・session_data なし） | errors が出て rows は空 |
| T3 | N | `summary` と合計が違うファイル | rows は作られ、不一致が分かる |
| T4 | N | 確定値の行＋自動の台（同じ sessionId 1件を含む）で `aggregate` | 同じ sessionId は確定値だけを数え、合計が手計算と一致 |
| T5 | B | 設定で合成ファイルを読み込む → 分析で「L東京喰種」 | 帯に「確定値 ◯台」、概要の数字が確定値＋自動の合計。既存の分析（円・月別・機種別・店別）の数字は読み込み前と同じ |
| T6 | B | 同じファイルをもう一度読み込む | 結果が同じ（増えない） |
| T7 | B | 取り消す | 読み込み前の集計に戻る |
| T8 | B | 期間・店で絞る | 確定値の台も日付・店で絞られる。「店舗未記録」は店の絞り込みで出ない |
| T9 | B | 着席項目（前回の当選＝CZ失敗など）で絞る | 確定値の台は外れ、帯の台数で分かる |
| T10 | B | 詳細タブ・履歴タブ | 「経路の記録なし」の行と、手集計の台の小さな注記が出る |
| T11 | B | バックアップ書き出し → 空のブラウザで復元 | 確定値と集計が同じ |
| T12 | B | エラーのあるファイルを読み込む | 何も保存されず、理由が出る |
| T13 | B | 360／390px で設定の節・プレビュー | 横はみ出しなし、ボタン44px以上 |
| T14 | — | 既存の検証をすべて | 通過 |

- シオンは、反映前に実ファイルを自分の環境で `importConfirmed` に通し、§1 の合計と一致することを確かめる（実ファイルはリポジトリに入れない）

---

## 6. やらないこと

- 円の収支への合算、既存の分析の変更
- 111件の元ログからの自動の数え直し
- 他機種の手集計の読み込み
- 段2・段2-UI の計算式・表示の形の変更（§4 の補足以外）
