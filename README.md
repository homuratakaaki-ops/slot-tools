# slot-tools

## toaru2-checker 初版の既知制約

- 取消履歴はページ再読み込みで消える。リセット直前の `toaru2-checker-v1-bak` は localStorage に残るが、初版では復元UIを持たない。
- localStorage 保存は既定スキーマへの浅いマージで読み込む。項目追加や構造変更を行う場合は、スキーマバージョン管理を導入する。
- X共有は Canvas `toBlob()` と Web Share API の対応状況に依存する。一部ブラウザで共有シートが開かない場合は、カード画像を保存して投稿する。
