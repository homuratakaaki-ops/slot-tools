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
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {},
    remove() {},
    setAttribute() {},
    focus() {},
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
    document: {
      getElementById: () => fakeElement(),
      querySelector: () => fakeElement(),
      querySelectorAll: () => [],
      body: fakeElement(),
      createElement: () => fakeElement()
    },
    window: { scrollTo() {} },
    navigator: { clipboard: null },
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
    Blob: function Blob() {},
    FileReader: function FileReader() {},
    __alerts: alerts
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
  testLegacyBackupLoad();
  testTokyoGhoulCustomMachineDataSurvivesSeedOnRestore();
  testLegacyBackupWithSyntheticLogAndGuard();
  console.log('nerai-record regression: PASS');
}

run();
