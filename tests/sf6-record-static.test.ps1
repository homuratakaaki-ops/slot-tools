$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'sf6-record.html'
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8

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
Assert-Fixed $html "const VERSION='1'" 'version is missing'
Assert-Contains $html "const GAIN_KINDS=\[[^\]]+\]" 'gain kind list is missing'
Assert-Contains $html "const VOICES=\[[^\]]+\]" 'voice list is missing'
Assert-Contains $html "const HOT_VOICES=new Set\(\[[^\]]+\]\)" 'hot voice list is missing'
Assert-Contains $html "const FB_TRIGGERS=\[[^\]]+\]" 'FB trigger list is missing'
Assert-Contains $html "const BONUSES=\[[^\]]+\]" 'bonus list is missing'
if ((($html -match "const GAIN_KINDS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 5)) -eq $false) { throw 'gain kind count is incorrect' }
if ((($html -match "const VOICES=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 6)) -eq $false) { throw 'voice count is incorrect' }
if ((($html -match "const FB_TRIGGERS=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 3)) -eq $false) { throw 'FB trigger count is incorrect' }
if ((($html -match "const BONUSES=\[([^\]]+)\]") -and (($Matches[1].Split(',').Count) -eq 2)) -eq $false) { throw 'bonus count is incorrect' }
Assert-Contains $html "fbThroughCount" 'FB through counter function is missing'
Assert-Contains $html "log\.kind===[^?]+\?null" 'judge voice null guard is missing'
Assert-Contains $html "bonus:win\?selectedBonus:null" 'FB loss bonus null guard is missing'
Assert-Contains $html "el\.textContent=text" 'textContent helper is missing'
Assert-Contains $html "setText\(el,log\.text\)" 'memo log must use textContent helper'
Assert-Contains $html "JSON\.stringify\(normalize\(state\),null,2\)" 'JSON export is missing'
Assert-Contains $html "window\.SF6RecordApp=" 'test hook is missing'
Assert-Contains $html "inputmode=""numeric""" 'numeric input mode is missing'
Assert-Contains $html "resetTimer" 'two-tap reset state is missing'
Assert-Contains $html "lcdG" 'lcd field is missing'
Assert-NotContains $html "innerHTML\s*=" 'innerHTML assignment should not be used on user-visible logs'
Assert-NotContains $html "display:\s*grid|grid-template" 'CSS grid should not be used in this page'

$index = Get-Content -LiteralPath (Join-Path $root 'index.html') -Raw -Encoding UTF8
$sitemap = Get-Content -LiteralPath (Join-Path $root 'sitemap.xml') -Raw -Encoding UTF8
Assert-Contains $index "sf6-record\.html" 'index link is missing'
Assert-Contains $sitemap "https://slot-tools\.jp/sf6-record\.html" 'sitemap link is missing'

"sf6-record static checks passed"
