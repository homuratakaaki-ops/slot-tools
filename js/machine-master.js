/**
 * machine-master.js — 機種マスター（正式名・略称・機種ID）
 *
 * 正本：docs/specs/rec-common-3-spec-v01.md（tools/rec 共通改修 段3）
 * 正式名：ちょんぼりすた「スロット機種別一覧」「パチンコ機種別一覧」の表記（2026-11-27 夢爽決定）
 *   例外：p0004 は夢爽の指定で解析ページの表記「Pスーパー海物語IN沖縄6」（一覧では「P海物語IN沖縄6」）
 * mid：一度付けたら変えない・使い回さない。新しい機種は末尾に追記する（番号は種別ごとの連番）
 * aliases：検索と、過去の記録の表記ゆれをまとめるのに使う。完全一致（norm 後）だけでまとめる
 *
 * 使う側：tools/rec/index.html・tools/nisshi/index.html（classic script、window.MachineMaster）
 * このファイルが読めなくても、使う側は今までどおり手入力で動くこと
 */
(function(){
  'use strict';
  const S='slot',P='pachinko';
  const LIST=[
    // ---- 記録のある機種（夢爽の稼働日誌 2026-11-27 から） ----
    {mid:'s0001',kind:S,name:'L東京喰種',aliases:['東京喰種','スマスロ東京喰種','スマスロ 東京喰種'],recDef:'tokyoghoul'},
    {mid:'s0002',kind:S,name:'ハイビリターン30',aliases:['ハイビリターン','ハイビリターン-30'],recDef:'hibireturn'},
    {mid:'s0003',kind:S,name:'彼女、お借りします',aliases:['彼女お借りします','かのかり','Lパチスロ 彼女、お借りします']},
    {mid:'s0004',kind:S,name:'からくりサーカス2',aliases:['からくりサーカス','Lからくりサーカス2'],recDef:'karakuri2'},
    {mid:'s0005',kind:S,name:'リコリス・リコイル',aliases:['リコリコ','スマスロ リコリス・リコイル']},
    {mid:'s0006',kind:S,name:'革命機ヴァルヴレイヴ2',aliases:['ヴァルヴレイヴ2','ヴヴヴ2','VVV2']},
    {mid:'s0007',kind:S,name:'革命機ヴァルヴレイヴ',aliases:['ヴァルヴレイヴ']},
    {mid:'s0008',kind:S,name:'獣王',aliases:['スマスロ 獣王']},
    {mid:'s0009',kind:S,name:'南国育ち SPECIAL',aliases:['南国育ちスペシャル','南国育ち','L南国育ち SPECIAL']},
    {mid:'s0010',kind:S,name:'沖ドキ！DUOアンコール',aliases:['沖ドキDUOアンコール','沖ドキアンコール']},
    {mid:'s0011',kind:S,name:'モンスターハンターライズ：サンブレイク',aliases:['モンスターハンターライズ　サンブレイク','モンスターハンターサンブレイク','モンスターハンターサンライズ','サンブレイク','スマスロ モンスターハンターライズ：サンブレイク']},
    {mid:'s0012',kind:S,name:'モンスターハンターライズ',aliases:['モンハンライズ']},
    {mid:'s0013',kind:S,name:'ミリオンゴッド-神々の軌跡-',aliases:['ミリオンゴッド','スマスロ ミリオンゴッド']},
    {mid:'s0014',kind:S,name:'Lダークハイビ',aliases:['ダークハイビ','スマート沖スロ ダークハイビ']},
    {mid:'s0015',kind:S,name:'ストリートファイター6',aliases:['ストリートファイター','ストーリーファイター6','スト6']},
    {mid:'s0016',kind:S,name:'痛いのは嫌なので防御力に極振りしたいと思います',aliases:['痛いのは嫌なので防御力に','防振り']},
    {mid:'s0017',kind:S,name:'Lカイジ',aliases:['カイジ','回胴黙示録カイジ 狂宴']},
    {mid:'s0018',kind:S,name:'ラブ嬢3',aliases:['ラブ嬢']},
    {mid:'s0019',kind:S,name:'Lダンベル何キロ持てる?',aliases:['ダンベル何キロ持てる？','ダンベル']},
    {mid:'s0020',kind:S,name:'ゴッドイーターリザレクション',aliases:['ゴッドイーター','スマスロ ゴッドイーター リザレクション']},
    {mid:'s0021',kind:S,name:'七つの魔剣が支配する',aliases:['7つの魔剣が支配する']},
    {mid:'s0022',kind:S,name:'北斗の拳',aliases:['スマスロ北斗の拳']},
    {mid:'s0023',kind:S,name:'北斗の拳 転生の章2',aliases:['北斗の拳転生2','北斗の拳転生']},
    {mid:'s0024',kind:S,name:'いざ！番長',aliases:['いざ番長']},
    {mid:'s0025',kind:S,name:'押忍！番長ZERO',aliases:['番長ゼロ','番長ZERO']},
    {mid:'s0026',kind:S,name:'Lマギアレコード',aliases:['マギアレコード','マギレコ','スマスロ マギアレコード']},
    {mid:'s0027',kind:S,name:'ラグナドール',aliases:['スマスロ ラグナドール']},
    {mid:'s0028',kind:S,name:'鉄拳6',aliases:['スマスロ鉄拳6']},
    {mid:'s0029',kind:S,name:'牙狼 闇を照らす者',aliases:['牙狼','L牙狼 闇を照らす者']},
    {mid:'s0030',kind:S,name:'攻殻機動隊',aliases:['L攻殻機動隊']},
    {mid:'s0031',kind:S,name:'バイオハザード5',aliases:[]},
    {mid:'s0032',kind:S,name:'ようこそ実力至上主義の教室へ',aliases:['よう実']},
    {mid:'s0033',kind:S,name:'バジリスク絆2 天膳',aliases:['バジリスク天膳']},
    {mid:'s0034',kind:S,name:'甲鉄城のカバネリ',aliases:['S甲鉄城のカバネリ']},
    {mid:'s0035',kind:S,name:'甲鉄城のカバネリ 海門決戦',aliases:['甲鉄城のカバネリ海門決戦','カバネリ 海門決戦','スマスロ カバネリ海門決戦']},
    {mid:'s0036',kind:S,name:'キングパルサー',aliases:[]},
    {mid:'s0037',kind:S,name:'転生したらスライムだった件',aliases:['転スラ']},
    {mid:'s0038',kind:S,name:'桃太郎電鉄',aliases:['桃鉄']},
    {mid:'s0039',kind:S,name:'スーパーブラックジャック',aliases:[]},
    {mid:'s0040',kind:S,name:'L戦国コレクション6',aliases:['戦国コレクション6']},
    {mid:'s0041',kind:S,name:'ViVY',aliases:["スロット Vivy -Fluorite Eye's Song-"]},
    {mid:'s0042',kind:S,name:'パリピ孔明',aliases:['スマスロパリピ孔明']},
    {mid:'s0043',kind:S,name:'チバリヨ2プラス',aliases:['チバリヨ2+']},
    {mid:'s0044',kind:S,name:'沖ドキGOLD',aliases:[]},
    {mid:'s0045',kind:S,name:'沖ドキ！BLACK',aliases:['沖ドキBLACK']},
    {mid:'s0046',kind:S,name:'真打吉宗',aliases:['L真打吉宗']},
    {mid:'s0047',kind:S,name:'Lとらぶるダークネス',aliases:['ToLOVEる','とらぶるダークネス']},
    {mid:'s0048',kind:S,name:'モンキーターンV',aliases:['モンキーターン','スマスロ モンキーターンV']},
    {mid:'s0049',kind:S,name:'Lガルパン最終章',aliases:['ガールズ&パンツァー']},
    {mid:'s0050',kind:S,name:'新鬼武者2',aliases:[]},
    {mid:'s0051',kind:S,name:'マイジャグラーV',aliases:['SマイジャグラーV']},
    {mid:'s0052',kind:S,name:'アイムジャグラーEX',aliases:['SアイムジャグラーEX']},
    {mid:'s0053',kind:S,name:'ネオアイムジャグラーEX',aliases:['SネオアイムジャグラーEX']},
    {mid:'s0054',kind:S,name:'ハッピージャグラーVⅢ',aliases:['SハッピージャグラーVⅢ']},
    {mid:'s0055',kind:S,name:'ゴーゴージャグラー3',aliases:['Sゴーゴージャグラー3']},
    {mid:'s0056',kind:S,name:'ジャグラーガールズSS',aliases:['SジャグラーガールズSS']},
    {mid:'s0057',kind:S,name:'ウルトラミラクルジャグラー',aliases:['Sウルトラミラクルジャグラー']},
    {mid:'s0058',kind:S,name:'ミスタージャグラー',aliases:[]},
    {mid:'s0059',kind:S,name:'ファンキージャグラー2',aliases:[]},
    // ---- 設定判別カウンターの機種（記録なし） ----
    {mid:'s0060',kind:S,name:'ゴジラvsエヴァンゲリオン2',aliases:['Lパチスロ ゴジラ対エヴァンゲリオン2','ゴジエヴァ2']},
    {mid:'s0061',kind:S,name:'L聖闘士星矢 黄金十二宮',aliases:['聖闘士星矢 黄金十二宮']},
    {mid:'s0062',kind:S,name:'ガンゲイルオンライン',aliases:['GGO','Lソードアート・オンライン オルタナティブ ガンゲイル・オンライン']},
    {mid:'s0063',kind:S,name:'魔法少女にあこがれて',aliases:['L 魔法少女にあこがれて','まほあこ']},
    {mid:'s0064',kind:S,name:'転生王女と天才令嬢の魔法革命',aliases:['L転生王女と天才令嬢の魔法革命']},
    {mid:'s0065',kind:S,name:'L青ブタ',aliases:['青ブタ','L青春ブタ野郎はバニーガール先輩の夢を見ない']},
    {mid:'s0066',kind:S,name:'見える子ちゃん',aliases:['L見える子ちゃん']},
    {mid:'s0067',kind:S,name:'LBタコスロ',aliases:['タコスロ','スマスロ タコスロ']},
    {mid:'s0068',kind:S,name:'モグモグ風林火山 大海戦の巻',aliases:['Lモグモグ風林火山 大海戦の巻']},
    {mid:'s0069',kind:S,name:'とんでもスキルで異世界放浪メシ',aliases:['Lとんでもスキルで異世界放浪メシ','とんスキ']},
    {mid:'s0070',kind:S,name:'邪神ちゃんドロップキック',aliases:['L邪神ちゃんドロップキック']},
    {mid:'s0071',kind:S,name:'とある魔術の禁書目録2',aliases:['Lとある魔術の禁書目録2']},
    {mid:'s0072',kind:S,name:'やじきた道中記参る！',aliases:['スマスロ やじきた道中記参る！']},
    {mid:'s0073',kind:S,name:'L戦国乙女5',aliases:['戦国乙女5']},
    {mid:'s0074',kind:S,name:'ソードアート・オンラインⅡ',aliases:['Lソードアート・オンラインII（SAO2）','SAO2']},
    {mid:'s0075',kind:S,name:'炎炎ノ消防隊2',aliases:['L炎炎ノ消防隊2']},
    {mid:'s0076',kind:S,name:'Lタクトオーパス',aliases:['Lタクトオーパス デスティニー']},
    {mid:'s0077',kind:S,name:'喰霊-零-Re',aliases:['Lパチスロ喰霊-零-Re']},
    // ---- パチンコ ----
    {mid:'p0001',kind:P,name:'P大海物語5スペシャル',aliases:['PA大海物語5 スペシャル']},
    {mid:'p0002',kind:P,name:'PA大海物語WithアグネスPE',aliases:['PA大海物語Withアグネス・ラムPE','PA大海物語Withアグネス・ラム Premium Edition','アグネスPE']},
    {mid:'p0003',kind:P,name:'eリコリス・リコイル',aliases:['リコリス・リコイル']},
    {mid:'p0004',kind:P,name:'Pスーパー海物語IN沖縄6',aliases:['スーパー海物語イン沖縄6','P海物語IN沖縄6']},
  ];

  // 比べるための形：全角半角・大文字小文字・カタカナひらがな・空白と記号の違いを無視し、頭の「スマスロ」「パチスロ」「L」「S」を外す
  function norm(s){
    let t=String(s==null?'':s).normalize('NFKC').toLowerCase();
    t=t.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
    t=t.replace(/[\s・、。,.!?ー\-−‐～~:()\[\]「」'"’&]/g,'');
    t=t.replace(/^(すますろ|ぱちすろ|すろっと)/,'');
    t=t.replace(/^[ls](?=[^a-z0-9])/,'');
    return t;
  }
  const KEYS=LIST.map(m=>({m,keys:[...new Set([m.name,...m.aliases].map(norm))]}));
  const BY_MID=new Map(LIST.map(m=>[m.mid,m]));

  // 名前（と種別・mid）から機種を1つに決める。決められなければ null（まとめない）
  function resolve(name,kind,mid){
    if(mid&&BY_MID.has(mid))return BY_MID.get(mid);
    const k=kind||S,n=norm(name);if(!n)return null;
    const hit=KEYS.filter(x=>x.m.kind===k&&x.keys.includes(n));
    return hit.length===1?hit[0].m:null;
  }
  // 検索の候補（前方一致を先に、次に部分一致）
  function search(q,kind,limit){
    const k=kind||S,n=norm(q);if(!n)return [];
    const out=[];
    for(const x of KEYS){if(x.m.kind!==k)continue;
      const r=x.keys.some(key=>key.startsWith(n))?0:x.keys.some(key=>key.includes(n))?1:-1;
      if(r>=0)out.push({r,m:x.m});}
    out.sort((a,b)=>a.r-b.r||a.m.name.length-b.m.name.length);
    return out.slice(0,limit||8).map(x=>x.m);
  }
  window.MachineMaster=Object.freeze({ver:'2026-11-27',list:Object.freeze(LIST),norm,resolve,search,byMid:mid=>BY_MID.get(mid)||null});
})();
