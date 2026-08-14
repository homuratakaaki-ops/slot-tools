$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'kado-note.html'
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8

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

$expected = [math]::Round(1250 / 52 * 1000) - 43000
if ($expected -ne -18962) {
  throw "profit formula check failed: $expected"
}

"kado-note static checks passed"
