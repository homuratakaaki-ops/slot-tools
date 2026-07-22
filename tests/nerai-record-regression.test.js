const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'nerai-record.html');
const LEGACY_FIXTURE_PATH = path.join(__dirname, 'fixtures', 'nerai-record-legacy-2026-06-29.json');
const STANDARD_AIM_NAMES = ['天井狙い', '設定狙い', 'ゾーン狙い', 'モード狙い', 'リセット狙い', '示唆狙い'];

function extractScript() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'nerai-record.html inline script not found');
  return match[1];
}

function extractStyle() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'nerai-record.html inline style not found');
  return match[1];
}

function makeStorage(seed = {}) {
  const data = { ...seed };
  return {
    get length() {
      return Object.keys(data).length;
    },
    key(index) {
      return Object.keys(data)[index] || null;
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
    dump() {
      return { ...data };
    }
  };
}

function fakeElement() {
  return {
    innerHTML: '',
    textContent: '',
    value: '',
    checked: false,
    disabled: false,
    style: { setProperty() {} },
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {},
    remove() {},
    setAttribute() {},
    focus() {},
    scrollIntoView() {},
    select() {},
    click() {},
    addEventListener() {}
  };
}

function createContext(raw, confirms = []) {
  const storageSeed = raw === undefined ? {} : { nerai_record_v1: raw };
  const localStorage = makeStorage(storageSeed);
  const sessionStorage = makeStorage();
  const alerts = [];
  const documentListeners = {};
  const windowListeners = {};
  const context = vm.createContext({
    localStorage,
    sessionStorage,
    console,
    alert(message) {
      alerts.push(String(message));
    },
    confirm() {
      return confirms.length ? confirms.shift() : false;
    },
    setTimeout(callback) {
      if (typeof callback === 'function') callback();
      return 1;
    },
    clearTimeout() {},
    requestAnimationFrame(callback) {
      if (typeof callback === 'function') callback();
      return 1;
    },
    document: {
      getElementById: () => fakeElement(),
      querySelector: () => fakeElement(),
      querySelectorAll: () => [],
      body: fakeElement(),
      createElement: () => fakeElement(),
      addEventListener(event, callback) {
        documentListeners[event] = callback;
      },
      hidden: false
    },
    window: {
      scrollTo() {},
      addEventListener(event, callback) {
        windowListeners[event] = callback;
      },
      innerHeight: 800,
      visualViewport: { height: 800, offsetTop: 0, addEventListener() {} }
    },
    navigator: { clipboard: null },
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
    Blob: function Blob() {},
    FileReader: function FileReader() {},
    __alerts: alerts,
    __documentListeners: documentListeners,
    __windowListeners: windowListeners
  });
  return { context, localStorage, sessionStorage, alerts };
}

function runRecord(raw, confirms) {
  const script = extractScript();
  const sandbox = createContext(raw, confirms);
  new vm.Script(script, { filename: 'nerai-record.html<script>' }).runInContext(sandbox.context);
  return sandbox;
}

function readLegacyFixture() {
  return JSON.parse(fs.readFileSync(LEGACY_FIXTURE_PATH, 'utf8'));
}

function testLegacyBackupLoad() {
  const legacy = readLegacyFixture();
  const raw = JSON.stringify(legacy);
  const { context, localStorage } = runRecord(raw);

  assert.equal(vm.runInContext('storageProtectionLocked', context), false);
  assert.equal(vm.runInContext('db.logs.length', context), 0);
  assert.equal(vm.runInContext('db.stores.length', context), 1);
  assert.equal(vm.runInContext('db.stores[0].name', context), 'STORE_ALPHA');
  assert.equal(vm.runInContext('db.stores[0].lendRate', context), null);
  assert.equal(vm.runInContext('db.stores[0].exchangeRate', context), null);
  assert.equal(localStorage.getItem('nerai_record_v1'), raw);
  assert.equal(localStorage.getItem('nerai_record_v1_premigrate'), raw);

  const tokyoMachines = vm.runInContext('db.machines.filter(isTokyoGhoulMachine)', context);
  assert.equal(tokyoMachines.length, 1);
  assert.equal(tokyoMachines[0].id, 'm_1782616472235_5585');
  assert.equal(tokyoMachines[0].tags.some(tag => tag.id === 't_tokyo_ghoul_suika_10'), true);
  assert.equal(tokyoMachines[0].useLcdCounter, true);
  assert.equal(tokyoMachines[0].useEndingCards, true);
}

function testTokyoGhoulCustomMachineDataSurvivesSeedOnRestore() {
  const legacy = readLegacyFixture();
  const machine = legacy.machines[0];
  machine.aims.push({ id: 'a_user_custom', name: '夢爽カスタム狙い', fields: [] });
  machine.tags.push({ id: 't_user_custom', label: '夢爽カスタムタグ', optional: true, countAs: null });
  const raw = JSON.stringify(legacy);
  const { context } = runRecord(raw);

  assert.equal(vm.runInContext("db.machines.filter(isTokyoGhoulMachine).length", context), 1);
  assert.equal(vm.runInContext("db.machines[0].aims.some(aim => aim.id === 'a_user_custom' && aim.name === '夢爽カスタム狙い')", context), true);
  assert.equal(vm.runInContext("db.machines[0].tags.some(tag => tag.id === 't_user_custom' && tag.label === '夢爽カスタムタグ')", context), true);
  assert.equal(vm.runInContext("db.machines[0].tags.some(tag => tag.id === 't_tokyo_ghoul_suika_10')", context), true);
}

function testLegacyBackupWithSyntheticLogAndGuard() {
  const legacy = readLegacyFixture();
  legacy.logs = [
    {
      id: 'l_legacy_synthetic',
      machineId: 'm_1782616472235_5585',
      aimId: 'aim_tenjo',
      date: '2026-06-29',
      store: 'STORE_ALPHA',
      startLog: [],
      endLog: null,
      timeline: [],
      segments: []
    }
  ];
  const raw = JSON.stringify(legacy);
  const { context, localStorage } = runRecord(raw);

  assert.equal(vm.runInContext('storageProtectionLocked', context), false);
  assert.equal(vm.runInContext('db.logs.length', context), 1);
  assert.equal(vm.runInContext('db.stores[0].name', context), 'STORE_ALPHA');
  assert.equal(localStorage.getItem('nerai_record_v1'), raw);
  assert.equal(localStorage.getItem('nerai_record_v1_premigrate'), raw);

  vm.runInContext('db={version:1,machines:[],stores:[],logs:[]}; persist();', context);
  assert.equal(localStorage.getItem('nerai_record_v1'), raw);
  assert.match(vm.runInContext('storageProtectionReason', context), /保存済みデータが非空/);
}

function testTokyoGhoulPresetInitialDisplayAndSpecificFeatures() {
  const { context } = runRecord(undefined);

  assert.equal(vm.runInContext('db.machines.length', context), 4);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify(db.machines.map(machine => machine.name))', context)),
    ['東京喰種', 'モンキーターンV', 'L南国育ちSPECIAL', 'Lからくりサーカス2']
  );

  vm.runInContext("selectedMachineId='m_tokyo_ghoul'; selectedAimId=firstAimIdForMachine(currentMachine())||'';", context);
  assert.equal(vm.runInContext('isTokyoGhoulMachine(currentMachine())', context), true);
  assert.equal(vm.runInContext('machineUsesLcdCounter(currentMachine())', context), true);
  assert.equal(vm.runInContext('machineUsesEndingCards(currentMachine())', context), true);
  assert.equal(vm.runInContext('machineUsesKuiPoint(currentMachine())', context), true);
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(currentMachine().tags.filter(tag => tag.id.includes('suika')).map(tag => [tag.id, tag.liquidDelta, tag.liquidSet]))", context)),
    [
      ['t_tokyo_ghoul_suika_10', 10, null],
      ['t_tokyo_ghoul_suika_100', 100, null],
      ['t_tokyo_ghoul_suika_max', null, 600]
    ]
  );
  vm.runInContext("resetTimelineOffsets(); setTimelineGames(100,100); applyLiquidRuleAfterTimelineAdd(['t_tokyo_ghoul_suika_10'],{});", context);
  assert.equal(vm.runInContext('timelineLiquidOffset()', context), 10);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 110);
  vm.runInContext("resetTimelineOffsets(); setTimelineGames(100,100); applyLiquidRuleAfterTimelineAdd(['t_tokyo_ghoul_suika_max'],{});", context);
  assert.equal(vm.runInContext('timelineLiquidOffset()', context), 500);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 600);
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(hitBranchSteps('czFail').map(step => step.key))", context)),
    ['czResult', 'czEndcard', 'eyecatch', 'kui', 'exit']
  );
}

function testStandardAimSeedsNoDuplicatesAndDeleteTombstone() {
  const { context, localStorage } = runRecord(undefined, [true, true]);

  const machineSummaries = JSON.parse(vm.runInContext(`JSON.stringify(db.machines.map(machine => ({
    id: machine.id,
    names: machine.aims.map(aim => aim.name)
  })))`, context));
  machineSummaries.forEach(machine => {
    STANDARD_AIM_NAMES.forEach(name => assert.equal(machine.names.includes(name), true, `${machine.id} should include ${name}`));
    STANDARD_AIM_NAMES.forEach(name => assert.equal(machine.names.filter(row => row === name).length, 1, `${machine.id} should not duplicate ${name}`));
  });

  vm.runInContext("selectedMachineId='m_tokyo_ghoul'; selectedAimId='aim_zone'; deleteAim('aim_zone');", context);
  assert.equal(vm.runInContext("machineById('m_tokyo_ghoul').aims.some(aim => aim.name === 'ゾーン狙い')", context), false);
  const stored = localStorage.getItem('nerai_record_v1');
  const reloaded = runRecord(stored, [true]);
  assert.equal(vm.runInContext("machineById('m_tokyo_ghoul').aims.some(aim => aim.name === 'ゾーン狙い')", reloaded.context), false);
  assert.equal(vm.runInContext("machineById('m_tokyo_ghoul').standardAimSeedDeletedIds.includes('aim_zone')", reloaded.context), true);

  vm.runInContext('renderAll(); renderAll();', reloaded.context);
  assert.equal(vm.runInContext("machineById('m_tokyo_ghoul').aims.filter(aim => aim.name === '天井狙い').length", reloaded.context), 1);

  vm.runInContext("selectedMachineId='m_karakuri_circus_2'; selectedAimId=machineById('m_karakuri_circus_2').aims.find(aim => aim.name === '天井狙い').id; deleteAim(selectedAimId);", reloaded.context);
  assert.equal(vm.runInContext("machineById('m_karakuri_circus_2').aims.some(aim => aim.name === '天井狙い')", reloaded.context), false);
  vm.runInContext('renderAll(); renderAll();', reloaded.context);
  assert.equal(vm.runInContext("machineById('m_karakuri_circus_2').aims.some(aim => aim.name === '天井狙い')", reloaded.context), false);
}

function testOtherPresetMachinesRemainStable() {
  const { context } = runRecord(undefined);
  assert.equal(vm.runInContext("isMonkeyTurnMachine(machineById('m_monkey_turn_v'))", context), true);
  assert.equal(vm.runInContext("machineUsesLcdCounter(machineById('m_monkey_turn_v'))", context), false);
  assert.equal(vm.runInContext("isNangokuSpecialMachine(machineById('m_nangoku_special'))", context), true);
  assert.equal(vm.runInContext("machineById('m_nangoku_special').quickTagIds.includes('t_nangoku_suika')", context), true);
  assert.equal(vm.runInContext("isKarakuriCircus2Machine(machineById('m_karakuri_circus_2'))", context), true);
  assert.equal(vm.runInContext("machineById('m_karakuri_circus_2').counters.length > 0", context), true);
}

function noHitQuitLog(machineId, machineName, timelineText) {
  return {
    id: `l_no_hit_quit_${machineId}`,
    schemaVersion: 2,
    sessionId: `s_no_hit_quit_${machineId}`,
    aimNumber: 1,
    branchNumber: 1,
    status: 'settled',
    machineId,
    aimId: 'aim_tenjo',
    machineName,
    aimName: '天井狙い',
    fieldSnapshot: [],
    values: {},
    flowStep: 4,
    state4Registered: true,
    finalized: true,
    excludeFromStats: false,
    startCounterGame: 0,
    startLog: [],
    timeline: [],
    hitEvents: [],
    suggestLog: [],
    endingCards: {},
    segments: [
      {
        id: `seg_no_hit_quit_${machineId}`,
        branchNumber: 2,
        status: 'committed',
        terminalType: 'follow_miss',
        terminalLabel: 'follow_miss',
        dataGame: 201,
        liquidGame: 201,
        timeline: [
          { id: `tl_no_hit_quit_${machineId}`, game: 150, liquidGame: 150, text: timelineText, tagIds: [], countAs: [], createdAt: '2026-07-18T00:00:00.000Z' }
        ],
        suggestLog: [],
        hitEvents: [],
        endingCards: {},
        createdAt: '2026-07-18T00:01:00.000Z'
      }
    ],
    endLog: { id: `el_no_hit_quit_${machineId}`, game: 201, liquidGame: 201, reason: 'ヤメ', text: '', czCount: 0, upperCzCount: 0, atCount: 0, directAtCount: 0, episodeBonusCount: 0 },
    money: { date: '2026-07-18', store: '', machineNo: '', startTime: '', endTime: '', startMedals: 0, endMedals: 0, cashIn: 0, lendRate: null, exchangeRate: null, workMinutes: null, diff: null, balance: null, hourlyRate: null, medalDiff: 0, yenDiff: null },
    publicMemo: '',
    privateMemo: '',
    createdAt: '2026-07-18T00:02:00.000Z',
    updatedAt: '2026-07-18T00:02:00.000Z'
  };
}

function testNoHitQuitSegmentsAreIncludedInTextOutputs() {
  const cases = [
    ['m_nangoku_special', 'L南国育ちSPECIAL', 'プリリプ'],
    ['m_tokyo_ghoul', '東京喰種', 'スイカ10'],
    ['m_karakuri_circus_2', 'Lからくりサーカス2', '幕間チャンスなし']
  ];
  cases.forEach(([machineId, machineName, timelineText]) => {
    const raw = JSON.stringify({ version: 1, machines: [], stores: [], logs: [noHitQuitLog(machineId, machineName, timelineText)] });
    const { context, localStorage } = runRecord(raw);
    const shareText = vm.runInContext('buildShareText(db.logs[0])', context);
    assert.match(shareText, /― 1-2 ―/);
    assert.match(shareText, new RegExp(timelineText));
    assert.match(shareText, /201G 当選前ヤメ（201\/201G）/);

    const organizedText = vm.runInContext('organizedDetailText({ aimNumber: 1, logs: [db.logs[0]] })', context);
    assert.match(organizedText, /― 1-2 ―/);
    assert.match(organizedText, /201G 当選前ヤメ（201\/201G）/);

    const restored = runRecord(localStorage.getItem('nerai_record_v1'));
    assert.match(vm.runInContext('buildShareText(db.logs[0])', restored.context), /201G 当選前ヤメ（201\/201G）/);
  });
}

function testHitSegmentsRemainIncludedInTextOutputs() {
  const log = noHitQuitLog('m_tokyo_ghoul', '東京喰種', '弱チェリー');
  log.segments[0].terminalType = 'quit';
  log.segments[0].terminalLabel = 'AT直撃 / 今回の稼働終了';
  log.segments[0].trigger = 'direct_at';
  log.segments[0].hitEvents = [{ id: 'he_hit', trigger: 'direct_at', dataGame: 201, liquidGame: 201, subCounters: {}, czResult: null, payout: null, through: null, terminalType: '', endingCount: 0, exit: 'quit', wizardDone: true, createdAt: '2026-07-18T00:01:00.000Z' }];
  const raw = JSON.stringify({ version: 1, machines: [], stores: [], logs: [log] });
  const { context } = runRecord(raw);
  const shareText = vm.runInContext('buildShareText(db.logs[0])', context);
  assert.match(shareText, /― 1-2 ―/);
  assert.match(shareText, /当選イベント：/);
  assert.match(shareText, /AT直撃/);
}

function seedOpenNoHitTimeline(context, text = 'プリリプ') {
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentTimelineDataGame = 210;
    setTimelineGames(210, 201);
    currentTimelineManualCorrection = offsetFromDataLiquid(210, 201);
    currentTimeline = [{ id: 'tl_open_no_hit', game: 180, liquidGame: 171, text: '${text}', tagIds: [], countAs: [], createdAt: '2026-07-18T00:00:00.000Z' }];
    currentSuggestLog = [];
    currentHitEvents = [];
    currentSegments = [];
    currentEndLog = null;
    currentFlowStep = 2;
  `, context);
}

function testYameOutcomeTabClosesNoHitSegmentWithoutMemoDuplicate() {
  const { context } = runRecord(undefined);
  seedOpenNoHitTimeline(context);

  vm.runInContext("setTimelineOutcome('ヤメ')", context);
  assert.equal(vm.runInContext('currentFlowStep', context), 4);
  assert.equal(vm.runInContext('currentSegments.length', context), 1);
  assert.equal(vm.runInContext("currentSegments[0].terminalType", context), 'follow_miss');
  assert.equal(vm.runInContext("currentSegments[0].timeline.some(item => item.text === 'ヤメ')", context), false);
  assert.equal(vm.runInContext("segmentTerminalLine(currentSegments[0])", context), '210G 当選前ヤメ（210/201G）');
}

function testStep4GuardClosesOrCancelsOpenNoHitSegment() {
  const accepted = runRecord(undefined, [true]);
  seedOpenNoHitTimeline(accepted.context, 'さざなみ');
  vm.runInContext('switchFlowStep(4)', accepted.context);
  assert.equal(vm.runInContext('currentFlowStep', accepted.context), 4);
  assert.equal(vm.runInContext("currentSegments[0].terminalType", accepted.context), 'follow_miss');

  const cancelled = runRecord(undefined, [false]);
  seedOpenNoHitTimeline(cancelled.context, 'リプフラ');
  vm.runInContext('switchFlowStep(4)', cancelled.context);
  assert.equal(vm.runInContext('currentFlowStep', cancelled.context), 2);
  assert.equal(vm.runInContext('currentSegments.length', cancelled.context), 0);
}

function testExistingFollowMissButtonStillArchivesSegment() {
  const { context } = runRecord(undefined);
  seedOpenNoHitTimeline(context, '当選なし確認');
  vm.runInContext('commitFollowMissBranch()', context);
  assert.equal(vm.runInContext('currentSegments.length', context), 1);
  assert.equal(vm.runInContext("currentSegments[0].terminalType", context), 'follow_miss');
}

function testNewRegistrationGuardClosesOpenNoHitSegment() {
  const { context } = runRecord(undefined, [true, true]);
  seedOpenNoHitTimeline(context, '据え置き確認');
  vm.runInContext('startNewRegistration()', context);
  assert.equal(vm.runInContext('db.logs.length', context), 1);
  assert.equal(vm.runInContext("db.logs[0].segments[0].terminalType", context), 'follow_miss');
  assert.equal(vm.runInContext("segmentTerminalLine(db.logs[0].segments[0])", context), '210G 当選前ヤメ（210/201G）');
  assert.equal(vm.runInContext('currentSegments.length', context), 0);
}

function testBattleModeUndefinedQuickPanelRendersEmptySlots() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_monkey_turn_v';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
  `, context);
  const grid = vm.runInContext('renderBattleModeGrid()', context);
  assert.match(grid, /battleModeIncrementGame\(1\)/);
  assert.match(grid, /battleModeIncrementGame\(3\)/);
  assert.match(grid, /battleModeIncrementGame\(5\)/);
  assert.match(grid, /battleModeIncrementGame\(10\)/);
  assert.match(grid, /openBattleModeOtherSheet/);
  assert.equal((grid.match(/type="button" disabled/g) || []).length, 6);
  assert.match(extractStyle(), /\.bm-event-row\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
}

function testBattleModeKeypadOverlayStacksAboveBattleMode() {
  const style = extractStyle();
  const keypad = style.match(/\.keypad-overlay\{[^}]*z-index:(\d+)/);
  const battle = style.match(/\.bm-overlay\{[^}]*z-index:(\d+)/);
  assert.ok(keypad, 'keypad overlay z-index not found');
  assert.ok(battle, 'battle mode overlay z-index not found');
  assert.ok(Number(keypad[1]) > Number(battle[1]), 'numeric keypad must stack above battle mode overlay');
}

function testShopNoteOverlayOpensFromVisibleTop() {
  const style = extractStyle();
  assert.match(style, /#shopNoteOverlay\{[^}]*align-items:flex-start/);
  assert.match(style, /#shopNoteOverlay\{[^}]*overflow:auto/);
  assert.match(style, /#shopNoteOverlay\{[^}]*safe-area-inset-top/);
  const script = extractScript();
  assert.match(script, /overlay\.scrollTop=0/);
  assert.match(script, /sheet\.scrollTop=0/);
  assert.match(script, /scrollIntoView\?\.\(\{block:'start'\}\)/);
}

function testBattleModeMemoSheetTracksViewportOnResume() {
  const style = extractStyle();
  const script = extractScript();
  assert.match(style, /\.bm-sheet\.memo-mode \.bm-sheet-panel\{[^}]*--bm-keyboard-inset/);
  assert.match(script, /function updateBattleModeMemoViewport\(\)/);
  assert.match(script, /visibilitychange/);
  assert.match(script, /window\.addEventListener\('focus',\(\)=>handlePageResume\('focus復帰'\)\)/);
  assert.match(script, /function handlePageResume\(reason\)/);
  assert.match(script, /window\.visualViewport\.addEventListener\('resize',scheduleBattleModeMemoViewportUpdate\)/);
}

function testBattleModeToastUsesTopPosition() {
  const style = extractStyle();
  const toast = style.match(/\.bm-toast\{[^}]*\}/);
  assert.ok(toast, 'battle mode toast style not found');
  assert.match(toast[0], /top:72px/);
  assert.match(toast[0], /z-index:12000/);
  assert.doesNotMatch(toast[0], /bottom:58px/);
}

function testBattleModeEventRowBeforeCounterRow() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
  `, context);
  const grid = vm.runInContext('renderBattleModeGrid()', context);
  assert.ok(grid.indexOf('battleModeIncrementGame(1)') < grid.indexOf('リプレイ</button>'));
  assert.ok(grid.indexOf('リプレイ</button>') < grid.indexOf('リプレイフラッシュ'));
  assert.ok(grid.indexOf('リプレイフラッシュ') < grid.indexOf('openBattleModeOtherSheet'));
  assert.match(grid, /さざなみ\s+前兆/);
  const style = extractStyle();
  assert.match(style, /\.bm-grid\{[^}]*align-content:end/);
  assert.match(style, /\.bm-event-row \.bm-btn\{[^}]*white-space:pre-line/);
}

function testBattleModeHitStartScrollsNextInputOnlyFromBattleMode() {
  const script = extractScript();
  assert.match(script, /let battleModeScrollToHitNext=false/);
  assert.match(script, /battleModeScrollToHitNext=true/);
  assert.match(script, /function scrollHitBranchNextButtonIntoView\(\)/);
  const style = extractStyle();
  assert.match(style, /\.branch-next-btn\{[^}]*min-height:48px/);
}

function testBattleModeOtherSheetExcludesQuickPanelTags() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
  `, context);
  const excluded = JSON.parse(vm.runInContext('JSON.stringify([...battleModeOtherExcludedTagIds()].sort())', context));
  assert.deepEqual(excluded, [
    't_nangoku_cherry',
    't_nangoku_pato_light',
    't_nangoku_puririp',
    't_nangoku_replay',
    't_nangoku_replay_flash',
    't_nangoku_sazanami_purple',
    't_nangoku_sazanami_rainbow',
    't_nangoku_sazanami_red',
    't_nangoku_suika',
    't_nangoku_through'
  ]);
  assert.equal(vm.runInContext("currentMachine().tags.filter(tag => !battleModeOtherExcludedTagIds().has(tag.id)).some(tag => tag.id === 't_nangoku_puririp')", context), false);
  assert.equal(vm.runInContext("currentMachine().tags.filter(tag => !battleModeOtherExcludedTagIds().has(tag.id)).some(tag => tag.id === 't_nangoku_replay_flash')", context), false);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_nangoku_puririp')", context), true);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_nangoku_pato_light')", context), true);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_nangoku_through')", context), true);
  assert.match(extractScript(), /closeBattleModeOtherSheet\(\)">閉じる/);
}

function testBattleModeReplayFlashMeterUsesCurrentLiquidGames() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    setManualCorrectionForLiquid(177, 168);
    setTimelineGames(177, 168);
    currentTimeline = [
      { id: 'tl_rf1', game: 54, liquidGame: 45, text: 'リプレイフラッシュ', tagIds: ['t_nangoku_replay_flash'], countAs: [], createdAt: '2026-07-21T00:00:00.000Z' },
      { id: 'tl_rf2', game: 112, liquidGame: 103, text: 'リプレイフラッシュ', tagIds: ['t_nangoku_replay_flash'], countAs: [], createdAt: '2026-07-21T00:01:00.000Z' },
      { id: 'tl_replay', game: 120, liquidGame: 111, text: 'リプレイ', tagIds: ['t_nangoku_replay'], countAs: [], createdAt: '2026-07-21T00:02:00.000Z' }
    ];
  `, context);
  assert.equal(vm.runInContext('battleModeReplayFlashMeterText()', context), 'リプフラ 2／168G（1/84）');
  assert.match(vm.runInContext('renderBattleModeReplayFlashMeter()', context), /リプフラ 2／168G（1\/84）/);

  vm.runInContext("currentTimeline = currentTimeline.filter(item => item.id !== 'tl_rf2')", context);
  assert.equal(vm.runInContext('battleModeReplayFlashMeterText()', context), 'リプフラ 1／168G（1/168）');

  vm.runInContext("currentTimeline = []", context);
  assert.equal(vm.runInContext('battleModeReplayFlashMeterText()', context), 'リプフラ 0／168G');
}

function testBattleModeReplayFlashMeterHiddenWithoutQuickPanelTag() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_tokyo_ghoul';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    setTimelineGames(177, 168);
    currentTimeline = [
      { id: 'tl_rf1', game: 54, liquidGame: 45, text: 'リプレイフラッシュ', tagIds: ['t_nangoku_replay_flash'], countAs: [], createdAt: '2026-07-21T00:00:00.000Z' }
    ];
  `, context);
  assert.equal(vm.runInContext('battleModeHasReplayFlashMeter()', context), false);
  assert.equal(vm.runInContext('renderBattleModeReplayFlashMeter()', context), '');
}

function testBattleModeTagRecordUndoAndRedoUsesTimelineFormat() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    setManualCorrectionForLiquid(184, 176);
    setTimelineGames(184, 176);
    battleModeRecordTag('t_nangoku_suika');
  `, context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 1);
  assert.equal(vm.runInContext('currentTimeline[0].text', context), 'スイカ');
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(currentTimeline[0].tagIds)', context)), ['t_nangoku_suika']);
  assert.equal(vm.runInContext('currentTimeline[0].game', context), 184);
  assert.equal(vm.runInContext('currentTimeline[0].liquidGame', context), 176);
  assert.equal(vm.runInContext('currentSubCounters.suika', context), 1);

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 0);
  assert.equal(vm.runInContext('currentSubCounters.suika || 0', context), 0);

  vm.runInContext('redoBattleModeUndo()', context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 1);
  assert.equal(vm.runInContext('currentTimeline[0].text', context), 'スイカ');
  assert.equal(vm.runInContext('currentSubCounters.suika', context), 1);
}

function testBattleModeMemoUsesTimelineTextEntryFormat() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    setManualCorrectionForLiquid(222, 213);
    setTimelineGames(222, 213);
    battleModeCommit('メモ', () => addTimelineEntryText('自由メモ'));
  `, context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 1);
  assert.equal(vm.runInContext('currentTimeline[0].text', context), '自由メモ');
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(currentTimeline[0].tagIds)', context)), []);
  assert.equal(vm.runInContext('currentTimeline[0].game', context), 222);
  assert.equal(vm.runInContext('currentTimeline[0].liquidGame', context), 213);

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 0);
}

function testLogSegmentCollapseDefaultsLatestTodayOpen() {
  const { context } = runRecord(undefined);
  const result = JSON.parse(vm.runInContext(`
    const today = todayValue();
    const segment = normalizeSegment({
      id: 'seg_today',
      dataGame: 292,
      liquidGame: 292,
      terminalLabel: 'BIG当選',
      timeline: [{ id: 'tl_today', game: 184, liquidGame: 184, text: '自由メモ', tagIds: [], createdAt: new Date().toISOString() }]
    });
    const todayLog = { id: 'log_today', machineId: 'm_nangoku_special', money: { date: today } };
    const oldLog = { id: 'log_old', machineId: 'm_nangoku_special', money: { date: '2000-01-01' } };
    JSON.stringify({
      todayOpen: renderSegmentHistoryItem(todayLog, segment, 0, 1),
      oldClosed: renderSegmentHistoryItem(oldLog, segment, 0, 1)
    });
  `, context));
  assert.match(result.todayOpen, /▼/);
  assert.match(result.todayOpen, /自由メモ/);
  assert.match(result.todayOpen, /loadLogForEdit/);
  assert.doesNotMatch(result.todayOpen, /item-actions/);
  assert.match(result.oldClosed, /▶/);
  assert.doesNotMatch(result.oldClosed, /自由メモ/);
  assert.match(result.oldClosed, /loadLogForEdit/);
}

function testBattleModeCounterRowUsesExistingTagFlow() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    setManualCorrectionForLiquid(200, 191);
    setTimelineGames(200, 191);
    battleModeRecordTag('t_nangoku_replay');
    battleModeRecordTag('t_nangoku_cherry');
    battleModeRecordTag('t_nangoku_suika');
  `, context);
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(currentTimeline.map(row => row.tagIds[0]))', context)), [
    't_nangoku_replay',
    't_nangoku_cherry',
    't_nangoku_suika'
  ]);
  assert.equal(vm.runInContext('currentSubCounters.suika', context), 1);

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 2);
  assert.equal(vm.runInContext('currentSubCounters.suika || 0', context), 0);
}

function testBattleModeSazanamiPickerStoresEntryCause() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    setManualCorrectionForLiquid(184, 176);
    setTimelineGames(184, 176);
    battleModeRecordSazanami('sazanami_suika3', 'red');
  `, context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 1);
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(currentTimeline[0].tagIds)', context)), ['t_nangoku_sazanami_red']);
  assert.equal(vm.runInContext('currentTimeline[0].entryCause', context), 'sazanami_suika3');
  assert.equal(vm.runInContext('currentTimeline[0].entryCauseLabel', context), 'スイカ3回目');
  assert.equal(vm.runInContext('currentTimeline[0].intervalEvent || ""', context), '');

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentTimeline.length', context), 0);
  vm.runInContext('redoBattleModeUndo()', context);
  assert.equal(vm.runInContext('currentTimeline[0].entryCause', context), 'sazanami_suika3');
}

function testBattleModeBonusPickerStartsExistingHitWizard() {
  [
    ['direct_at', '', 'direct_at', ''],
    ['direct_at', 'blue7', 'direct_at', 'blue7'],
    ['episode_bonus', '', 'episode_bonus', '']
  ].forEach(([trigger, variant, expectedTrigger, expectedVariant]) => {
    const { context } = runRecord(undefined);
    vm.runInContext(`
      selectedMachineId = 'm_nangoku_special';
      selectedAimId = firstAimIdForMachine(currentMachine()) || '';
      battleModeOpen = true;
      currentFlowStep = 2;
      setManualCorrectionForLiquid(210, 201);
      setTimelineGames(210, 201);
      battleModeStartHit('${trigger}', '${variant}');
    `, context);
    assert.equal(vm.runInContext('currentHitEvents.length', context), 1);
    assert.equal(vm.runInContext('currentHitEvents[0].trigger', context), expectedTrigger);
    assert.equal(vm.runInContext('currentHitEvents[0].variant', context), expectedVariant);
    assert.equal(vm.runInContext('currentHitEvents[0].dataGame', context), 210);
    assert.equal(vm.runInContext('currentHitEvents[0].liquidGame', context), 201);
    assert.equal(vm.runInContext('currentFlowStep', context), 3);
    assert.equal(vm.runInContext('battleModeOpen', context), false);
    assert.equal(vm.runInContext('battleModeUndoStack.length', context), 0);
  });
}

function testNangokuBonusTypeSuggestStepIsSkippedAfterBonusPicker() {
  [
    ['direct_at', '', 0],
    ['episode_bonus', '', 0],
    ['direct_at', 'blue7', 1]
  ].forEach(([trigger, variant, expectedBonusSuggestCount]) => {
    const { context } = runRecord(undefined);
    vm.runInContext(`
      selectedMachineId = 'm_nangoku_special';
      selectedAimId = firstAimIdForMachine(currentMachine()) || '';
      battleModeOpen = true;
      currentFlowStep = 2;
      setManualCorrectionForLiquid(210, 201);
      setTimelineGames(210, 201);
      battleModeStartHit('${trigger}', '${variant}');
      nangokuHitSuggestState = { eventId: currentHitEvents[0].id, stepIndex: 3 };
      openNangokuHitSuggestStep();
    `, context);
    assert.notEqual(vm.runInContext('suggestPickerState.branchStep', context), 'nangokuHitSuggest');
    assert.equal(vm.runInContext("currentSuggestLog.filter(entry => entry.placeId === 'sgp_nangoku_bonus_type').length + currentSegments.reduce((sum, segment) => sum + (segment.suggestLog || []).filter(entry => entry.placeId === 'sgp_nangoku_bonus_type').length, 0)", context), expectedBonusSuggestCount);
  });
}

function testBattleModeHitWizardResetReturnsToBattleMode() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    setManualCorrectionForLiquid(210, 201);
    setTimelineGames(210, 201);
    battleModeStartHit('direct_at', '');
    resetHitBranchWizard();
  `, context);
  assert.equal(vm.runInContext('battleModeOpen', context), true);
  assert.equal(vm.runInContext('battleModeReturnAfterHitWizard', context), false);
  assert.equal(vm.runInContext('hitBranchWizard.route', context), '');
}

function testBattleModeGameIncrementUndoAndRedo() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    setManualCorrectionForLiquid(100, 91);
    setTimelineGames(100, 91);
    battleModeIncrementGame(3);
  `, context);
  assert.equal(vm.runInContext('timelineDataValue()', context), 103);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 94);
  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('timelineDataValue()', context), 100);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 91);
  vm.runInContext('redoBattleModeUndo()', context);
  assert.equal(vm.runInContext('timelineDataValue()', context), 103);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 94);
}

function testBattleModeIntervalDiffTrackerCalculatesPersistsAndUndoRedo() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    currentIntervalEstimate = normalizeIntervalEstimate({ initialDiff: null, loanRate: 46.6 });
    battleModeApplyDiffTrackerInput('investYen', 6);
    battleModeApplyDiffTrackerInput('credit', 400);
    battleModeApplyDiffTrackerInput('setInvestedTotal', 200);
  `, context);
  assert.equal(vm.runInContext('currentIntervalEstimate.initialDiff', context), null);
  assert.equal(vm.runInContext('currentIntervalEstimate.investedTotal', context), 200);
  assert.equal(vm.runInContext('currentIntervalEstimate.credit', context), 400);
  assert.equal(vm.runInContext('battleModeIntervalDiffValue()', context), 200);
  assert.equal(vm.runInContext('db.draftLog.intervalEstimate.investedTotal', context), 200);
  assert.equal(vm.runInContext('db.draftLog.intervalEstimate.credit', context), 400);
  assert.equal(vm.runInContext('db.draftLog.intervalEstimate.certainty', context), 'unknown');
  assert.match(vm.runInContext('db.draftLog.intervalEstimate.history.at(-1).summary', context), /投資合計を修正 280 → 200/);
  assert.equal(vm.runInContext('db.draftLog.intervalEstimate.history.length', context), 3);
  assert.equal(vm.runInContext('Math.round(7 * normalizeIntervalEstimate({ loanRate: 46.6 }).loanRate)', context), 326);
  assert.match(vm.runInContext('renderBattleModeDiffHistory()', context), /投資合計を修正 280 → 200/);
  assert.match(vm.runInContext('renderBattleModeDiffHistory()', context), /履歴（直近10件）/);

  vm.runInContext("battleModeApplyDiffTrackerInput('correct', 500)", context);
  assert.equal(vm.runInContext('currentIntervalEstimate.initialDiff', context), 300);
  assert.equal(vm.runInContext('battleModeIntervalDiffValue()', context), 500);

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentIntervalEstimate.initialDiff', context), null);
  assert.equal(vm.runInContext('battleModeIntervalDiffValue()', context), 200);

  vm.runInContext('redoBattleModeUndo()', context);
  assert.equal(vm.runInContext('currentIntervalEstimate.initialDiff', context), 300);
  assert.equal(vm.runInContext('battleModeIntervalDiffValue()', context), 500);
  assert.match(extractScript(), /千円単位（1 = 1,000円）/);
  assert.match(extractScript(), /Math\.round\(value\*rate\)/);
  assert.match(extractScript(), /現在: \$\{current\.toLocaleString\('ja-JP'\)\}枚/);

  vm.runInContext(`
    setManualCorrectionForLiquid(250, 241);
    setTimelineGames(250, 241);
    battleModeRecordIntervalDiffSnapshot();
  `, context);
  assert.equal(vm.runInContext('currentTimeline.at(-1).text', context), '差枚 +500（初期 300 ＋ クレ 400 − 投資 200）');
  assert.equal(vm.runInContext('currentTimeline.at(-1).game', context), 250);
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(currentTimeline.at(-1).tagIds)', context)), []);

  const raw = JSON.stringify(JSON.parse(vm.runInContext('localStorage.getItem("nerai_record_v1")', context)));
  const restored = runRecord(raw);
  vm.runInContext('loadDraftIntoInputs(db.draftLog)', restored.context);
  assert.match(vm.runInContext('renderBattleModeDiffHistory()', restored.context), /投資合計を修正 280 → 200/);
  assert.equal(vm.runInContext('currentIntervalEstimate.history.length', restored.context), 4);

  assert.equal(vm.runInContext(`
    normalizeIntervalEstimate({
      history: Array.from({ length: 55 }, (_, i) => ({
        mode: 'credit',
        summary: 'row ' + i,
        before: { investedTotal: i, credit: i },
        after: { investedTotal: i, credit: i + 1 }
      }))
    }).history.length
  `, context), 50);
}

function testSuggestLogSnapshotKeepsOnlyCurrentSegmentEntries() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    currentSegmentStartedAt = '2026-07-18T10:00:00.000Z';
    currentSuggestLog = [
      { id: 'carry_setting', place: '前区切り', item: '持ち越し', carryType: 'setting', createdAt: '2026-07-18T09:59:00.000Z' },
      { id: 'current_setting', place: '今回区切り', item: '今回', carryType: 'setting', createdAt: '2026-07-18T10:01:00.000Z' }
    ];
  `, context);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify(segmentSuggestLogForSnapshot().map(entry => entry.id))', context)),
    ['current_setting']
  );
}

function testNormalizeDataDedupesCopiedSegmentSuggestLogs() {
  const duplicated = {
    id: 'l_suggest_dup',
    schemaVersion: 2,
    sessionId: 's_suggest_dup',
    aimNumber: 1,
    status: 'finished',
    machineId: 'm_nangoku_special',
    aimId: 'aim_tenjo',
    machineName: 'L南国育ちSPECIAL',
    aimName: '天井狙い',
    fieldSnapshot: [],
    values: {},
    flowStep: 4,
    startCounterGame: 0,
    startLog: [],
    timeline: [],
    suggestLog: [],
    hitEvents: [],
    segments: [
      { id: 'seg_new', createdAt: '2026-07-18T10:10:00.000Z', branchNumber: 2, timeline: [], suggestLog: [{ id: 'sg_dup', place: '示唆', item: '同一', carryType: 'setting', createdAt: '2026-07-18T10:00:00.000Z' }], hitEvents: [], endingCards: {} },
      { id: 'seg_old', createdAt: '2026-07-18T10:00:00.000Z', branchNumber: 1, timeline: [], suggestLog: [{ id: 'sg_dup', place: '示唆', item: '同一', carryType: 'setting', createdAt: '2026-07-18T10:00:00.000Z' }], hitEvents: [], endingCards: {} }
    ],
    endingCards: {},
    money: { date: '2026-07-18', store: '', machineNo: '', startMedals: 0, endMedals: null, cashIn: 0 },
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T10:10:00.000Z'
  };
  const raw = JSON.stringify({ version: 1, machines: [], stores: [], logs: [duplicated], shopNotes: [], draftLog: null });
  const { context } = runRecord(raw);
  assert.equal(vm.runInContext('db.logs[0].segments.find(segment => segment.id === "seg_old").suggestLog.length', context), 1);
  assert.equal(vm.runInContext('db.logs[0].segments.find(segment => segment.id === "seg_new").suggestLog.length', context), 0);
}

function testStorageGuardCatchesLogShopNoteAndDraftLoss() {
  const oldData = {
    version: 1,
    machines: [],
    stores: [{ id: 'st_1', name: 'STORE', lendRate: null, exchangeRate: null }],
    logs: [{ id: 'l_1', sessionId: 's_1' }],
    shopNotes: [{ id: 'sn_1', text: 'note', shopName: 'STORE' }],
    draftLog: { id: 'draft_1', sessionId: 's_draft' }
  };
  const { context, localStorage } = runRecord(JSON.stringify(oldData));
  vm.runInContext('db.logs = []; db.shopNotes = []; db.draftLog = null; persist();', context);
  const stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  assert.equal(stored.logs.length, 1);
  assert.equal(stored.shopNotes.length, 1);
  assert.ok(stored.draftLog);
  assert.equal(vm.runInContext('storageProtectionReason.length > 0', context), true);
}

function testStorageGuardRecoveryArchivesStoredDraftForNewSession() {
  const oldData = {
    version: 1,
    machines: [],
    stores: [],
    logs: [{ id: 'l_1', sessionId: 's_1' }],
    shopNotes: [],
    draftLog: {
      id: 'draft_1784594137282_5332',
      sessionId: 'draft_1784594137282_5332',
      machineId: 'm_nangoku_special',
      aimId: 'a_nangoku_special_tenjo',
      schemaVersion: 2,
      flowStep: 2,
      status: 'active',
      startCounterGame: 50,
      timeline: [{ id: 'tl_1', game: 54, liquidGame: 54, text: 'リプレイフラッシュ', tagIds: ['t_nangoku_replay_flash'] }],
      money: { date: '2026-07-21', store: 'STORE', machineNo: '12', startMedals: 0 }
    }
  };
  const { context, localStorage } = runRecord(JSON.stringify(oldData), [true]);
  vm.runInContext('db.draftLog = null; persist();', context);
  let stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  assert.ok(stored.draftLog);
  assert.equal(vm.runInContext('storageProtectionReason.length > 0', context), true);

  assert.equal(vm.runInContext('recoverStorageGuardForNewSession()', context), true);
  stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  assert.equal(stored.draftLog, null);
  assert.equal(stored.logs.some(log => log.sessionId === 'draft_1784594137282_5332' && log.status === 'suspended'), true);
  assert.equal(vm.runInContext('storageProtectionLocked', context), false);
  assert.equal(vm.runInContext('storageProtectionReason', context), '');
}

function testQuotaExceededLocksProtectionWithoutThrowing() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === STORAGE_KEY) {
        const error = new Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      }
      return originalSetItem(key, value);
    };
    db.logs.push({ id: 'l_quota', sessionId: 's_quota' });
  `, context);
  assert.equal(vm.runInContext('persist()', context), false);
  assert.equal(vm.runInContext('storageProtectionLocked', context), true);
}

function testStorageUsageDisplayAndWarningThresholds() {
  const { context, localStorage } = runRecord(undefined);
  const usageDetail = fakeElement();
  const usageBanner = fakeElement();
  context.document.getElementById = id => {
    if (id === 'storageUsageDetail') return usageDetail;
    if (id === 'storageUsageBanner') return usageBanner;
    return fakeElement();
  };
  localStorage.setItem('usage_seed_60', 'x'.repeat(Math.ceil(5 * 1024 * 1024 * 0.61 / 2)));
  vm.runInContext('renderStorageUsage()', context);
  assert.match(usageDetail.textContent, /使用量: \d+\.\dMB \/ 上限目安 5\.0MB（\d+%）/);
  assert.equal(vm.runInContext("document.getElementById('storageUsageBanner').classList.toggle('open', true); storageUsageInfo().ratio >= STORAGE_USAGE_WARN_RATIO", context), true);
  assert.equal(vm.runInContext("storageUsageInfo().ratio >= STORAGE_USAGE_DANGER_RATIO", context), false);

  localStorage.setItem('usage_seed_80', 'y'.repeat(Math.ceil(5 * 1024 * 1024 * 0.20 / 2)));
  vm.runInContext('renderStorageUsage()', context);
  assert.equal(vm.runInContext("storageUsageInfo().ratio >= STORAGE_USAGE_DANGER_RATIO", context), true);
  assert.match(usageBanner.textContent, /保存失敗の危険/);
}

function testProtectionBackupDeleteDownloadsAndKeepsPrimaryStorage() {
  const { context, localStorage } = runRecord(undefined, [true]);
  localStorage.setItem('nerai_record_v1', JSON.stringify({ version: 1, machines: [], stores: [], logs: [{ id: 'main' }] }));
  localStorage.setItem('nerai_record_v1_prerestore', JSON.stringify({ version: 1, machines: [], stores: [], logs: [{ id: 'old' }] }));
  vm.runInContext(`
    downloaded = [];
    downloadJsonText = (raw, filename) => downloaded.push({ raw, filename });
    deleteProtectionBackup('nerai_record_v1_prerestore');
  `, context);
  assert.equal(localStorage.getItem('nerai_record_v1_prerestore'), null);
  assert.ok(localStorage.getItem('nerai_record_v1'));
  assert.equal(vm.runInContext('downloaded.length', context), 1);
  assert.match(vm.runInContext('downloaded[0].filename', context), /nerai_record_v1_prerestore-delete-backup-/);

  vm.runInContext("deleteProtectionBackup('nerai_record_v1')", context);
  assert.ok(localStorage.getItem('nerai_record_v1'));
}

function testCheckpointStoresOnlyCurrentSessionAndRestoresIt() {
  const seed = {
    version: 1,
    machines: [],
    stores: [],
    shopNotes: [{ id: 'sn_keep', text: 'note', shopName: 'STORE' }],
    logs: [
      { id: 'l_old', sessionId: 's_cp', machineName: '東京喰種', status: 'suspended', timeline: [{ id: 'old_tl' }], money: { date: '2026-07-21' } },
      { id: 'l_other', sessionId: 's_other', machineName: 'L南国育ちSPECIAL', status: 'settled', timeline: [{ id: 'other_tl' }], money: { date: '2026-07-21' } }
    ],
    draftLog: { id: 'draft_cp', sessionId: 's_cp', machineName: '東京喰種', status: 'active', timeline: [{ id: 'draft_tl' }], money: { date: '2026-07-21' } }
  };
  const { context, localStorage } = runRecord(JSON.stringify(seed), [true]);
  assert.equal(vm.runInContext("saveCheckpoint('BIG当選記録後')", context), true);
  const checkpoint = JSON.parse(localStorage.getItem('nerai_record_v1_checkpoint'));
  assert.equal(checkpoint.type, 'nerai_record_checkpoint');
  assert.equal(checkpoint.reason, 'BIG当選記録後');
  assert.equal(checkpoint.sessionId, 's_cp');
  assert.equal(checkpoint.logs.length, 1);
  assert.equal(checkpoint.logs[0].id, 'l_old');
  assert.equal(checkpoint.draftLog.id, 'draft_cp');
  assert.equal(JSON.stringify(checkpoint).includes('s_other'), false);
  assert.equal(JSON.stringify(checkpoint).includes('sn_keep'), false);

  vm.runInContext(`
    db.logs = [
      { id: 'l_broken', sessionId: 's_cp', machineName: '東京喰種', status: 'active', timeline: [] },
      { id: 'l_other', sessionId: 's_other', machineName: 'L南国育ちSPECIAL', status: 'settled', timeline: [{ id: 'other_tl' }] }
    ];
    db.draftLog = null;
    restoreCheckpoint();
  `, context);
  assert.equal(vm.runInContext("db.logs.some(log => log.id === 'l_old' && log.sessionId === 's_cp')", context), true);
  assert.equal(vm.runInContext("db.logs.some(log => log.id === 'l_broken')", context), false);
  assert.equal(vm.runInContext("db.logs.some(log => log.id === 'l_other' && log.sessionId === 's_other')", context), true);
  assert.equal(vm.runInContext("db.draftLog && db.draftLog.id", context), 'draft_cp');
  assert.ok(localStorage.getItem('nerai_record_v1_prerestore'));
}

function draftRestoreSeed() {
  return {
    version: 1,
    machines: [
      { id: 'm_monkey_turn_v', name: 'モンキーターンV', aims: [], tags: [], startTags: [], labelTags: [], suggestMaster: [] },
      { id: 'm_nangoku_special', name: 'L南国育ちSPECIAL', aims: [], tags: [], startTags: [], labelTags: [], suggestMaster: [] }
    ],
    stores: [{ name: 'STORE_ALPHA' }],
    logs: [],
    draftLog: {
      id: 'draft_nangoku_active',
      schemaVersion: 2,
      sessionId: 's_nangoku_active',
      machineId: 'm_nangoku_special',
      machineName: 'L南国育ちSPECIAL',
      aimId: 'aim_tenjo',
      aimName: '天井狙い',
      status: 'active',
      flowStep: 2,
      startCounterGame: 120,
      timeline: [{ id: 'tl_keep', game: 160, liquidGame: 160, text: 'リプレイ', tagIds: ['t_nangoku_replay'] }],
      money: { date: '2026-07-21', store: 'STORE_ALPHA', machineNo: '5332', startTime: '10:00' }
    }
  };
}

function testPendingDraftRestoreBlocksAutosaveAndMachineFallback() {
  const seed = draftRestoreSeed();
  const raw = JSON.stringify(seed);
  const { context, localStorage } = runRecord(raw);

  assert.equal(vm.runInContext('pendingDraftRestore', context), true);
  assert.equal(vm.runInContext('selectedMachineId', context), 'm_nangoku_special');
  assert.equal(vm.runInContext('saveDraftNow()', context), false);
  assert.equal(JSON.parse(localStorage.getItem('nerai_record_v1')).draftLog.sessionId, 's_nangoku_active');

  vm.runInContext("selectedMachineId = 'm_monkey_turn_v'; selectedAimId = firstAimIdForMachine(machineById('m_monkey_turn_v')) || '';", context);
  vm.runInContext("__windowListeners.pageshow()", context);
  assert.match(vm.runInContext('storageProtectionReason', context), /pageshow復帰/);
  vm.runInContext("storageProtectionReason = ''", context);
  assert.equal(vm.runInContext("checkDraftRestoreConsistency('test')", context), false);
  assert.match(vm.runInContext('storageProtectionReason', context), /保存済み下書きと画面状態が一致しません/);
  assert.equal(JSON.parse(localStorage.getItem('nerai_record_v1')).draftLog.machineId, 'm_nangoku_special');
}

function testPendingDraftRestoreResumeHydratesBeforeSaving() {
  const seed = draftRestoreSeed();
  const { context } = runRecord(JSON.stringify(seed));

  vm.runInContext("resumeUnfinishedSession('draft','draft_nangoku_active')", context);
  assert.equal(vm.runInContext('pendingDraftRestore', context), false);
  assert.equal(vm.runInContext('selectedMachineId', context), 'm_nangoku_special');
  assert.equal(vm.runInContext('currentFlowStep', context), 2);
  assert.equal(vm.runInContext('currentTimeline.length', context), 1);
  assert.equal(vm.runInContext('sessionFieldsLocked', context), true);
}

function shopNoteMigrationSeed() {
  return {
    version: 1,
    machines: [
      { id: 'm_nangoku_special', name: 'L南国育ちSPECIAL', aims: [], tags: [], startTags: [], labelTags: [], suggestMaster: [] },
      { id: 'm_tokyo_ghoul', name: '東京喰種', aims: [], tags: [], startTags: [], labelTags: [], suggestMaster: [] }
    ],
    stores: [{ name: 'STORE_ALPHA' }],
    logs: [],
    shopNotes: Array.from({ length: 16 }, (_, index) => ({
      id: `sn_20260721_${index}`,
      shopId: 'STORE_ALPHA',
      shopName: 'STORE_ALPHA',
      unitNumber: index < 10 ? '101' : index < 14 ? '102' : '',
      text: `7/21実戦メモ${index + 1}`,
      createdAt: `2026-07-21T10:${String(index).padStart(2, '0')}:00.000Z`,
      updatedAt: `2026-07-21T10:${String(index).padStart(2, '0')}:00.000Z`,
      resolved: false
    }))
  };
}

function testShopNoteCardsMigrateLegacyNotesWithPremigrateBackup() {
  const seed = shopNoteMigrationSeed();
  const raw = JSON.stringify(seed);
  const { context, localStorage } = runRecord(raw);

  assert.equal(vm.runInContext('db.shopNotes.length', context), 16);
  assert.equal(vm.runInContext('db.shopNoteCards.length', context), 3);
  assert.equal(vm.runInContext("db.shopNoteCards.reduce((sum, card) => sum + card.entries.length, 0)", context), 16);
  assert.equal(vm.runInContext("db.shopNoteCards.some(card => card.date === '2026-07-21' && card.machineNo === '' && card.entries.length === 2)", context), true);
  assert.equal(localStorage.getItem('nerai_record_v1'), raw);
  assert.equal(localStorage.getItem('nerai_record_v1_premigrate'), raw);

  const stored = JSON.stringify(vm.runInContext('db', context));
  const reloaded = runRecord(stored);
  assert.equal(vm.runInContext('db.shopNoteCards.length', reloaded.context), 3);
  assert.equal(vm.runInContext("db.shopNoteCards.reduce((sum, card) => sum + card.entries.length, 0)", reloaded.context), 16);

  vm.runInContext("db.shopNoteCards.pop(); persist({ allowDangerous: true });", reloaded.context);
  const afterDeleteReload = runRecord(reloaded.localStorage.getItem('nerai_record_v1'));
  assert.equal(vm.runInContext('db.shopNotes.length', afterDeleteReload.context), 16);
  assert.equal(vm.runInContext('db.shopNoteCards.length', afterDeleteReload.context), 2);
}

function testShopNoteFavoritesAreMachineScopedAndTagEntriesPersist() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [{
    id: 'snc_test',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '101',
    machineId: 'm_nangoku_special',
    entries: []
  }];
  const { context, localStorage } = runRecord(JSON.stringify(seed), [true]);

  vm.runInContext("shopNoteOpenCardId = 'snc_test'; toggleShopNoteFavorite('snt_reel_blue');", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(db.shopNoteFavorites.m_nangoku_special)", context)), ['snt_reel_blue']);
  assert.equal(vm.runInContext("db.shopNoteFavorites.m_tokyo_ghoul", context), undefined);
  vm.runInContext("db.shopNoteCards[0].machineId = 'm_tokyo_ghoul'; toggleShopNoteFavorite('snt_trophy_bronze');", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(db.shopNoteFavorites.m_tokyo_ghoul)", context)), ['snt_trophy_bronze']);

  vm.runInContext("addShopNoteEntry('snc_test','snt_reel_blue');", context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", context), 1);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagIds[0]", context), 'snt_reel_blue');
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), 'リール青');
  const stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  assert.equal(stored.shopNoteCards[0].entries[0].tagIds[0], 'snt_reel_blue');
}

function testShopNoteBlankCardAndUnregisteredFavorites() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [{
    id: 'snc_blank',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: '',
    machineNo: '',
    machineId: '',
    entries: []
  }];
  const { context } = runRecord(JSON.stringify(seed), [true]);

  assert.equal(vm.runInContext('db.shopNoteCards.length', context), 1);
  assert.equal(vm.runInContext("db.shopNoteCards[0].store", context), '');
  assert.equal(vm.runInContext("db.shopNoteCards[0].machineId", context), '');
  vm.runInContext("shopNoteOpenCardId = 'snc_blank'; toggleShopNoteFavorite('snt_other_follow');", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(db.shopNoteFavorites[''])", context)), ['snt_other_follow']);
  vm.runInContext("addShopNoteEntry('snc_blank','snt_other_follow');", context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), 'フォロー候補');
}

function testShopNoteCreateKeepsExplicitUnregisteredMachine() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [];
  const { context } = runRecord(JSON.stringify(seed), [true]);

  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    db.draftLog = { money: { date: '2026-07-21' } };
    const elements = {
      shopNoteNewStoreText: { value: 'テスト店' },
      shopNoteNewStoreSelect: { value: '' },
      shopNoteNewMachineSelect: { value: '' },
      shopNoteNewMachineNo: { value: '777' },
      shopNoteBody: { innerHTML: '' },
      logsList: { innerHTML: '' }
    };
    const generic = {
      innerHTML: '',
      textContent: '',
      value: '',
      classList: { add() {}, remove() {}, toggle() {} },
      style: {},
      closest() { return null; },
      querySelector() { return null; },
      scrollIntoView() {}
    };
    document.getElementById = id => elements[id] || generic;
    createShopNoteCard();
  `, context);

  assert.equal(vm.runInContext('db.shopNoteCards.length', context), 1);
  assert.equal(vm.runInContext("db.shopNoteCards[0].store", context), 'テスト店');
  assert.equal(vm.runInContext("db.shopNoteCards[0].machineNo", context), '777');
  assert.equal(vm.runInContext("db.shopNoteCards[0].machineId", context), '');
}

function testShopNoteSuggestMasterPaletteAndSnapshotFallback() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.machines.push({ id: 'm_shop_note_custom', name: '他台メモ検証機', aims: [], tags: [], startTags: [], labelTags: [], suggestMaster: [] });
  seed.machines[2].suggestMaster = [{
    id: 'sgc_mode',
    category: 'モード示唆',
    places: [{
      id: 'sgp_reel',
      name: 'リール発光',
      items: [
        { id: 'sgi_reel_blue', label: 'リール青' },
        { id: 'sgi_reel_red', label: 'リール赤' }
      ]
    }]
  }];
  seed.shopNoteCards = [{
    id: 'snc_suggest',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '101',
    machineId: 'm_shop_note_custom',
    entries: []
  }];
  const { context } = runRecord(JSON.stringify(seed), [true]);
  const virtualId = 'snv_m_shop_note_custom_sgc_mode_sgp_reel_sgi_reel_blue';

  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_shop_note_custom').tags.some(tag => tag.id === 'snt_result_direct_at')", context), true);
  assert.equal(vm.runInContext(`shopNoteTagsForMachine('m_shop_note_custom').tags.some(tag => tag.id === '${virtualId}')`, context), true);
  vm.runInContext(`addShopNoteEntry('snc_suggest','${virtualId}');`, context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), 'リール青');
  vm.runInContext("machineById('m_shop_note_custom').suggestMaster = [];", context);
  assert.equal(vm.runInContext("shopNoteCardSummaryText(db.shopNoteCards[0]).includes('リール青')", context), true);
}

function testShopNoteNangokuPaletteUsesAllowList() {
  const { context } = runRecord(undefined);
  const palette = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine('m_nangoku_special'))", context));
  const tagIds = palette.tags.map(tag => tag.id);
  const categoryLabels = palette.categories.map(category => category.label);

  assert.deepEqual(categoryLabels, ['モード示唆', '結果・状態', 'その他']);
  assert.equal(tagIds.length, 14);
  assert.ok(tagIds.includes('snt_result_bonus'));
  assert.ok(tagIds.includes('snt_result_quit'));
  assert.ok(tagIds.includes('snt_other_attention'));
  assert.ok(tagIds.includes('snt_other_follow'));
  assert.ok(tagIds.includes('snt_other_memo'));
  assert.equal(tagIds.some(id => id.includes('sgp_nangoku_trigger')), false);
  assert.equal(tagIds.some(id => id.includes('sgp_nangoku_bonus_type')), false);
  assert.equal(tagIds.some(id => id.includes('sgp_nangoku_bonus_voice')), false);
  assert.equal(tagIds.includes('snt_mode_reset'), false);
  assert.equal(tagIds.includes('snt_mode_same'), false);
  assert.equal(tagIds.includes('snt_result_direct_at'), false);
  assert.equal(tagIds.includes('snt_result_cz'), false);
  assert.equal(tagIds.includes('snt_result_no_suggest'), false);
  assert.equal(tagIds.includes('snt_eyecatch_default'), false);
  assert.equal(palette.tags.slice(0, 9).every(tag => tag.categoryId === 'sntc_mode'), true);
  assert.deepEqual(palette.tags.slice(0, 9).map(tag => tag.label), [
    '紫さざなみ',
    '赤さざなみ',
    '虹さざなみ',
    'リプフラ',
    'ボナ後変化なし',
    'ボナ後青',
    'ボナ後緑',
    'ボナ後赤',
    'ボナ後虹'
  ]);
  assert.deepEqual(palette.tags.slice(0, 9).map(tag => tag.color), ['purple', 'red', 'rainbow', 'gray', 'gray', 'blue', 'green', 'red', 'rainbow']);
  assert.equal(vm.runInContext("machineById('m_nangoku_special').settingSuggestCounter.items.length", context), 7);
}

function testShopNoteShortLabelsDotsAndSnapshots() {
  const { context } = runRecord(undefined);
  const purpleId = vm.runInContext("shopNoteTagsForMachine('m_nangoku_special').tags[0].id", context);
  const grayId = vm.runInContext("shopNoteTagsForMachine('m_nangoku_special').tags[3].id", context);
  vm.runInContext(`
    db.shopNoteCards = [{
      id: 'snc_color',
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z',
      date: '2026-07-21',
      store: 'STORE_ALPHA',
      machineNo: '101',
      machineId: 'm_nangoku_special',
      entries: [{
        id: 'sne_old',
        at: '2026-07-21T10:00:00.000Z',
        tagIds: ['${purpleId}'],
        tagLabels: ['紫さざなみ（旧ラベルのスナップショット）'],
        text: ''
      }]
    }];
  `, context);

  const paletteHtml = vm.runInContext("renderShopNotePalette(db.shopNoteCards[0])", context);
  assert.match(paletteHtml, /shop-note-color-dot/);
  assert.match(paletteHtml, /rainbow/);
  assert.match(paletteHtml, /ボナ後変化なし/);
  assert.doesNotMatch(paletteHtml, /変化なし（デフォルト/);
  vm.runInContext(`addShopNoteEntry('snc_color','${grayId}');`, context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[1].tagLabels[0]", context), 'リプフラ');
  const entryHtml = vm.runInContext("renderShopNoteEntry(db.shopNoteCards[0].entries[0], db.shopNoteCards[0])", context);
  assert.match(entryHtml, /紫さざなみ（旧ラベルのスナップショット）/);
  assert.match(entryHtml, /shop-note-color-dot/);
  assert.match(vm.runInContext("shopNoteCardSummaryText(db.shopNoteCards[0])", context), /紫さざなみ（旧ラベルのスナップショット）/);
}

function testShopNoteWrapsPaletteRowsWithoutChangingFallbacks() {
  const style = extractStyle();
  assert.match(style, /\.shop-note-palette-row\{[^}]*flex-wrap:wrap/);
  assert.doesNotMatch(style.match(/\.shop-note-palette-row\{[^}]*\}/)[0], /overflow-x:auto/);
  const { context } = runRecord(undefined);
  const unregistered = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine(''))", context));
  const tokyo = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine('m_tokyo_ghoul'))", context));
  assert.equal(unregistered.tags.some(tag => tag.color), false);
  assert.equal(tokyo.tags.some(tag => tag.color), false);
  assert.equal(tokyo.tags.some(tag => tag.id === 'snt_result_direct_at'), true);
}

function testShopNoteSettingSuggestCounterUsesEntriesOnly() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [{
    id: 'snc_counter',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '101',
    machineId: 'm_nangoku_special',
    entries: []
  }, {
    id: 'snc_unregistered',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: '',
    machineNo: '',
    machineId: '',
    entries: []
  }];
  const { context, localStorage } = runRecord(JSON.stringify(seed), [true]);
  const tagId = vm.runInContext("machineById('m_nangoku_special').settingSuggestCounter.items[1].tagId", context);

  assert.match(vm.runInContext("renderShopNoteSettingCounter(db.shopNoteCards[0])", context), /設定示唆: 合計0件/);
  assert.equal(vm.runInContext("renderShopNoteSettingCounter(db.shopNoteCards[1])", context), '');
  vm.runInContext("shopNoteCounterOpenCards.add('snc_counter')", context);
  assert.match(vm.runInContext("renderShopNoteSettingCounter(db.shopNoteCards[0])", context), /張り切っていこー（偶数示唆）/);
  vm.runInContext(`addShopNoteEntry('snc_counter','${tagId}');`, context);
  vm.runInContext(`addShopNoteEntry('snc_counter','${tagId}');`, context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${tagId}']`, context), 2);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", context), 2);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), '張り切っていこー（偶数示唆）');

  const stored = localStorage.getItem('nerai_record_v1');
  const reloaded = runRecord(stored);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${tagId}']`, reloaded.context), 2);
  vm.runInContext(`removeShopNoteCounterEntry('snc_counter','${tagId}');`, reloaded.context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${tagId}']`, reloaded.context), 1);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", reloaded.context), 1);
}

function testShopNoteExistingLogsAndStorageCountsRemainStable() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.logs = [
    { id: 'log_0718_a', createdAt: '2026-07-18T10:00:00.000Z', money: { date: '2026-07-18' }, timeline: [], segments: [] },
    { id: 'log_0718_b', createdAt: '2026-07-18T11:00:00.000Z', money: { date: '2026-07-18' }, timeline: [], segments: [] },
    { id: 'log_0719', createdAt: '2026-07-19T10:00:00.000Z', money: { date: '2026-07-19' }, timeline: [], segments: [] },
    { id: 'log_0720_tokyo', machineId: 'm_tokyo_ghoul', createdAt: '2026-07-20T10:00:00.000Z', money: { date: '2026-07-20' }, timeline: [], segments: [] },
    { id: 'log_0721_949', machineId: 'm_nangoku_special', createdAt: '2026-07-21T10:00:00.000Z', money: { date: '2026-07-21', machineNo: '949' }, timeline: [], segments: [] }
  ];
  seed.shopNoteCards = [{ id: 'snc_keep', createdAt: '2026-07-21T10:00:00.000Z', updatedAt: '2026-07-21T10:00:00.000Z', date: '2026-07-21', store: '', machineNo: '', machineId: '', entries: [] }];
  const { context } = runRecord(JSON.stringify(seed), [true]);

  assert.equal(vm.runInContext('db.logs.length', context), 5);
  assert.equal(vm.runInContext('storageCounts(db).logs', context), 5);
  assert.equal(vm.runInContext('storageCounts(db).shopNoteCards', context), 1);
  vm.runInContext('persist();', context);
  assert.equal(vm.runInContext('storageProtectionLocked', context), false);
}

function run() {
  new vm.Script(extractScript(), { filename: 'nerai-record.html<script>' });
  testTokyoGhoulPresetInitialDisplayAndSpecificFeatures();
  testStandardAimSeedsNoDuplicatesAndDeleteTombstone();
  testOtherPresetMachinesRemainStable();
  testNoHitQuitSegmentsAreIncludedInTextOutputs();
  testHitSegmentsRemainIncludedInTextOutputs();
  testYameOutcomeTabClosesNoHitSegmentWithoutMemoDuplicate();
  testStep4GuardClosesOrCancelsOpenNoHitSegment();
  testExistingFollowMissButtonStillArchivesSegment();
  testNewRegistrationGuardClosesOpenNoHitSegment();
  testBattleModeUndefinedQuickPanelRendersEmptySlots();
  testBattleModeKeypadOverlayStacksAboveBattleMode();
  testShopNoteOverlayOpensFromVisibleTop();
  testBattleModeMemoSheetTracksViewportOnResume();
  testBattleModeToastUsesTopPosition();
  testBattleModeEventRowBeforeCounterRow();
  testBattleModeHitStartScrollsNextInputOnlyFromBattleMode();
  testBattleModeOtherSheetExcludesQuickPanelTags();
  testBattleModeReplayFlashMeterUsesCurrentLiquidGames();
  testBattleModeReplayFlashMeterHiddenWithoutQuickPanelTag();
  testBattleModeTagRecordUndoAndRedoUsesTimelineFormat();
  testBattleModeMemoUsesTimelineTextEntryFormat();
  testLogSegmentCollapseDefaultsLatestTodayOpen();
  testBattleModeCounterRowUsesExistingTagFlow();
  testBattleModeSazanamiPickerStoresEntryCause();
  testBattleModeBonusPickerStartsExistingHitWizard();
  testNangokuBonusTypeSuggestStepIsSkippedAfterBonusPicker();
  testBattleModeHitWizardResetReturnsToBattleMode();
  testBattleModeGameIncrementUndoAndRedo();
  testBattleModeIntervalDiffTrackerCalculatesPersistsAndUndoRedo();
  testSuggestLogSnapshotKeepsOnlyCurrentSegmentEntries();
  testNormalizeDataDedupesCopiedSegmentSuggestLogs();
  testStorageGuardCatchesLogShopNoteAndDraftLoss();
  testStorageGuardRecoveryArchivesStoredDraftForNewSession();
  testQuotaExceededLocksProtectionWithoutThrowing();
  testStorageUsageDisplayAndWarningThresholds();
  testProtectionBackupDeleteDownloadsAndKeepsPrimaryStorage();
  testCheckpointStoresOnlyCurrentSessionAndRestoresIt();
  testPendingDraftRestoreBlocksAutosaveAndMachineFallback();
  testPendingDraftRestoreResumeHydratesBeforeSaving();
  testShopNoteCardsMigrateLegacyNotesWithPremigrateBackup();
  testShopNoteFavoritesAreMachineScopedAndTagEntriesPersist();
  testShopNoteBlankCardAndUnregisteredFavorites();
  testShopNoteCreateKeepsExplicitUnregisteredMachine();
  testShopNoteSuggestMasterPaletteAndSnapshotFallback();
  testShopNoteNangokuPaletteUsesAllowList();
  testShopNoteShortLabelsDotsAndSnapshots();
  testShopNoteWrapsPaletteRowsWithoutChangingFallbacks();
  testShopNoteSettingSuggestCounterUsesEntriesOnly();
  testShopNoteExistingLogsAndStorageCountsRemainStable();
  testLegacyBackupLoad();
  testTokyoGhoulCustomMachineDataSurvivesSeedOnRestore();
  testLegacyBackupWithSyntheticLogAndGuard();
  console.log('nerai-record regression: PASS');
}

run();
