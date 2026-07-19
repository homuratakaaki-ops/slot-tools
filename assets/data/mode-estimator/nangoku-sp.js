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
  replayFlash: {
    rates: { "通常A": 379.4, "チャンス": 269.8, "通常B": 269.8, "飛翔準備A": 269.8, "飛翔準備B": 136.0, "超飛翔準備": 78.2 },
    priors: {
      reset: { "通常A": 30.0, "チャンス": 15.0, "通常B": 40.0, "飛翔準備A": 7.5, "飛翔準備B": 7.5 },
      hisyou: { "通常A": 45.0, "チャンス": 10.0, "通常B": 30.0, "飛翔準備A": 7.5, "飛翔準備B": 7.5 },
      superHisyou: { "通常A": 40.0, "チャンス": 10.0, "通常B": 40.0, "超飛翔準備": 10.0 }
    },
    originLabels: { reset: "設定変更後", hisyou: "飛翔モード終了後", superHisyou: "超飛翔モード終了後" },
    over200Excludes: ["チャンス", "飛翔準備B", "超飛翔準備"],
    aMode: "通常A"
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
      currentState: {
        headline: "通常B以上に期待しやすい状態",
        text: "有力な元モードのチャンスはボーナス後に通常B以上へ移行し、通常Bは転落しません。数値化はできませんが、通常B以上の滞在に期待しやすい状態です。下振れ要因は通常Aの早当たりだった場合のみです。"
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
        type: "range-table",
        note: "飛翔準備Aを除外し、通常Bの飛翔直行率（未公開・0〜50%）の両端で再計算した推定レンジ",
        rows: [
          { mode: "通常A", min: 42.9, max: 60.0 },
          { mode: "通常B", min: 40.0, max: 57.1 }
        ]
      },
      currentState: {
        headline: "次回は通常B以上が最低40%",
        text: "元が通常Bなら転落せず、今も通常B以上に滞在。その最低保証が40%です。さらに通常A（42.9〜60%）からチャンス・通常Bへ昇格している分が上乗せされるため、実際の通常B以上比率はこれより高くなります（上乗せ幅は未公開のため数値化不可）。"
      },
      nextHit: [
        { range: "200G以内", view: "通常B・飛翔準備Bが中心。通常Aからのチャンス昇格もあり" },
        { range: "200G超え", view: "通常A・通常B。初回推定では通常B寄り" }
      ],
      evaluation: { level: "lean-b", label: "通常B寄り", text: "通常B以上が最低40%担保。追う根拠は残る" }
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
      currentState: {
        headline: "通常A残りの可能性が高め",
        text: "飛翔終了後は通常Aの初期振り分けが45%と多く、200G以内でも通常Aの早当たりが十分あります。通常B以上の担保は弱く、4ケース中もっとも推定がぼやけます。"
      },
      nextHit: [
        { range: "200G以内", view: "チャンス・飛翔準備B・通常B。通常A早当たりも十分あり" },
        { range: "200G超え", view: "通常A・通常B。通常A寄りになりやすい" }
      ],
      evaluation: { level: "middle", label: "中間", text: "中間。通常A残りが下振れ要因で、推定精度が低い" }
    },
    "hisyou-over200": {
      hitModes: [
        { mode: "通常A", percent: 54.5 },
        { mode: "通常B", percent: 36.4 },
        { mode: "飛翔準備A", percent: 9.1 }
      ],
      afterNoHisyou: {
        type: "range-table",
        note: "飛翔準備Aを除外し、通常Bの飛翔直行率（未公開・0〜50%）の両端で再計算した推定レンジ",
        rows: [
          { mode: "通常A", min: 60.0, max: 75.0 },
          { mode: "通常B", min: 25.0, max: 40.0 }
        ]
      },
      currentState: {
        headline: "次回は通常B以上が最低25%",
        text: "元通常Bの最低保証は25%で、4ケース中もっとも弱い状態です。通常A（60〜75%）からの昇格分の上乗せはありますが、通常A残りの可能性が最有力です。"
      },
      nextHit: [
        { range: "200G以内", view: "通常Aからの早当たり・昇格、または通常B・飛翔準備B" },
        { range: "200G超え", view: "通常Aが最有力。次いで通常B" }
      ],
      evaluation: { level: "weak", label: "弱い", text: "通常B以上の最低保証は25%。4ケースで最も弱い" }
    }
  },
  toHisyouNote: "飛翔準備A・Bはボーナス後の飛翔移行濃厚のため、飛翔突入時は飛翔準備滞在だった可能性が相対的に上がります。飛翔終了後は初期振り分け（飛翔終了後）からの再スタートとして扱ってください。",
  disclaimers: [
    "200G以内当選は、通常A・通常B・飛翔準備Aの200G以内当選率が未公開のため、表示割合は「200G天井モードのみを比較した上限値」です。実際のチャンス・飛翔準備Bの割合はこれより低くなります。",
    "飛翔準備A・Bは「ボーナス後の飛翔移行が濃厚」を実質100%として計算しています。",
    "通常Bはボーナス時に50%で飛翔準備Bまたは飛翔へ移行しますが、内訳（飛翔直行率）は未公開です。単発抜け後の元モード推定は、この直行率を0%〜50%の両端で計算した推定レンジで表示しています。",
    "通常Aはボーナスで飛翔へ直行しない前提で計算しています。通常A滞在時のボーナス後は、通常A残り・チャンス・通常Bへの昇格が中心です。"
  ]
};
