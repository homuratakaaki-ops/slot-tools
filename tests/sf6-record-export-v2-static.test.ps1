$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'sf6-record.html'
$designPath = Join-Path $root 'docs/session-schema-v2-design.md'
$instructionPath = Join-Path $root 'docs/mikoto-sf6-export-v2.md'
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

if (-not (Test-Path -LiteralPath $designPath)) { throw 'session schema v2 design doc is missing' }
if (-not (Test-Path -LiteralPath $instructionPath)) { throw 'sf6 export v2 instruction doc is missing' }

Assert-Fixed $html "const MACHINE_ID='l-sf6'" 'machineId constant is missing'
Assert-Fixed $html "const PAYLOAD_VERSION='2.2'" 'payloadVer constant is missing'
Assert-Fixed $html "crypto.randomUUID" 'sessionId must use crypto.randomUUID when available'
Assert-Fixed $html "function exportEnvelope(now=new Date())" 'schemaVer 2 export builder is missing'
Assert-Fixed $html "schema:'slot-session'" 'slot-session schema marker is missing'
Assert-Fixed $html "schemaVer:2" 'schemaVer 2 marker is missing'
Assert-Fixed $html "sessionId:normalized.sessionId" 'exported sessionId must come from stored state'
Assert-Fixed $html "machineId:MACHINE_ID" 'exported machineId must use common machineId'
Assert-Fixed $html "payloadVer:PAYLOAD_VERSION" 'payloadVer export is missing'
Assert-Fixed $html "invest:money?money.investedYen:null" 'unset invest must export null'
Assert-Fixed $html "payout:money?money.collectMedals:null" 'unset payout must export null'
Assert-Fixed $html "exchangeRate:info.exchangeRate" 'exchangeRate export is missing'
Assert-Fixed $html "payload:{" 'payload wrapper is missing'
Assert-Fixed $html "currentState:normalizeCurrentState(normalized.currentState)" 'currentState must be inside payload'
Assert-Fixed $html "logs" 'logs export marker is missing'
Assert-Fixed $html "save();" 'load/export must persist generated sessionId'
Assert-Fixed $html "function recoveryYen(payout,exchangeRate)" 'recovery yen helper is missing'
Assert-Fixed $html "Math.round(p/rate*1000)" 'recovery formula must round payout / exchangeRate * 1000'
Assert-Fixed $html "function finalBalanceYen(invest,payout,exchangeRate)" 'final balance helper is missing'
Assert-Fixed $html "recovered-i" 'final balance must subtract invest'
Assert-Fixed $html "openSessionInfoSheet" 'session info input sheet is missing'
Assert-Fixed $html "sessionExchangeRate" 'exchange rate input is missing'
Assert-Fixed $html "sessionStoreName" 'store name input is missing'
Assert-Fixed $html "sessionUnitNo" 'unit number input is missing'

$expected = [math]::Round(1250 / 52 * 1000) - 43000
if ($expected -ne -18962) {
  throw "profit formula check failed: $expected"
}

$exportBodyMatch = [regex]::Match($html, 'function exportEnvelope\(now=new Date\(\)\)\{(?s:.*?)\n  \}')
if (-not $exportBodyMatch.Success) { throw 'exportEnvelope body could not be located' }
$exportBody = $exportBodyMatch.Value
if ($exportBody -match '\bver\s*:') { throw 'exportEnvelope must not emit ver' }
if ($exportBody -match '\bsourceVer\s*:') { throw 'exportEnvelope must not emit sourceVer' }
if ($exportBody -match 'yenDiff|recoveryYen|finalBalanceYen') { throw 'exportEnvelope must not emit derived balance values' }

"sf6-record export v2 static checks passed"
