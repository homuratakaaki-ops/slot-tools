$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'sf6-record.html'
$schemaPath = Join-Path $root 'sf6-schema.js'
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
$schema = Get-Content -LiteralPath $schemaPath -Raw -Encoding UTF8

function Assert-Contains($Text, $Pattern, $Message) {
  if ($Text -notmatch $Pattern) {
    throw $Message
  }
}

function Assert-Fixed($Text, $Needle, $Message) {
  if (-not $Text.Contains($Needle)) {
    throw $Message
  }
}

function Assert-FileFixed($Path, $Needle, $Message) {
  $hit = Select-String -LiteralPath $Path -Pattern $Needle -SimpleMatch -Encoding UTF8
  if (-not $hit) {
    throw $Message
  }
}

function Assert-NotContains($Text, $Pattern, $Message) {
  if ($Text -match $Pattern) {
    throw $Message
  }
}

Assert-Contains $html '<link rel="canonical" href="https://slot-tools\.jp/sf6-record\.html">' 'canonical is missing'
Assert-Fixed $html "const STORAGE_KEY='sf6_record_v1'" 'storage key is missing'
Assert-Fixed $html "const MACHINE='L-SF6'" 'machine export id is missing'
Assert-Fixed $html "const VERSION='5'" 'version 5 is missing'
Assert-Fixed $html '<script src="sf6-schema.js"></script>' 'schema script tag is missing'
Assert-Contains $html "const GAIN_KINDS=\[[^\]]+\]" 'gain kind list is missing'
Assert-Contains $html "const VOICES=\[[^\]]+\]" 'voice list is missing'
Assert-Contains $html "const G_COLORS=\[[^\]]+\]" 'G color list is missing'
Assert-Contains $html "const STAGE_CHOICES=\[[^\]]+\]" 'stage choice list is missing'
Assert-Contains $html "const RARE_KINDS=\[[^\]]+\]" 'rare kind list is missing'
Assert-Contains $html "const HOT_VOICES=new Set\(\[[^\]]+\]\)" 'hot voice list is missing'
Assert-Contains $html "const BONUSES=\[[^\]]+\]" 'bonus list is missing'
Assert-Contains $html "const RANKS=\[[^\]]+\]" 'rank list is missing'
Assert-Contains $html "const ROUND_STARTS=\[[^\]]+\]" 'round start list is missing'
Assert-Contains $html "const OPPONENTS=\[[^\]]+\]" 'opponent list is missing'
Assert-Contains $html "const END_SCREENS=\[[^\]]+\]" 'end screen list is missing'
Assert-Contains $html "const CONTINUES=\[[^\]]+\]" 'continue list is missing'
Assert-Contains $html "const CASH_AMOUNTS=\[[^\]]+\]" 'cash amount list is missing'
Assert-Contains $html "const MONEY_OPS=\[[^\]]+\]" 'money op list is missing'
Assert-Contains $html "const DEFAULT_LOAN_RATE=50" 'default loan rate is missing'
Assert-Contains $html "const ICATCHES=\[[^\]]+\]" 'icatch list is missing'
if ((($html -match "const GAIN_KINDS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 5)) -eq $false) { throw 'gain kind count is incorrect' }
if ((($html -match "const VOICES=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 8)) -eq $false) { throw 'voice count is incorrect' }
if ((($html -match "const G_COLORS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 3)) -eq $false) { throw 'G color count is incorrect' }
if ((($html -match "const STAGE_CHOICES=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 4)) -eq $false) { throw 'stage count is incorrect' }
if ((($html -match "const RARE_KINDS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 4)) -eq $false) { throw 'rare kind count is incorrect' }
if ((($html -match "const BONUSES=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 2)) -eq $false) { throw 'bonus count is incorrect' }
if ((($html -match "const RANKS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 5)) -eq $false) { throw 'rank count is incorrect' }
if ((($html -match "const ROUND_STARTS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 4)) -eq $false) { throw 'round start count is incorrect' }
if ((($html -match "const OPPONENTS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 6)) -eq $false) { throw 'opponent count is incorrect' }
if ((($html -match "const END_SCREENS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 8)) -eq $false) { throw 'end screen count is incorrect' }
if ((($html -match "const CASH_AMOUNTS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 3)) -eq $false) { throw 'cash amount count is incorrect' }
if ((($html -match "const ICATCHES=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 8)) -eq $false) { throw 'icatch count is incorrect' }
Assert-Contains $html "fbThroughCount" 'FB through counter function is missing'
Assert-Contains $html "log\.kind===[^?]+\?null" 'judge voice null guard is missing'
Assert-Contains $html "win:false,bonus:null" 'FB loss bonus null guard is missing'
Assert-Contains $html "currentState" 'currentState persistence is missing'
Assert-Contains $html "battleState" 'battleState persistence is missing'
Assert-Contains $html "sessionMoney" 'session money persistence is missing'
Assert-Contains $html "state\.battleState='battle'" 'FB hit should enter battle state'
Assert-Contains $html "state\.battleState='normal'" 'FB loss or manual end should return normal state'
Assert-Contains $html "appSnapshot" 'snapshot based undo state is missing'
Assert-Contains $html "restoreSnapshot" 'snapshot restore is missing'
Assert-Contains $html "renderNormalGrid" 'normal fullscreen grid is missing'
Assert-Contains $html "renderBattleGrid" 'battle fullscreen grid is missing'
Assert-Contains $html "normalDcResultBtn" 'normal DC result category button is missing'
Assert-Contains $html "normalMemoBtn" 'normal memo category button is missing'
Assert-Contains $html "normalRareBtn" 'normal rare category button is missing'
Assert-Contains $html "normalGColorBtn" 'normal G color category button is missing'
Assert-Contains $html "normalStageBtn" 'normal stage category button is missing'
Assert-Contains $html "normalZenchouBtn" 'normal zenchou category button is missing'
Assert-Contains $html "openGainSheet" 'DC result sheet is missing'
Assert-Contains $html "openMemoSheet" 'memo sheet is missing'
Assert-Contains $html "openRareSheet" 'rare sheet is missing'
Assert-Contains $html "openGColorSheet" 'G color sheet is missing'
Assert-Contains $html "openStageSheet" 'stage sheet is missing'
Assert-Contains $html "openZenchouSheet" 'zenchou sheet is missing'
Assert-Contains $html "openSheet\('DC" 'DC result sheet title is missing'
Assert-Contains $html "openGColorSheet\(\)[\s\S]+openSheet" 'G color sheet title is missing'
Assert-Contains $html "openRareSheet\(\)[\s\S]+openSheet" 'rare sheet title is missing'
Assert-Contains $html "openStageSheet\(\)[\s\S]+openSheet" 'stage sheet title is missing'
Assert-Contains $html "openZenchouSheet\(\)[\s\S]+openSheet" 'zenchou sheet title is missing'
Assert-Contains $html "RANK_RATE_LABELS" 'rank rate label mapping is missing'
Assert-Contains $html "50%" 'rank 50 percent label is missing'
Assert-Contains $html "88%" 'rank 88 percent label is missing'
Assert-Contains $html "ROUND_START_LABELS" 'round start display label mapping is missing'
Assert-Contains $html "blue-default" 'round start blue description marker is missing'
Assert-Contains $html "green-upper" 'round start green description marker is missing'
Assert-Contains $html "closeAfter:true" 'single-select sheet auto close marker is missing'
Assert-Contains $html "if\(dir==='out'\)addLogDirect\(\{type:'gcolor'" 'zenchou out linked G color record is missing'
Assert-Contains $html "DEFAULT_RETURN_COLOR=G_COLORS\[2\]" 'default return color constant is missing'
Assert-Contains $html "color:DEFAULT_RETURN_COLOR" 'zenchou out default return color is missing'
Assert-Contains $html "chip\.green-text" 'green chip text class is missing'
Assert-Contains $html "\?'green-text':'hot'" 'round start green text mapping is missing'
Assert-Contains $html "isBattleLocked" 'battle G operation lock helper is missing'
Assert-Contains $html "BATTLE_STEP_LOCK_TOAST" 'battle step lock toast is missing'
Assert-Contains $html "BATTLE_ADJUST_LOCK_TOAST" 'battle adjust lock toast is missing'
Assert-Contains $html "document\.querySelectorAll\('\[data-step\]'\)[\s\S]+disabled=locked" 'battle step disabled rendering is missing'
Assert-Contains $html "document\.querySelectorAll\('\[data-adjust\]'\)[\s\S]+disabled=locked" 'battle adjust disabled rendering is missing'
Assert-Contains $html "lcd-attention" 'LCD update reminder class is missing'
Assert-Contains $html "stepHistory" 'step undo history is missing'
Assert-Contains $html "data-step=""10""" '+10 step button is missing'
Assert-Contains $html "stepUndoBtn" 'step undo button is missing'
Assert-Contains $html "adjustPanel" 'adjust panel is missing'
Assert-Contains $html "downloadJsonBtn" 'download JSON button is missing'
Assert-Contains $html "URL\.revokeObjectURL" 'download URL cleanup is missing'
Assert-Contains $html "new Blob\(\[exportJsonText\(\)\],\{type:'application/json'\}\)" 'JSON blob export is missing'
Assert-Contains $html "sf6-record_" 'download filename prefix is missing'
Assert-Contains $html "dataset\.lastFilename" 'download filename test marker is missing'
Assert-Contains $html "type:'gcolor'" 'gcolor record is missing'
Assert-Contains $html "type:'stage_sel'" 'stage selection record is missing'
Assert-Contains $html "type:'rare'" 'rare record is missing'
Assert-Contains $html "type:'dcin'" 'dcin record is missing'
Assert-Contains $html "type:'fbhit'" 'fbhit record is missing'
Assert-Contains $html "type:'continue'" 'continue record is missing'
Assert-Contains $html "latestFbHit" 'latest FB hit helper is missing'
Assert-Contains $html "kiteiG" 'kiteiG field is missing'
Assert-Contains $html "rankKinds" 'rank chips are missing'
Assert-Contains $html "roundStartKinds" 'round start chips are missing'
Assert-Contains $html "opponentText" 'opponent field is missing'
Assert-Contains $html "selectInput\('opponentText',OPPONENTS" 'opponent dropdown is missing'
Assert-Contains $html "endScreenSelect" 'end screen dropdown is missing'
Assert-Contains $html "bonusMedals" 'bonus medals field is missing'
Assert-Contains $html "roundStart" 'roundStart field is missing'
Assert-Contains $html "continue:" 'continue field is missing'
Assert-Contains $html "fbExitLcdG" 'FB exit lcd field is missing'
Assert-Contains $html "fbLossFields" 'FB loss-only field group is missing'
Assert-Contains $html "moneyLoanBtn" 'money loan button is missing'
Assert-Contains $html "moneyDepositBtn" 'money deposit button is missing'
Assert-Contains $html "moneyCreditBtn" 'money credit update button is missing'
Assert-Contains $html "openMoneyInitSheet" 'money init sheet is missing'
Assert-Contains $html "openMoneyDepositSheet" 'money deposit sheet is missing'
Assert-Contains $html "openMoneyCreditSheet" 'money credit sheet is missing'
Assert-Contains $html "openMoneyMedalUseSheet" 'money medal use sheet is missing'
Assert-Contains $html "openMoneyDiffSyncSheet" 'money diff sync sheet is missing'
Assert-Contains $html "openMoneyCollectSheet" 'money collect sheet is missing'
Assert-Contains $html "recordMoneyInit" 'money init recorder is missing'
Assert-Contains $html "recordMoneyLoan" 'money loan recorder is missing'
Assert-Contains $html "recordMoneyDeposit" 'money deposit recorder is missing'
Assert-Contains $html "recordMoneyCreditUpdate" 'money credit update recorder is missing'
Assert-Contains $html "recordMoneyMedalUse" 'money medal use recorder is missing'
Assert-Contains $html "recordMoneyDiffSync" 'money diff sync recorder is missing'
Assert-Contains $html "recordMoneyCollectEnd" 'money collect end recorder is missing'
Assert-Contains $html "type:'money'" 'money record type is missing'
Assert-Fixed $html "'loan'" 'money loan op is missing'
Assert-Fixed $html "'creditUpdate'" 'money credit update op is missing'
Assert-Fixed $html "'diffSync'" 'money diff sync op is missing'
Assert-Fixed $html "'collectEnd'" 'money collect end op is missing'
Assert-Contains $html "intervalDiffValue" 'interval diff calculation is missing'
Assert-Contains $html "investedMedals" 'invested medals calculation is missing'
Assert-Contains $html "moneySummary" 'money summary helper is missing'
Assert-Contains $html "type==='cash'" 'cash record compatibility is missing'
Assert-Contains $html "type==='collect'" 'collect record compatibility is missing'
Assert-NotContains $html "cashKinds|cashBtn|collectBtn" 'legacy cash/collect entry UI should not be present'
Assert-Contains $html "icatchKinds" 'icatch chips are missing'
Assert-Contains $html "selectedIcatch" 'icatch selection state is missing'
Assert-Contains $html "icatch:null" 'FB win icatch null guard is missing'
Assert-Contains $html "icatchNote:null" 'FB win icatch note null guard is missing'
Assert-Contains $html "node\.textContent=text" 'textContent helper is missing'
Assert-Contains $html "setText\(el,log\.text\)" 'memo log must use textContent helper'
Assert-Contains $html "JSON\.stringify\(exportData\(\),null,1\)" 'JSON export formatting is missing'
Assert-Contains $html "window\.SF6RecordApp=" 'test hook is missing'
Assert-Contains $html "exportData" 'export data test hook is missing'
Assert-Contains $html "normalizeSf6Export" 'schema normalizer integration is missing'
Assert-Contains $html "inputmode=""numeric""" 'numeric input mode is missing'
Assert-Contains $html "resetTimer" 'two-tap reset state is missing'
Assert-Contains $html "lcdG" 'lcd field is missing'
Assert-NotContains $html "statGap|乖離" 'gap display should be removed'
Assert-NotContains $html "FB_TRIGGERS|fbTriggers|selectedFbTrig|trig:" 'FB trigger field should be removed'
Assert-NotContains $html "innerHTML\s*=" 'innerHTML assignment should not be used on user-visible logs'
Assert-NotContains $html "display:\s*grid|grid-template" 'CSS grid should not be used in this page'

$index = Get-Content -LiteralPath (Join-Path $root 'index.html') -Raw -Encoding UTF8
$sitemap = Get-Content -LiteralPath (Join-Path $root 'sitemap.xml') -Raw -Encoding UTF8
Assert-Contains $index "sf6-record\.html" 'index link is missing'
Assert-Contains $sitemap "https://slot-tools\.jp/sf6-record\.html" 'sitemap link is missing'

Assert-Fixed $schema "function normalizeSf6Export(data)" 'normalizeSf6Export definition is missing'
Assert-Fixed $schema "const SCHEMA_VERSION='5'" 'schema version 5 is missing'
Assert-Fixed $schema "ver:SCHEMA_VERSION" 'schema output version is missing'
Assert-Fixed $schema "legacy_trig" 'legacy trig preservation is missing'
Assert-Fixed $schema "currentState:normalizeCurrentState" 'currentState default normalization is missing'
Assert-Fixed $schema "battleState:normalizeBattleState" 'battleState default normalization is missing'
Assert-Fixed $schema "sessionMoney:normalizeSessionMoney" 'sessionMoney default normalization is missing'
Assert-Fixed $schema "function normalizeSessionMoney" 'normalizeSessionMoney definition is missing'
Assert-Fixed $schema "legacy_trig" 'legacy trig preservation is missing'
Assert-Fixed $schema "type==='money'" 'money log normalization is missing'
Assert-Fixed $schema "collectEnd" 'money collectEnd op is missing'
Assert-Fixed $schema "root.normalizeSf6Export=api.normalizeSf6Export" 'browser global normalizer export is missing'

"sf6-record static checks passed"
