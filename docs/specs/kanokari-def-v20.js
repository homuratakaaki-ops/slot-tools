// MACHINES.kanokari v0.20（第6弾：全部失敗後の終了画面、セリフのその他、REG紹介の系列別行、引き戻し中のG数付きセリフ、次ステージの初期選択）
// MACHINES.kanokari v0.19（第5弾：ENDING突入の入力（LAST＋クレジット）と有利区間切れ見込み、ENDING終了の実際との差、終了ボタンの表示）
// 第4弾：33Gのアイキャッチを引き戻し系に、画面に版数表示
// 第3弾：レンCHANCE開始キャラの入力位置、1GレンCHANCEの成否、CZ成功のステージ、ボーナス背景の表示、引き戻し終了のステージ、DREAM後のG数と種別、保証ストックの二重計上の修正、和也の部屋のアイキャッチ（シオン検収の修正を反映）
// 既存の3機種の定義形式に合わせる。順序4〜6で器に足す仕組みは engine-v01 の §番号を注記
// ============================================================
kanokari:{
  name:"彼女、お借りします",
  defVer:"0.20",   // 画面のヘッダに出す定義の版。docs/specs/kanokari-def-v20.js の1行目と必ず合わせる
  lcdG:true,
  lcdRestart:0,
  clearStageOnHit:true,

  // ---------- 打ち始め ----------
  setup:[
    {key:"stage0",label:"前回の当選",type:"select",options:["朝イチ","かのかりBONUS後","REG後"],optional:true},   // 分からなければ入力しない
    {key:"c3",label:"前回の攻略人数",type:"num",optional:true},
    {key:"gauge",label:"ハートメーター（0〜5、MAXは6）",type:"num",optional:true}
  ],

  // ---------- カウンター・ストック・メーター ----------
  counter3:{label:"攻略人数",reset:"never",incOnTriggers:["攻略成功","1G恋成功"]},   // §3
  rareCounts:false,   // レア役の合計は数えない（枠を出さない）。ログの「（n回目）」も出さない
  hitStartClear:{tags:["変換高確","変換超高確","MAX待機"],gauge:0},   // 当選（CZ・BONUS）に入ったら消す：ボーナス中に高確もメーターも無い
  hitLabel:"CZ・当選",   // 通常時の当選ボタンの名前
  rareCountInHit:true,   // 当選中のレア役は当選ごとに0から数え、ログに「（ボーナス中2回目）」
  rareSheetOnePage:true,   // レア役シートは1画面：種類を選ぶ→同じ画面でメーター（ask）を選ぶ→即記録。当選中は ask を出さない
  stocks:[{key:"ren",label:"レンCHANCE",short:"レン"},{key:"koi",label:"1G恋",short:"1G恋"}],   // §1
  // 終了シートの注記。保証が入った回は stockGainNoteOnStart（hits 側に置く）が優先される
  stockGainNote:"このボーナスで増えたストック数を入れてください。前から持っている分は右の合計に入っています",
  gauge:{label:"❤",max:5,maxLabel:"MAX",hideInHit:true},   // §4。当選中はバッジを出さない
  // 1GレンCHANCE の失敗連続回数（バッジ「レン失敗 n」）。救済抽選（2〜5回で振り分け）の判定に使う
  // 失敗で+1、成功で0。引き戻し当選と次回初当りで0（持ち越さない）
  stockGPerSet:2,stockSuccessOffset:1,   // 1セット2G。全部失敗→実G＝消費数×2、成功→当選G＝消費数×2＋1（告知の1G）。液晶は0
  stockResultMode:"perSet",   // セットごとに入力：1G目の役 → 2G目の役 → 必要なときだけ成否。1G恋も1G目・2G目の役を聞き、自動成功。失敗なら次のセット、尽きたら引き戻しへ
  stockFail:{label:"レン失敗",resetOnTriggers:["引き戻し成功","レンカノ成功","妄想DT成功","ガチ恋目","最強目","ロングフリーズ","天井","規定G数前兆"]},
  // 全部失敗＝実機で終了画面が出るタイミング。失敗の記録のあとに extras の同名シートを自動で開く（§9-61）
  stockAllFail:{askExtra:"終了画面の枠"},
  // 1GレンCHANCE の各セットで成立役を聞き、定義のルールで成否を決める
  stockResultGroups:[   // perSet：各セットで順に聞く
    {key:"g1",label:"1G目の役",options:["ハズレ","ハズレ（CU）","リプ・ベル","弱チャンス目","チャンス目","強チャンス目","不明"]},
    {key:"g2",label:"2G目の役",options:["ハズレ","ハズレ（CU）","リプ・ベル","弱チャンス目","チャンス目","強チャンス目","不明"]},
    {key:"r2",label:"2G目の結果",showWhen:{key:"g2",in:["ハズレ","ハズレ（CU）","不明"]},options:["成功","失敗"]}
  ],

  // セットの成否は表示ラベルから推測せず、このルールで決める
  stockResultRule:{
    resultKey:"r2",
    autoSuccess:{key:"g2",values:["リプ・ベル","弱チャンス目","チャンス目","強チャンス目"]},
    koi:{autoSuccess:true,groups:["g1","g2"]}
  },
  // 1GレンCHANCE 開始時に1回だけ聞く（当選シートの chara を自動で埋める）
  stockPhaseAsk:{key:"renChara",title:"レンCHANCE開始キャラ",label:"レンCHANCE開始キャラ",hintTag:"設定示唆",
    askWhenC3Mod:{mod:4,eq:0},   // 次が1・5・9人目のときだけ聞く
    options:["麻美","瑠夏","墨","千鶴","不明"]},

  // ---------- レア役 ----------
  rares:[
    {key:"weak",label:"弱チャンス目",inSheet:false,ask:{key:"gauge",label:"メーターは何個になったか",options:[{l:"1",set:{gauge:1}},{l:"2",set:{gauge:2}},{l:"3",set:{gauge:3}},{l:"4",set:{gauge:4}},{l:"5",set:{gauge:5}},{l:"MAX",set:{gauge:"max",tag:"変換高確",until:"manual",waitIfZen:"MAX待機"}},{l:"変わらず"}]}},
    {key:"chance",label:"チャンス目",ask:{key:"gauge",label:"メーターは何個になったか",options:[{l:"1",set:{gauge:1}},{l:"2",set:{gauge:2}},{l:"3",set:{gauge:3}},{l:"4",set:{gauge:4}},{l:"5",set:{gauge:5}},{l:"MAX",set:{gauge:"max",tag:"変換高確",until:"manual",waitIfZen:"MAX待機"}},{l:"変わらず"}]}},
    {key:"strong",label:"強チャンス目",hint:"前兆へ",set:{enterZen:0}},
    {key:"gachi",label:"ガチ恋目",inSheet:false},   // 変換でしか出ない（小役変換・示唆の変換先で記録）
    {key:"saikyo",label:"最強目",inSheet:false},
    {key:"unknown",label:"不明",count:false}
  ],
  lcdAdd:null,
  hitTriggers:["レンカノ成功","妄想DT成功","強チャンス目","ガチ恋目","最強目","ロングフリーズ","天井","規定G数前兆","引き戻し成功"],
  labelsForTriggers:{   // 契機ごとに選べる種別（ラベル指定）。無ければ全部
    "攻略成功":["かのかりBONUS","エピソードBONUS","スペシャルエピソードBONUS","ななかりDREAM"],
    "1G恋成功":["かのかりBONUS","エピソードBONUS","スペシャルエピソードBONUS","ななかりDREAM"],
    "レンカノ成功":["かのかりBONUS","REG","ななかりDREAM"],
    "妄想DT成功":["かのかりBONUS","REG","ななかりDREAM"]
  },

  // ---------- 当選時の追加質問 ----------
  hitExtraGroups:[   // 攻略キャラは契機が攻略成功／1G恋成功のときだけ
    {key:"chara",fromStockAsk:"renChara",label:"攻略キャラ（1・5・9人目だけ聞く。残りはシナリオから自動）",hintTag:"設定示唆",showWhen:{key:"trig",in:["攻略成功","1G恋成功"]},askWhenC3Mod:{mod:4,eq:0},options:["麻美","瑠夏","墨","千鶴","不明"],
     scenario:{"麻美":["麻美","瑠夏","墨","千鶴"],"瑠夏":["瑠夏","墨","千鶴","麻美"],"墨":["墨","千鶴","麻美","瑠夏"],"千鶴":["千鶴","麻美","瑠夏","墨"]}},
    {key:"dreamG",label:"初期G数",type:"num",showWhen:{key:"type",in:["ななかりDREAM"]}}
  ],

  // ---------- 当選 ----------
  hits:[
    // CZ
    {label:"レンカノCHALLENGE",kind:"cz",keepG:true,
      atExtras:[
        {label:"到達色",once:true,short:"色",groups:[{key:"color",label:"最高到達色",required:true,options:[{l:"白"},{l:"青"},{l:"黄"},{l:"緑"},{l:"赤"},{l:"虹",h:"成功確定"}]}]},
        {label:"延長",type:"count",short:"延長"}
      ],
      tone:"c",
      grid:[["atx:0","atx:1","memo"],["hitEnd"]],
      czEnd:{groups:[{key:"lastRole",label:"最終ゲームの成立役",options:["小役","チャンス目系","ハズレ","不明"],hideIfExtra:{label:"到達色",value:"虹"}},
                     {key:"color2",label:"到達色（未入力なら）",options:["白","青","黄","緑","赤","虹"],showIfExtraMissing:"到達色"},
                     {key:"stage",label:"戻ったステージ",failOnly:true,options:["部屋と彼女","大学と彼女","街と彼女","ヒロインステージ"]}],successToAt:true,successAsk:true}},
    {label:"妄想DTチャレンジ",kind:"cz",keepG:true,
      atExtras:[
        {label:"ヒロイン",once:true,groups:[{key:"heroine",label:"ヒロイン",required:true,options:["麻美","瑠夏","墨","千鶴"]}]},
        {label:"PUSH発生",type:"toggle",tag:"PUSH"}
      ],
      tone:"c",
      grid:[["atx:0","atx:1","memo"],["hitEnd"]],
      czEnd:{groups:[{key:"push",label:"PUSH",options:["成功","失敗","なし"]},{key:"stage",label:"戻ったステージ",failOnly:true,options:["部屋と彼女","大学と彼女","街と彼女","ヒロインステージ"]}],successToAt:true,successAsk:true}},

    // ボーナス
    {label:"かのかりBONUS",kind:"at",stockGain:true,tone:"d",askGOnEnd:false,
      onStart:{stockInc:{ren:1},onlyTriggers:["レンカノ成功","妄想DT成功","ガチ恋目","最強目","ロングフリーズ","天井","規定G数前兆"]},   // 初当りの保証1個（引き戻し・連チャン・DREAM後は無し）
      stockGainNoteOnStart:"初当りの保証レン1個は開始時に入れてあります。ここには保証を除いて増えた分だけを入れてください（終了時の表示が3個なら 2）。合計は右に出ます",
      atStart:null,
      atExtras:[
        {label:"背景",once:true,short:"背景",valueOnly:true,groups:[{key:"bg",label:"チャンス告知の背景（水族館＜クリスマス＜ゼロ距離）",hintTag:"モード示唆",required:true,options:[{l:"水族館",h:"低"},{l:"クリスマスデート",h:"中"},{l:"ゼロ距離",h:"高モード期待"}]}]},
        {label:"下パネル消灯",type:"toggle",tag:"裏かのかり"},
        {label:"2択当て",title:"2択当て",groups:[{key:"r",label:"結果",required:true,options:["○","×"]}]}
      ],
      phases:{ending:{label:"ENDING",grid:[["phx:0","memo"],["hitEnd"]],onEnter:{yuuri:true,
          askSheet:{title:"ENDING 突入",fields:[
            {key:"last",label:"LAST枚数",logAs:"LAST"},
            {key:"credit",label:"突入時のクレジット数（持ちメダル）",medal:true}
          ],estimate:{label:"有利区間切れ見込み",unit:"クレジット",sum:["credit","last"]}}},afterAt:{hit:"DREAM TIME",trig:"ENDING後"},noRevive:true,
        extras:[{label:"ボイス",title:"ENDING ボイス（レア役でPUSH）",groups:[
          {key:"role",label:"レア役",required:true,options:["弱チャンス目","チャンス目","強チャンス目","不明"]},
          {key:"voice",label:"ボイス（公式11種）",hintTag:"設定示唆",required:true,options:[
            {l:"麻美：アガる〜↑"},{l:"麻美：あれ〜？嫉妬させちゃった？",tone:"p"},{l:"麻美：もう恋なんてしないって決めてるんだから！",tone:"d"},
            {l:"瑠夏：彼女入りまーす"},{l:"瑠夏：私が一番…好きだもん…っ",tone:"p"},{l:"瑠夏：なんだか少し、お酒の味…",tone:"d"},
            {l:"墨：ふん、ふん、！！"},{l:"墨：私…っいるか…っ",tone:"p"},{l:"墨：今日は私がお饗しする番…",tone:"d"},
            {l:"水原：今は\"恋人\"。遠慮しない"},{l:"水原：私……どんなカオ…してたかな……",tone:"d"},
            {l:"不明"}]}
        ]}]}},   // §11 ＋ D4
      atEnd:{groups:[
        {key:"medal",label:"獲得枚数表示",options:["なし","246","456","666","394"]},
        {key:"screen",label:"終了画面の枠",hintTag:"設定示唆",options:[["なし","デフォルト"],["白枠BBQ","設定示唆"],["白枠浜辺","設定示唆"],["赤","設定示唆"],["紫","設定示唆"],["銀","高設定示唆"],["金","高設定示唆"]]}
      ]},
      grid:[["rare:weak","rare:chance","rare:strong"],["atx:0","atx:1","atx:2"],["phase:ending","memo","hitEnd"]],
      revive:null},
    {label:"REG",kind:"at",tone:"d",askGOnEnd:false,
      atExtras:[
        {type:"slotsSeq",label:"次のキャラ",logAs:"キャラ紹介",hintTag:"設定示唆",n:5,default:["和也","麻美・白","瑠夏・白","墨・白","千鶴・白"],   // 押すと「n人目」の選択肢。デフォルトどおりなら1タップ
         options:[{l:"和也"},{l:"肺魚"},{l:"麻美・白"},{l:"麻美・ピンク",tone:"p"},{l:"麻美・赤",tone:"d"},{l:"瑠夏・白"},{l:"瑠夏・ピンク",tone:"p"},{l:"瑠夏・赤",tone:"d"},{l:"墨・白"},{l:"墨・ピンク",tone:"p"},{l:"墨・赤",tone:"d"},{l:"千鶴・白"},{l:"千鶴・ピンク",tone:"p"},{l:"千鶴・赤",tone:"d"},{l:"その他"}],
         optionRows:[["和也","肺魚"],["麻美・白","麻美・ピンク","麻美・赤"],["瑠夏・白","瑠夏・ピンク","瑠夏・赤"],["墨・白","墨・ピンク","墨・赤"],["千鶴・白","千鶴・ピンク","千鶴・赤"],["その他"]]},   // 系列ごとに行を分ける。値と順番は options のまま
        {type:"stockInc",label:"1G恋獲得",key:"koi"}
      ],
      atEnd:{groups:[]},   // REG の終了画面は統一。枠は聞かない
      grid:[["rare:weak","rare:chance","rare:strong"],["atx:0","atx:1","memo"],["hitEnd"]],
      revive:null},
    {label:"エピソードBONUS",kind:"at",stockGain:true,tone:"p",askGOnEnd:false,
      stockGainNote:"当選時の保証1個も含めて、このボーナスで増えたストック数を入れてください",
      atExtras:[
        {label:"上部の色",once:true,short:"色",groups:[{key:"color",label:"上部の色",hintTag:"設定示唆",required:true,options:["白","青","黄","緑","赤","虹"]}]},
        {label:"開始時から虹",type:"toggle",tag:"開始時虹"}
      ],
      atEnd:{groups:[
        {key:"roulette",label:"ルーレットの色",hintTag:"設定示唆",options:["白","青","黄","緑","赤","虹"]},
        {key:"screen",label:"終了画面の枠",hintTag:"設定示唆",options:[["なし","デフォルト"],["白枠BBQ","設定示唆"],["白枠浜辺","設定示唆"],["赤","設定示唆"],["紫","設定示唆"],["銀","高設定示唆"],["金","高設定示唆"]]}
      ]},
      grid:[["rare:weak","rare:chance","rare:strong"],["atx:0","atx:1","memo"],["hitEnd"]],
      revive:null},
    {label:"スペシャルエピソードBONUS",kind:"at",stockGain:true,tone:"p",askGOnEnd:false,
      onStart:{tag:"ユメカノ",until:"manual"},   // 突入＝ユメカノ獲得確定
      stockGainNote:"当選時の保証1個も含めて、このボーナスで増えたストック数を入れてください",
      atExtras:[
        {label:"上部の色",once:true,short:"色",groups:[{key:"color",label:"上部の色",hintTag:"設定示唆",required:true,options:["白","青","黄","緑","赤","虹"]}]},
        {label:"開始時から虹",type:"toggle",tag:"開始時虹"}
      ],
      atEnd:{groups:[
        {key:"roulette",label:"ルーレットの色",hintTag:"設定示唆",options:["白","青","黄","緑","赤","虹"]},
        {key:"screen",label:"終了画面の枠",hintTag:"設定示唆",options:[["なし","デフォルト"],["白枠BBQ","設定示唆"],["白枠浜辺","設定示唆"],["赤","設定示唆"],["紫","設定示唆"],["銀","高設定示唆"],["金","高設定示唆"]]}
      ]},
      grid:[["rare:weak","rare:chance","rare:strong"],["atx:0","atx:1","memo"],["hitEnd"]],
      revive:null},
    {label:"ななかりDREAM",kind:"at",stockGain:true,tone:"g",
      atExtras:[{label:"S級（ブラックアウト）",type:"toggle",tag:"S級DREAM"}],
      atEnd:{groups:[{key:"plus100",label:"終了時の＋100G",options:["なし","あり"]}]},
      afterAt:{hit:"かのかりBONUS",trig:"DREAM後",realG:1},
      afterAtOptions:[
        {label:"エピソードBONUSへ（DREAM後）",hit:"エピソードBONUS",trig:"DREAM後",realG:1},
        {label:"スペシャルエピソードBONUSへ（DREAM後）",hit:"スペシャルエピソードBONUS",trig:"DREAM後",realG:1}
      ],
      askGOnEnd:false,
      grid:[["rare:weak","rare:chance","rare:strong"],["atx:0","memo","hitEnd"]],
      revive:null},
    {label:"DREAM TIME",kind:"at",stockGain:true,tone:"g",askGOnEnd:false,
      // 保証の1G恋は先入れしない。終了時の表示に保証分が含まれており、先入れすると二重に数えるため
      //（10/2 09:50 で最後の1GレンCHANCEが2セット＝実4G と記録され、実際は1セット＝実2G だった）
      stockGainNote:"DREAM TIME は保証分を先に入れていません。終了時に表示されているストック数（1G恋の保証1個を含む）をそのまま入れてください。合計は右に出ます",
      atExtras:[{label:"S級（ブラックアウト）",type:"toggle",tag:"S級DREAMTIME"}],
      grid:[["rare:weak","rare:chance","rare:strong"],["atx:0","memo","hitEnd"]],
      revive:null}
  ],

  // ---------- 通常時の extras ----------
  extras:[
    {type:"select",label:"小役変換・示唆",title:"小役変換・示唆（変換高確中）",anyOne:true,groups:[   // どれか1つでも選べば記録して閉じる
      {key:"from",label:"変換元",options:["弱チャンス目","チャンス目","強チャンス目"]},
      {key:"to",label:"変換先（変換したら前兆へ）",options:[{l:"強チャンス目",set:{clearTags:["変換高確","変換超高確","MAX待機"],gauge:0,enterZen:0}},{l:"ガチ恋目",set:{clearTags:["変換高確","変換超高確","MAX待機"],gauge:0,enterZen:0}},{l:"最強目",set:{clearTags:["変換高確","変換超高確","MAX待機"],gauge:0,enterZen:0}},{l:"変換なし（高確終了）",set:{clearTags:["変換高確","変換超高確","MAX待機"]}}]},
      {key:"gauge2",label:"高確終了後のメーター",showWhen:{key:"to",in:["変換なし（高確終了）"]},options:[{l:"0",set:{gauge:0}},{l:"1",set:{gauge:1}},{l:"2",set:{gauge:2}},{l:"3",set:{gauge:3}},{l:"4",set:{gauge:4}},{l:"5",set:{gauge:5}}]},
      {key:"next",label:"次回超高確!?",showWhen:{key:"to",in:["変換なし（高確終了）"]},options:[{l:"あり",set:{tag:"次回超高確",until:"manual"}},{l:"なし"}]},
      {key:"kk",label:"高確の状態",options:[{l:"超高確だった"}]}
    ]},
    {type:"select",label:"アイキャッチ",byState:{   // §7
      normal:{title:"アイキャッチ（通常時）",groups:[{key:"eye",label:"種類",required:true,options:["白","青・4人","ピンク・2人","劇画調・和也背景"]}]},
      zen:{title:"アイキャッチ（ゲーム数前兆）",groups:[{key:"eye",label:"種類",required:true,options:["千鶴","麻美＋瑠夏","墨＋千鶴","祖母＋祖父＋千鶴"]}]}
    }},
    {type:"select",label:"セリフ",title:"セリフ演出",groups:[
      {key:"who",label:"キャラ",required:true,options:["千鶴","和也","和","小百合","黒セリフ","その他"]},
      {key:"cm",label:"センチメートル",options:["44cm","55cm","66cm"]}
    ]},
    {type:"toggle",label:"ユメカノ",tag:"ユメカノ",until:"manual",log:"ユメカノモード ON",menu:true},
    // 1GレンCHANCE が全部失敗したあとに出る終了画面。選択肢は かのかりBONUS の atEnd.screen と同じものを使う（変えるときは両方直す）
    {type:"select",label:"終了画面の枠",title:"終了画面（1GレンCHANCE 全部失敗）",groups:[
      {key:"screen",label:"終了画面の枠",hintTag:"設定示唆",required:true,options:[["なし","デフォルト"],["白枠BBQ","設定示唆"],["白枠浜辺","設定示唆"],["赤","設定示唆"],["紫","設定示唆"],["銀","高設定示唆"],["金","高設定示唆"]]}
    ]}
  ],

  // ---------- ステージ ----------
  badgeOrder:["stage","gauge","stocks","tags"],   // バッジの並び：通常時 → ステージ → ❤ → ストック → その他
  stages:{
    order:["部屋と彼女","大学と彼女","街と彼女"],   // バッジをタップすると次のステージへ（順番のもの以外はシートを開く）
    preselectNext:true,   // 今のステージが order にあるとき、次のステージを初期選択にする（選び直せる）
    options:[{l:"部屋と彼女",h:"通常",askAfter:"アイキャッチ"},{l:"大学と彼女",h:"通常",askAfter:"アイキャッチ"},{l:"街と彼女",h:"通常",askAfter:"アイキャッチ"},
             {l:"海と彼女",h:"前兆",tone:"p",enterZen:1,askAfter:"アイキャッチ"},{l:"和也の部屋",h:"前兆（デート予約）",tone:"p",enterZen:1},{l:"夜と彼女",h:"前兆",tone:"p",enterZen:1,askAfter:"アイキャッチ"},{l:"ヒミツ恋ゴコロ",h:"前兆",tone:"d",enterZen:1,askAfter:"アイキャッチ"},
             {l:"ヒロインステージ",h:"ポイント高確20G",tone:"c",askAfter:"アイキャッチ"}]},

  // ---------- 前兆・引き戻し ----------
  zenchou:{stages:["前兆","前兆ステージ","連続演出","引き戻し中"],stageIndex:[1,2,3],cutStages:[0],
    // 引き戻し中は enterOnHitEnd で入る。前兆3段は手動
    enterOnHitEnd:{unlessStocks:true,stage:3},endLabel:"引き戻し終了",remindAtG:66,   // §8 §9
    outGroups:[   // 連続演出の失敗時（forStages:[2]）。実機の順：失敗→アイキャッチ→ステージ
      {key:"cu",label:"CU",options:["あり","なし"]},
      {key:"eye",label:"アイキャッチ",options:["白","青・4人","ピンク・2人","劇画調・和也背景","なし"]},
      {key:"stage",label:"戻ったステージ",options:["部屋と彼女","大学と彼女","街と彼女"]}
    ],forStages:[2],
    backTo:{2:1},   // 連続演出の終了時に「前兆ステージへ戻る」を出す（失敗しても前兆ステージが続くことがある）
    onEndByStage:{3:{clearTags:["ユメカノ"],c3:0,keepStage:true}},   // 引き戻し終了：ユメカノOFF、攻略人数0
    sheet:{label:"引き戻し記録",forStage:3,logOnSave:false,autoFill:{stage0:{ifTag:"ユメカノ",value:"専用（ユメカノ後）"}},sections:[   // 3段。保存時はログなし（終了時に当否付きで流す）
      {title:"① レンCHANCE抜け直後",groups:[
        {key:"eye",label:"アイキャッチ",options:["白","ピンク（赤）","黒"]},
        {key:"stage0",label:"開始ステージ",options:["部屋と彼女","大学と彼女","街と彼女","専用（ユメカノ後）"]},
        {key:"aori",label:"ボタン煽り",options:["なし","1回だけ","複数回"]}]},
      {title:"② 33G前後",groups:[
        {key:"ren33",label:"演出",options:["なし","恋心","カレー","笑顔","秘密","その他"]},
        {key:"cu33",label:"CU",options:["あり","なし"]},
        {key:"eye33",label:"33Gのアイキャッチ（引き戻し期待度）",options:["白","ピンク（赤）","黒","なし"]},
        {key:"stage33",label:"戻ったステージ",options:["部屋と彼女","大学と彼女","街と彼女"]}]},
      {title:"③ 66G前後",groups:[
        {key:"ren66",label:"演出",options:["なし","恋心","カレー","笑顔","秘密","その他"]},
        {key:"cu66",label:"CU",options:["あり","なし"]},
        {key:"eye66",label:"66Gのアイキャッチ（次回BIG示唆）",options:["白","青・4人","ピンク・2人","劇画調・和也背景","なし"]},
        {key:"stage66",label:"戻ったステージ",options:["部屋と彼女","大学と彼女","街と彼女"]}]}
    ]}},

  // ---------- 有利区間 ----------
  yuuri:{askOnEnd:[],clear:["c3","stocks","gauge","tags","modeHints","renChara"],levels:["有利切れ","有利切れ濃厚"],askMedal:true},   // §10 ＋ D5：切れ時に持ちメダルを聞き、差枚をログに

  parallel:[],
  czEndStd:{groups:[]},

  // ---------- 参照タブ（E1・E2） ----------
  refs:[
    {title:"REG キャラ紹介シナリオ（8パターン判明／全15）",rows:[
      ["①","和也→麻美→瑠夏→墨→千鶴","デフォルト"],["②","和也→麻美→瑠夏→墨→千鶴・ピンク","高設定期待度UP弱"],
      ["③","和也→麻美→瑠夏→墨・ピンク→千鶴・ピンク","高設定期待度UP弱"],["④","和也→麻美→瑠夏・ピンク→墨・ピンク→千鶴・ピンク","高設定期待度UP弱"],
      ["⑤","和也→麻美・ピンク→瑠夏・ピンク→墨・ピンク→千鶴・ピンク","高設定期待度UP"],["⑥","和也→麻美→瑠夏→墨→肺魚","高設定期待度UP弱"],
      ["⑦","麻美→瑠夏→墨→千鶴→肺魚","高設定期待度UP"],["⑧","麻美・赤→瑠夏・赤→墨・赤→千鶴・赤→肺魚","高設定濃厚"]]},
    {title:"攻略キャラ シナリオ（4種）",rows:[
      ["①","麻美→瑠夏→墨→千鶴","偶数設定期待度UP"],["②","瑠夏→墨→千鶴→麻美","奇数設定期待度UP"],
      ["③","墨→千鶴→麻美→瑠夏","偶数設定期待度UP"],["④","千鶴→麻美→瑠夏→墨","奇数設定期待度UP"],
      ["—","同じシナリオが連続","設定5以上濃厚"],["—","4人攻略後の5人目〜／引き戻し当選","示唆なし（初回扱い）"]]},
    {title:"ENDING ボイス（公式11種）",rows:[
      ["通常","アガる〜↑／彼女入りまーす／ふん、ふん、！！／今は\"恋人\"。遠慮しない","—"],
      ["太字1","嫉妬させちゃった？／私が一番…好きだもん…っ／私…っいるか…っ","何か秘密が"],
      ["太字2","もう恋なんてしない／お酒の味…／お饗しする番…／どんなカオ…してたかな","水原の照れセリフに注目"]]}
  ],
  // ---------- まとめ（E3）：summarizeHints に足す機種固有の項目 ----------
  summary:{
    items:[
      {label:"終了画面の枠",hintTag:"設定示唆",from:"atEnd.screen"},
      {label:"REG キャラ紹介（シナリオ判定）",hintTag:"設定示唆",from:"slots",judge:"regScenario"},
      {label:"攻略キャラの並び（シナリオ判定・引き戻しで区切る）",hintTag:"設定示唆",from:"chara",judge:"charaScenario"},
      {label:"チャンス告知の背景",hintTag:"モード示唆",from:"extra:背景"},
      {label:"EP 上部の色／ルーレット",hintTag:"設定示唆",from:"extra:上部の色,atEnd.roulette"},
      {label:"初当り（G数と種別）",from:"firstHits"},
      {label:"攻略人数の最大",from:"c3max"}
    ]
  },

  // ---------- グリッド ----------
  grids:{
    normal:[["rare","extra:0","hit"],["zenchou","stage","extra:1"],["rare:weak","extra:2","memo"]],   // レア役／小役変換・示唆／当選、前兆／ステージ／アイキャッチ、弱チャンス目／セリフ／メモ
    zen:[["rare:weak","zenchou","hit"],["rare","extra:1","memo"]],          // 前兆中（引き戻し以外）。ステージはバッジタップで
    hikimodoshi:[["zenSheet","zenchou","hit"],["rare:weak","rare","memo"],["extra:2"]],   // 引き戻し中（zenchou＝引き戻し終了）。3行目はセリフ（G数付きで残すため）
    stock:[["stockResult","memo"]],
    cz:[["hitEnd","memo"]],
    at:[["hitEnd","memo"]]
  }
}
