## セッション開始時の確認事項

作業を開始する前に、以下のコマンドでGitHub Projects「slot-tools 優先度ボード」の現状を確認すること。

    & "C:\Program Files\GitHub CLI\gh.exe" project item-list 1 --owner homuratakaaki-ops --format json

確認する内容：
- 「進行可能」状態のタスクのうち、優先度が最も高いもの
- 「待ち」状態のタスクとその理由
- 依頼された作業がこのボードの項目と対応しているか

このコマンドが失敗する場合（gh未認証・権限不足・キーリング破損等）は、作業自体は通常通り進めてよいが、その旨を報告に一言添えること。
