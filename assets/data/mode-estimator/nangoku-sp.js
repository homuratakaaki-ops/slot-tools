window.MODE_ESTIMATOR_MACHINE_DATA = {
  id: "nangoku-sp",
  name: "L南国育ち SPECIAL",
  sourceUrl: "https://p-town.dmm.com/machines/5031",
  sourceName: "DMMぱちタウン",
  lastUpdated: "2026-07-16",
  axes: [
    {
      id: "origin",
      label: "起点",
      options: [
        { id: "reset", label: "設定変更後" },
        { id: "hisyou", label: "飛翔モード終了後" }
      ]
    },
    {
      id: "firstHit",
      label: "初当たりG数",
      options: [
        { id: "within200", label: "200G以内" },
        { id: "over200", label: "200G超え" }
      ]
    },
    {
      id: "result",
      label: "ボーナス結果",
      options: [
        { id: "toHisyou", label: "飛翔突入" },
        { id: "noHisyou", label: "飛翔せず終了（単発抜け）" }
      ]
    }
  ],
  reference: {
    ceilings: [
      { mode: "チャンス", ceiling: "200G" },
      { mode: "飛翔準備B", ceiling: "200G" },
      { mode: "通常A", ceiling: "500G（設定変更後・飛翔終了後のみ）" },
      { mode: "通常B", ceiling: "500G（設定変更後・飛翔終了後のみ）" },
      { mode: "飛翔準備A", ceiling: "500G" }
    ],
    initialDistribution: {
      reset: { "通常A": 30.0, "チャンス": 15.0, "通常B": 40.0, "飛翔準備A": 7.5, "飛翔準備B": 7.5 },
      hisyou: { "通常A": 45.0, "チャンス": 10.0, "通常B": 30.0, "飛翔準備A": 7.5, "飛翔準備B": 7.5 }
    }
  },
  cases: {
    "reset-within200": {
      hitModes: [
        { mode: "チャンス", percent: 66.7 },
        { mode: "飛翔準備B", percent: 33.3 }
      ],
      hitModesNote: "200G天井モードのみを比較した上限値。初期40%の通常B・30%の通常Aの早当たり分が含まれないため、実際のチャンス割合はこれより低くなります。",
      afterNoHisyou: {
        type: "text",
        text: "飛翔準備Bはほぼ否定。有力順は、チャンス、通常B、通常A。チャンスならボーナス後は通常B以上へ移行します。"
      },
      nextHit: [
        { range: "200G以内", view: "飛翔準備B・通常B・チャンスが有力" },
        { range: "200G超え", view: "通常Bが最有力。通常Aもあり。200Gを超えた時点でチャンス・飛翔準備Bは否定" }
      ],
      evaluation: { level: "strong", label: "強い", text: "比較的強い。チャンス経由の通常B以上に期待しやすい" }
    },
    "reset-over200": {
      hitModes: [
        { mode: "通常A", percent: 38.7 },
        { mode: "通常B", percent: 51.6 },
        { mode: "飛翔準備A", percent: 9.7 }
      ],
      afterNoHisyou: {
        type: "table",
        note: "飛翔準備Aを除外して再計算",
        rows: [
          { mode: "通常A", percent: 42.9 },
          { mode: "通常B", percent: 57.1 }
        ]
      },
      nextHit: [
        { range: "200G以内", view: "通常B・飛翔準備Bが中心。通常Aからのチャンス昇格もあり" },
        { range: "200G超え", view: "通常A・通常B。初回推定では通常B寄り" }
      ],
      evaluation: { level: "lean-b", label: "通常B寄り", text: "通常B寄り。まだ追う根拠は残る" }
    },
    "hisyou-within200": {
      hitModes: [
        { mode: "チャンス", percent: 57.1 },
        { mode: "飛翔準備B", percent: 42.9 }
      ],
      hitModesNote: "200G天井モードのみを比較した上限値。飛翔終了後は通常Aが45%と多く、200G以内でも通常Aの早当たりが無視できません。4ケース中もっとも推定がぼやけます。",
      afterNoHisyou: {
        type: "text",
        text: "飛翔準備Bはほぼ否定。有力は通常A・チャンス・通常B。通常A系が残っている可能性が高めです。"
      },
      nextHit: [
        { range: "200G以内", view: "チャンス・飛翔準備B・通常B。通常A早当たりも十分あり" },
        { range: "200G超え", view: "通常A・通常B。通常A寄りになりやすい" }
      ],
      evaluation: { level: "middle", label: "中間", text: "中間。推定精度が低い" }
    },
    "hisyou-over200": {
      hitModes: [
        { mode: "通常A", percent: 54.5 },
        { mode: "通常B", percent: 36.4 },
        { mode: "飛翔準備A", percent: 9.1 }
      ],
      afterNoHisyou: {
        type: "table",
        rows: [
          { mode: "通常A", percent: 60.0 },
          { mode: "通常B", percent: 40.0 }
        ]
      },
      nextHit: [
        { range: "200G以内", view: "通常Aからの早当たり・昇格、または通常B・飛翔準備B" },
        { range: "200G超え", view: "通常Aが最有力。次いで通常B" }
      ],
      evaluation: { level: "weak", label: "弱い", text: "4ケースで最も弱い。追う根拠が薄い" }
    }
  },
  toHisyouNote: "飛翔準備A・Bはボーナス後の飛翔移行濃厚のため、飛翔突入時は飛翔準備滞在だった可能性が相対的に上がります。飛翔終了後は初期振り分け（飛翔終了後）からの再スタートとして扱ってください。",
  disclaimers: [
    "200G以内当選は、通常A・通常B・飛翔準備Aの200G以内当選率が未公開のため、表示割合は「200G天井モードのみを比較した上限値」です。実際のチャンス・飛翔準備Bの割合はこれより低くなります。",
    "飛翔準備A・Bは「ボーナス後の飛翔移行が濃厚」を実質100%として計算しています。",
    "通常Bからの移行（飛翔準備B or 飛翔の50%）の内訳は未公開のため、単発抜け後の次回モード割合は確定値ではありません。"
  ]
};
