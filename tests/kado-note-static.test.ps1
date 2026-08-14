$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'kado-note.html'
$designPath = Join-Path $root 'docs/session-schema-v2-design.md'
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
$design = Get-Content -LiteralPath $designPath -Raw -Encoding UTF8

function Assert-Fixed($Text, $Needle, $Message) {
  if (-not $Text.Contains($Needle)) {
    throw $Message
  }
}

function Assert-Contains($Text, $Pattern, $Message) {
  if ($Text -notmatch $Pattern) {
    throw $Message
  }
}

function Assert-NotContains($Text, $Pattern, $Message) {
  if ($Text -match $Pattern) {
    throw $Message
  }
}

Assert-Fixed $html '<link rel="canonical" href="https://slot-tools.jp/kado-note.html">' 'canonical is missing'
Assert-Fixed $design '### 2.3' 'schema design 2.3 section is missing'
Assert-Fixed $design '`realG` / `lcdG`' 'schema design game counter fields are missing'
Assert-Fixed $design '### 2.4' 'schema design 2.4 section is missing'
Assert-Fixed $html 'type="file"' 'file input is missing'
Assert-Fixed $html 'multiple' 'multiple file import is missing'
Assert-Fixed $html "const STORAGE_KEY='kadonote_sessions_v1'" 'kadonote storage key is missing'
Assert-Fixed $html "const STAMP_TOGGLE_KEY='kadonote_stamp_visible_v1'" 'kadonote stamp toggle key is missing'
Assert-Fixed $html "const SCHEMA='slot-session'" 'slot-session schema marker is missing'
Assert-Fixed $html 'function normalizeSession(raw)' 'normalizeSession function is missing'
Assert-Fixed $html 'Number(raw.schemaVer)===SCHEMA_VER' 'schemaVer 2 branch is missing'
Assert-Fixed $html 'function isLegacySession(raw)' 'legacy field-existence detector is missing'
Assert-Fixed $html 'Array.isArray(raw.logs)' 'legacy logs field check is missing'
Assert-Fixed $html "Object.prototype.hasOwnProperty.call(raw,'currentState')" 'legacy currentState field check is missing'
Assert-Fixed $html "Object.prototype.hasOwnProperty.call(raw,'sessionMoney')" 'legacy sessionMoney field check is missing'
Assert-Fixed $html "Object.prototype.hasOwnProperty.call(raw,'machine')" 'legacy machine field check is missing'
Assert-Fixed $html 'sessionId:uuidV4()' 'legacy import must generate a new sessionId'
Assert-Fixed $html 'estimated:true' 'legacy import must mark estimated timestamps'
Assert-Fixed $html 'machineId:toKebab(src.machine)' 'legacy machineId kebab conversion is missing'
Assert-Fixed $html 'payload:{...payload,logs}' 'legacy top-level payload migration is missing'
Assert-Fixed $html 'if(raw&&raw.schema&&raw.schema!==SCHEMA)throw new Error' 'schema mismatch rejection is missing'
Assert-Fixed $html 'const ok=confirm(`' 'duplicate sessionId confirmation is missing'
Assert-Fixed $html 'sessions[index]=session' 'duplicate overwrite path is missing'
Assert-Fixed $html 'if(!ok){skipped++;continue;}' 'duplicate cancel skip path is missing'
Assert-Fixed $html 'Math.round(payout/rate*1000)' 'recovery formula must round payout / exchangeRate * 1000'
Assert-Fixed $html 'return Number.isFinite(invest)?recovered-invest:null' 'profit formula must subtract invest'
Assert-Fixed $html '$(''excludedNote'').textContent=excluded?' 'excluded total note is missing'
Assert-Fixed $html 'white-space:pre-wrap' 'memo newline preservation style is missing'
Assert-Fixed $html "log.type==='memo'" 'memo timeline branch is missing'
Assert-Fixed $html "log.type==='stamp'" 'stamp timeline branch is missing'
Assert-Fixed $html 'localStorage.getItem(STAMP_TOGGLE_KEY)' 'stamp toggle persistence load is missing'
Assert-Fixed $html 'saveStampToggle();' 'stamp toggle persistence save is missing'
Assert-Fixed $html 'if(!visible.length)' 'empty timeline display is missing'
Assert-Fixed $html 'function deleteSelected()' 'delete dialog function is missing'
Assert-Contains $html 'confirm\([^;]*JSON' 'delete dialog source-file notice is missing'
Assert-Fixed $html 'sessions=sessions.filter' 'session delete path is missing'
Assert-Fixed $html 'window.KadoNoteApp' 'test hook is missing'
Assert-NotContains $html 'textarea id="session' 'session editing UI must not exist'
Assert-NotContains $html 'contenteditable' 'content editing UI must not exist'
Assert-Fixed $html 'const EVENT_RENDERERS={' 'machine renderer registry is missing'
Assert-Fixed $html "'l-sf6':{render:renderSf6Event,gameText:sf6GameText}" 'SF6 renderer registration is missing'
Assert-Fixed $html 'function sf6GameText(log)' 'SF6 game counter renderer is missing'
Assert-Fixed $html 'const real=log.realG===null||log.realG===undefined' 'SF6 realG counter guard is missing'
Assert-Fixed $html 'const lcd=log.lcdG===null||log.lcdG===undefined' 'SF6 lcdG counter guard is missing'
Assert-Fixed $html 'function renderSf6Event(log)' 'SF6 event renderer is missing'
Assert-Fixed $html "if(log.type==='gcolor')return" 'SF6 gcolor renderer is missing'
$blueIcon = [char]::ConvertFromUtf32(0x1F535)
$redIcon = [char]::ConvertFromUtf32(0x1F534)
Assert-Fixed $html $blueIcon 'SF6 blue color icon is missing'
Assert-Fixed $html $redIcon 'SF6 red color icon is missing'
Assert-Fixed $html "if(log.type==='dcin')return" 'SF6 dcin renderer is missing'
Assert-Fixed $html "if(log.type==='gain')" 'SF6 gain renderer is missing'
Assert-Fixed $html "if(log.type==='zenchou')return sf6ZenchouText(log.dir)" 'SF6 zenchou renderer is missing'
Assert-Fixed $html "if(log.type==='fbhit')return" 'SF6 fbhit renderer is missing'
Assert-Fixed $html "if(log.type==='fb')return sf6FbText(log)" 'SF6 fb renderer is missing'
Assert-Fixed $html "const SF6_DEFAULT_RETURN_COLOR=" 'default return color constant is missing'
Assert-Fixed $html 'if(value===SF6_DEFAULT_RETURN_COLOR)return SF6_DEFAULT_RETURN_COLOR' 'default return color must not use an icon'
Assert-Fixed $html 'log.voice?' 'SF6 gain voice display is missing'
Assert-Fixed $html 'if(log.opponent)parts.push' 'SF6 fb opponent null guard is missing'
Assert-Fixed $html 'if(log.bonus)parts.push' 'SF6 fb bonus null guard is missing'
Assert-Fixed $html 'if(log.rank)parts.push' 'SF6 fb rank null guard is missing'
Assert-Fixed $html "if(log.kiteiG!==null&&log.kiteiG!==undefined)parts.push" 'SF6 fb kiteiG null guard is missing'
Assert-Fixed $html ".event.zenchou" 'zenchou emphasis style is missing'
Assert-Fixed $html 'const machineText=renderer&&renderer.render?renderer.render(log,session):null' 'renderer fallback branch is missing'
Assert-Fixed $html '}else if(machineText){' 'machine-specific event display branch is missing'

$expected = [math]::Round(1250 / 52 * 1000) - 43000
if ($expected -ne -18962) {
  throw "profit formula check failed: $expected"
}

"kado-note static checks passed"
