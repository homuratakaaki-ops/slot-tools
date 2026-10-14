// 「確定演出→濃厚」の移行監査は完了した。
// ここでは利用者向け文言の継続ルールと、許容する「が確定」の5件を守る。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const files=execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'ls-files','-z','checker-data','*-checker.html','*-guide.html'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const allowed=[
  ['aobuta-guide.html','当選が確定する成立役は判別材料にならないため'],
  ['checker-data/aobuta.js','当選が確定する小役は判別材料にならないため'],
  ['juggler-guide.html','設定6であることが確定したという意味ではありません'],
  ['tokyo-ghoul-guide.html','1キャラごとに示唆が確定しています'],
  ['tokyo-ghoul-guide.html','示唆内容が確定していないパターンは収録していません']
];
const counts=allowed.map(()=>0);
const violations=[];
let six=0,setting=0,occurrences=0;
for(const file of files){
  const source=fs.readFileSync(new URL(file,new URL('../',import.meta.url)),'utf8');
  six+=(source.match(/6確定/g)||[]).length;
  setting+=(source.match(/設定[0-9０-９・]*(?:以上)?確定演出/g)||[]).length;
  for(const [index,line] of source.split('\n').entries()){
    if(line.trim().startsWith('//'))continue;
    for(const match of line.matchAll(/が確定(?!演出)/g)){
      occurrences++;
      const entries=allowed.flatMap(([name,phrase],i)=>name===file&&line.includes(phrase)?[i]:[]);
      if(entries.length!==1)violations.push(`${file}:${index+1}:${match.index+1} ${line.trim()}`);
      else counts[entries[0]]++;
    }
  }
}
assert.equal(six,0,'「6確定」の総数');
assert.equal(setting,0,'「設定N(以上)確定演出」の総数');
assert.deepEqual(violations,[],'許容リスト外の「が確定」');
for(const [i,[file,phrase]] of allowed.entries())assert.equal(counts[i],1,`${file}: ${phrase} は1回のみ`);
// 2件とも出典に設定差なしの明記があるA。行頭が // のコードコメントは検査対象外。
const allowedNoDiff=[
  ['checker-data/magireco.js','調整屋選択時のAT当選率に設定差はありません'],
  ['checker-data/ricorico.js','150G以外での変換高確移行には設定差がないため']
];
const noDiffCounts=allowedNoDiff.map(()=>0),noDiffViolations=[];
let noDiffOccurrences=0;
for(const file of files){
  const source=fs.readFileSync(new URL(file,new URL('../',import.meta.url)),'utf8');
  for(const [index,line] of source.split('\n').entries()){
    if(line.trim().startsWith('//'))continue;
    for(const match of line.matchAll(/設定差(?:は|が)?(?:ありません|ない|なし|無い|無し)/g)){
      noDiffOccurrences++;
      const entries=allowedNoDiff.flatMap(([name,phrase],i)=>{
        const start=line.indexOf(phrase);
        return name===file&&start>=0&&match.index>=start&&match.index+match[0].length<=start+phrase.length?[i]:[];
      });
      if(entries.length!==1)noDiffViolations.push(`${file}:${index+1}:${match.index+1} ${line.trim()}`);
      else noDiffCounts[entries[0]]++;
    }
  }
}
assert.deepEqual(noDiffViolations,[],'許容リスト外の設定差なし断定');
for(const [i,[file,phrase]] of allowedNoDiff.entries())assert.equal(noDiffCounts[i],1,`${file}: ${phrase} は1回のみ`);
console.log(`PASS wording: ${files.length} files, 6確定 ${six}, 設定N(以上)確定演出 ${setting}, が確定 ${occurrences}, 許容 ${allowed.length}件を各1回, 設定差なし断定 ${noDiffOccurrences}, 許容 ${allowedNoDiff.length}件を各1回`);
