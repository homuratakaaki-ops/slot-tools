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

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '');
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
  assert.notEqual(localStorage.getItem('nerai_record_v1'), raw);
  assert.equal(localStorage.getItem('nerai_record_v1_premigrate'), raw);
  const writtenBack = localStorage.getItem('nerai_record_v1');
  const secondLoad = runRecord(writtenBack);
  assert.equal(secondLoad.localStorage.getItem('nerai_record_v1_premigrate'), null);
  assert.equal(secondLoad.localStorage.getItem('nerai_record_v1'), writtenBack);

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
  assert.notEqual(localStorage.getItem('nerai_record_v1'), raw);
  assert.equal(localStorage.getItem('nerai_record_v1_premigrate'), raw);

  const beforeEmptyPersist = localStorage.getItem('nerai_record_v1');
  vm.runInContext('db={version:1,machines:[],stores:[],logs:[]}; persist();', context);
  assert.equal(localStorage.getItem('nerai_record_v1'), beforeEmptyPersist);
  assert.match(vm.runInContext('storageProtectionReason', context), /保存済みデータが非空/);
}

function testTokyoGhoulPresetInitialDisplayAndSpecificFeatures() {
  const { context } = runRecord(undefined);

  assert.equal(vm.runInContext('db.machines.length', context), 5);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify(db.machines.map(machine => machine.name))', context)),
    ['東京喰種', 'スマスロ 甲鉄城のカバネリ 海門決戦', 'モンキーターンV', 'L南国育ちSPECIAL', 'Lからくりサーカス2']
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

function testKabaneriPresetSeedAndPickers() {
  const { context } = runRecord(undefined);
  installBattleModeStateDom(context);
  vm.runInContext("selectedMachineId='m_kabaneri'; selectedAimId=firstAimIdForMachine(currentMachine())||''; currentTimelineDataGame=120; setTimelineGames(120,120);", context);

  assert.equal(vm.runInContext('isKabaneriMachine(currentMachine())', context), true);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify(currentMachine().quickTagIds)', context)),
    ['t_kabaneri_chance_mumei', 't_kabaneri_chance_ikoma', 't_kabaneri_chance_kabane', 't_kabaneri_chance_multi']
  );
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify(currentMachine().quickPanel.events.map(event => event.ref))', context)),
    ['state', 'kabaneri_point', 'kabaneri_omikuji', 'kabaneri_stage']
  );
  assert.equal(vm.runInContext("currentMachine().states.length", context), 11);
  assert.equal(vm.runInContext("currentMachine().states.some(state => state.id === 'kabaneri_cz_mumei' && state.endOptions.length === 2)", context), true);
  assert.equal(vm.runInContext("currentMachine().states.some(state => state.id === 'kabaneri_mumei_high')", context), true);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_kabaneri_cherry')", context), false);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_kabaneri_suika')", context), false);
  assert.equal(vm.runInContext("currentMachine().suggestMaster.some(category => category.id === 'sgc_kabaneri_point')", context), true);
  assert.equal(vm.runInContext("currentMachine().suggestMaster.some(category => category.id === 'sgc_kabaneri_omikuji')", context), true);
  assert.equal(vm.runInContext("findSuggestPlace(findSuggestCategory(currentMachine(),'sgc_kabaneri_point'),'sgp_kabaneri_point_minichara').items.some(item => item.label === '生駒・近いよ（間近!?）')", context), true);
  assert.equal(vm.runInContext("findSuggestPlace(findSuggestCategory(currentMachine(),'sgc_kabaneri_point'),'sgp_kabaneri_point_talk').items.some(item => item.label === '舵取り・返答あり（強・示唆）')", context), true);
  assert.equal(vm.runInContext("findSuggestPlace(findSuggestCategory(currentMachine(),'sgc_kabaneri_point'),'sgp_kabaneri_point_kiriban')", context), null);
  assert.equal(vm.runInContext("enabledSuggestItems('sgc_kabaneri_omikuji','sgp_kabaneri_point_kiriban').length", context), 6);
  assert.equal(vm.runInContext("findSuggestItem(findSuggestPlace(findSuggestCategory(currentMachine(),'sgc_kabaneri_omikuji'),'sgp_kabaneri_point_kiriban'),'sgp_kabaneri_point_kiriban_i1').enabled", context), false);
  assert.equal(vm.runInContext("findSuggestItem(findSuggestPlace(findSuggestCategory(currentMachine(),'sgc_kabaneri_point'),'sgp_kabaneri_point_minichara'),'sgp_kabaneri_point_minichara_i1').label", context), '無名・無言（予想）');
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(findSuggestItem(findSuggestPlace(findSuggestCategory(currentMachine(),'sgc_kabaneri_point'),'sgp_kabaneri_point_minichara'),'sgp_kabaneri_point_minichara_i1').decorations)", context)),
    [{ text: '無名', color: 'red' }]
  );
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(orderedBattleModeStates(machineStates()).map(state => battleModeStateDisplayLabel(state)))", context)),
    ['🔥チャ目高確', '🔥カバネ高確', '🔥無名高確', '🔥生駒高確', '💡無名発光', '💡生駒発光', '⚔無名CZ', '⚔生駒CZ', '💡カバネ発光', '⚡超高確', '⚔銅藍CZ']
  );
  vm.runInContext("openBattleModeStatePicker()", context);
  let stateHtml = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  let stateText = stripTags(stateHtml);
  assert.equal(stateText.indexOf('🔥チャ目高確 開始') < stateText.indexOf('🔥カバネ高確 開始'), true);
  assert.equal(stateText.indexOf('🔥無名高確 開始') < stateText.indexOf('🔥生駒高確 開始'), true);
  assert.equal(stateText.indexOf('💡無名発光 開始') < stateText.indexOf('💡生駒発光 開始'), true);
  assert.match(stateHtml, /bm-state-choice/);
  assert.match(stateHtml, /suggest-color-red">無名/);
  assert.match(stateHtml, /suggest-color-green">生駒/);
  assert.match(stateHtml, /suggest-color-blue">カバネ/);
  assert.match(stateHtml, /suggest-color-gold">超高確/);
  assert.doesNotMatch(stateHtml, /class="bm-btn[^"]*kabaneri-red/);
  vm.runInContext("battleModeRecordState('kabaneri_mumei_flash','start')", context);
  assert.match(vm.runInContext("renderBattleModeStateBadges()", context), /💡無名発光/);
  assert.match(vm.runInContext("renderBattleModeStateBadges()", context), /kabaneri-red/);
  vm.runInContext("openBattleModeStatePicker()", context);
  stateHtml = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  stateText = stripTags(stateHtml);
  assert.match(stateText, /💡無名発光 終了/);
  assert.doesNotMatch(stateText, /💡無名発光 開始/);
  assert.doesNotMatch(stateHtml, /class="bm-btn[^"]*kabaneri-red/);
  assert.deepEqual(
    JSON.parse(vm.runInContext('JSON.stringify(machineHitTriggers().map(row => [row.key, row.label]))', context)),
    [['direct_at', '駿城ボーナス'], ['episode_bonus', 'エピソードボーナス']]
  );
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(hitBranchSteps('atHit').map(step => step.key))", context)),
    ['through', 'payout']
  );
  const gridHtml = vm.runInContext('renderBattleModeGrid()', context);
  assert.match(gridHtml, /無名/);
  assert.match(gridHtml, /生駒/);
  assert.match(gridHtml, /カバネ/);
  assert.match(gridHtml, /複合/);
  assert.match(gridHtml, /pt示唆/);
  assert.match(gridHtml, /おみくじ/);
  assert.match(gridHtml, /ステージ/);
  assert.match(gridHtml, /当選・ヤメ・その他 ▼/);
  assert.doesNotMatch(gridHtml, /openBattleModePicker\('hit'\)/);
  vm.runInContext("openBattleModeKabaneriMultiPicker()", context);
  assert.match(vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context), /無名＆カバネ/);
  vm.runInContext("battleModeRecordKabaneriPickerTag('t_kabaneri_multi_mumei_kabane')", context);
  assert.equal(vm.runInContext("currentTimeline.at(-1).tagIds.includes('t_kabaneri_multi_mumei_kabane')", context), true);
  assert.match(vm.runInContext("battleModeKabaneriChanceEyeMeterText()", context), /複1/);
  vm.runInContext("openBattleModeOtherSheet()", context);
  let otherHtml = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  assert.match(otherHtml, /当選/);
  assert.match(otherHtml, /ヤメ/);
  assert.equal(otherHtml.indexOf('当選') < otherHtml.indexOf('ヤメ'), true);
  assert.equal(otherHtml.indexOf('ヤメ') < otherHtml.indexOf('閉じる'), true);
  assert.match(otherHtml, /tag-style-kabaneri-gold/);
  assert.match(otherHtml, /quit-action/);
  assert.doesNotMatch(otherHtml, /ステージ/);
  assert.doesNotMatch(otherHtml, /オールスター目/);
  assert.doesNotMatch(otherHtml, /海門回想/);
  assert.doesNotMatch(otherHtml, /キリ番演出/);
  assert.doesNotMatch(otherHtml, /景之ST突入/);
  assert.doesNotMatch(otherHtml, /真・景之ST突入/);
  assert.doesNotMatch(otherHtml, /裏・景之ST突入/);
  assert.match(otherHtml, /上位ST突入/);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_kabaneri_kaimon_recollection' && tag.label === '海門回想')", context), true);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_kabaneri_kiriban' && tag.label === 'キリ番演出')", context), true);
  assert.equal(vm.runInContext("currentMachine().tags.some(tag => tag.id === 't_kabaneri_st_true_kageyuki' && tag.label === '真・景之ST突入')", context), true);
  vm.runInContext("openBattleModeKabaneriUpperStPicker()", context);
  assert.match(vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context), /景之ST突入/);
  assert.match(vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context), /真・景之ST突入/);
  vm.runInContext("battleModeRecordKabaneriPickerTag('t_kabaneri_st_true_kageyuki')", context);
  assert.equal(vm.runInContext("currentTimeline.at(-1).tagIds.includes('t_kabaneri_st_true_kageyuki')", context), true);
  vm.runInContext("openBattleModePicker('hit')", context);
  assert.match(vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context), /駿城ボーナス/);
  vm.runInContext("openBattleModeKabaneriStagePicker()", context);
  assert.match(vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context), /第四区画坑道/);
  vm.runInContext("battleModeRecordKabaneriPickerTag('t_kabaneri_stage_fourth_tunnel')", context);
  assert.equal(vm.runInContext("currentTimeline.at(-1).tagIds.includes('t_kabaneri_stage_fourth_tunnel')", context), true);
  vm.runInContext("openBattleModeKabaneriSuggestCategoryPicker('sgc_kabaneri_point','pt示唆')", context);
  assert.match(vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context), /ミニキャラ/);
  vm.runInContext("openBattleModeSuggestPlaceFromSheet('sgc_kabaneri_point','sgp_kabaneri_point_minichara')", context);
  assert.match(vm.runInContext("__stateElements.suggestPickerOptions.innerHTML", context), /suggest-color-red">無名<\/span>・無言/);
  assert.match(vm.runInContext("__stateElements.suggestPickerOptions.innerHTML", context), /suggest-color-green">生駒<\/span>・近いよ/);
  const pointAudit = JSON.parse(vm.runInContext(`JSON.stringify(findSuggestCategory(currentMachine(),'sgc_kabaneri_point').places.map(place => {
    openSuggestItemPicker('sgc_kabaneri_point', place.id, 'play');
    const itemCount = enabledSuggestItems('sgc_kabaneri_point', place.id).length;
    const html = __stateElements.suggestPickerOptions.innerHTML;
    const first = enabledSuggestItems('sgc_kabaneri_point', place.id)[0];
    if (first) selectSuggestItem(first.id);
    return { id: place.id, itemCount, opened: html.includes('selectSuggestItem'), logged: currentSuggestLog.some(entry => entry.placeId === place.id) };
  }))`, context));
  pointAudit.forEach(row => {
    assert.equal(row.itemCount > 0, true, `${row.id} should have items`);
    assert.equal(row.opened, true, `${row.id} should open item choices`);
    assert.equal(row.logged, true, `${row.id} should register first item`);
  });
  const omikujiPlaces = JSON.parse(vm.runInContext("JSON.stringify(enabledSuggestPlaces('sgc_kabaneri_omikuji').map(place => [place.id, place.name, enabledSuggestItems('sgc_kabaneri_omikuji', place.id).length]))", context));
  assert.deepEqual(omikujiPlaces.map(row => row[1]), ['輪廻くじ', 'アイテムくじ', 'キリ番演出']);
  omikujiPlaces.forEach(row => assert.equal(row[2] > 0, true, `${row[0]} should have items`));
  vm.runInContext("openSuggestItemPicker('sgc_kabaneri_omikuji','sgp_kabaneri_point_kiriban','play')", context);
  const kiribanHtml = vm.runInContext("__stateElements.suggestPickerOptions.innerHTML", context);
  assert.doesNotMatch(kiribanHtml, /デフォルト/);
  assert.match(kiribanHtml, /suggest-color-yellow">侑那/);
  assert.match(kiribanHtml, /suggest-color-orange">鰍/);
  assert.match(kiribanHtml, /suggest-color-pink">菖蒲/);
  assert.match(kiribanHtml, /suggest-color-red">無名/);
  assert.match(kiribanHtml, /キリ番<\/span>・<span class="suggest-color-red">無名<\/span>②/);
  vm.runInContext("selectSuggestItem('sgp_kabaneri_point_kiriban_i4')", context);
  assert.equal(vm.runInContext("currentSuggestLog.some(entry => entry.categoryId === 'sgc_kabaneri_omikuji' && entry.placeId === 'sgp_kabaneri_point_kiriban' && entry.itemId === 'sgp_kabaneri_point_kiriban_i4')", context), true);
  assert.equal(vm.runInContext("suggestEntryDisplayRefs({categoryId:'sgc_kabaneri_omikuji',placeId:'sgp_kabaneri_point_kiriban',itemId:'sgp_kabaneri_point_kiriban_i1',category:'おみくじ',place:'キリ番演出',item:'キリ番・デフォルト（侑那/鰍/菖蒲/無名①・示唆）'}).itemLabel", context), 'キリ番・デフォルト（侑那/鰍/菖蒲/無名①・示唆）');
  vm.runInContext("openAtThroughBranchPicker()", context);
  assert.match(vm.runInContext("__stateElements.suggestPickerOptions.innerHTML", context), /ST突入/);
}

function testKabaneriChanceEyeMeterAndCounters() {
  const { context } = runRecord(undefined);
  installBattleModeStateDom(context);
  vm.runInContext("selectedMachineId='m_kabaneri'; selectedAimId=firstAimIdForMachine(currentMachine())||''; currentStartCounterGame=100; currentTimelineDataGame=150; setTimelineGames(150,150); battleModeOpen=true;", context);

  assert.match(vm.runInContext("renderBattleModeCompactCounters()", context), /周期/);
  assert.match(vm.runInContext("renderBattleModeCompactCounters()", context), /下段ベル/);
  assert.match(vm.runInContext("renderBattleModeReplayFlashMeter()", context), /チャ目/);

  vm.runInContext("battleModeRecordTag('t_kabaneri_chance_mumei')", context);
  assert.match(vm.runInContext("battleModeKabaneriChanceEyeMeterText()", context), /無1/);
  assert.match(vm.runInContext("battleModeKabaneriChanceEyeMeterText()", context), /合算 1\/50.0/);

  vm.runInContext("battleModeIncrementSubCounter('cycle')", context);
  vm.runInContext("battleModeIncrementSubCounter('lowerBell')", context);
  assert.equal(vm.runInContext("subCounterValue('cycle')", context), 1);
  assert.equal(vm.runInContext("subCounterValue('lowerBell')", context), 1);
  assert.equal(vm.runInContext("currentTimeline.some(row => row.tagIds.includes('t_kabaneri_cycle'))", context), true);
  assert.equal(vm.runInContext("currentTimeline.some(row => row.tagIds.includes('t_kabaneri_lower_bell'))", context), true);
  assert.match(vm.runInContext("subCounterLine(currentSubCounters)", context), /周期1回/);
  assert.match(vm.runInContext("subCounterLine(currentSubCounters)", context), /下段ベル1回/);
  const style = extractStyle();
  assert.match(style, /\.bm-grid\{[^}]*grid-auto-rows:minmax\(52px,auto\)/);
  assert.match(style, /\.bm-grid\{[^}]*align-content:start/);
  assert.doesNotMatch(style, /\.bm-grid\{[^}]*align-content:end/);
  assert.match(style, /\.bm-shell\{[^}]*grid-template-rows:auto auto minmax\(0,1fr\) auto/);
  assert.doesNotMatch(style, /\.bm-grid\{[^}]*grid-template-rows:repeat\(4/);
}

function testKabaneriChanceEyeSituationView() {
  const { context } = runRecord(undefined);
  installBattleModeStateDom(context);
  vm.runInContext(`
    selectedMachineId='m_kabaneri';
    selectedAimId=firstAimIdForMachine(currentMachine())||'';
    currentTimeline=[
      {id:'tl1',game:100,liquidGame:100,text:'無名チャンス目',tagIds:['t_kabaneri_chance_mumei'],countAs:[],createdAt:'2026-07-30T10:00'},
      {id:'tl2',game:101,liquidGame:101,text:'生駒チャンス目',tagIds:['t_kabaneri_chance_ikoma'],countAs:[],createdAt:'2026-07-30T10:01'},
      {id:'tl3',game:102,liquidGame:102,text:'生駒発光 開始',tagIds:['t_kabaneri_state_ikoma_flash_start'],countAs:[],createdAt:'2026-07-30T10:02'},
      {id:'tl4',game:103,liquidGame:103,text:'カバネチャンス目',tagIds:['t_kabaneri_chance_kabane'],countAs:[],createdAt:'2026-07-30T10:03'},
      {id:'tl5',game:104,liquidGame:104,text:'生駒発光 終了',tagIds:['t_kabaneri_state_ikoma_flash_end'],countAs:[],createdAt:'2026-07-30T10:04'},
      {id:'tl6',game:105,liquidGame:105,text:'無名高確 開始',tagIds:['t_kabaneri_state_mumei_high_start'],countAs:[],createdAt:'2026-07-30T10:05'},
      {id:'tl7',game:106,liquidGame:106,text:'無名チャンス目',tagIds:['t_kabaneri_chance_mumei'],countAs:[],createdAt:'2026-07-30T10:06'},
      {id:'tl8',game:107,liquidGame:107,text:'無名CZ 失敗',tagIds:['t_kabaneri_state_mumei_high_end','t_kabaneri_cz_mumei_end'],countAs:[],createdAt:'2026-07-30T10:07'},
      {id:'tl9',game:108,liquidGame:108,text:'カバネチャンス目',tagIds:['t_kabaneri_chance_kabane'],countAs:[],createdAt:'2026-07-30T10:08'},
      {id:'tl10',game:110,liquidGame:110,text:'カバネ発光 開始',tagIds:['t_kabaneri_state_kabane_flash_start'],countAs:[],createdAt:'2026-07-30T10:09'}
    ];
  `, context);
  assert.match(vm.runInContext("kabaneriChanceEyeSituationLine(kabaneriChanceEyeSituation().sinceCz,'前回CZから')", context), /通常1（発光なし0／あり1）・発光中0・高確中0/);
  assert.match(vm.runInContext("kabaneriFlashRateLine(kabaneriChanceEyeSituation().total)", context), /3回中 発光 2回（66.7%）/);
  vm.runInContext("openBattleModeKabaneriChanceEyeSheet()", context);
  const html = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  assert.match(html, /チャ目状況|前回CZから/);
  assert.match(html, /種別内訳/);
  assert.match(html, /カバネ：通常1/);
  vm.runInContext("currentTimeline.pop()", context);
  assert.match(vm.runInContext("kabaneriChanceEyeSituationLine(kabaneriChanceEyeSituation().sinceCz,'前回CZから')", context), /通常1（発光なし1／あり0）・発光中0・高確中0/);

  vm.runInContext("currentTimeline=[]; currentTimelineDataGame=120; setTimelineGames(120,120); battleModeOpen=true; battleModeRecordTag('t_kabaneri_chance_mumei');", context);
  assert.match(vm.runInContext("battleModeKabaneriChanceEyeMeterText()", context), /無1/);
  vm.runInContext("undoBattleModeLast()", context);
  assert.match(vm.runInContext("battleModeKabaneriChanceEyeMeterText()", context), /無0/);
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

function testNoHitQuitPresetsFirstPickupStartGames() {
  const { context } = runRecord(undefined);
  const html = vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentFlowStep = 2;
    currentStartCounterGame = 42;
    currentTimelineManualCorrection = 9;
    currentTimelineDataGame = 0;
    currentTimeline = [];
    currentSuggestLog = [];
    currentHitEvents = [];
    currentSegments = [];
    currentEndLog = null;
    renderTimelineArea('play');
  `, context);

  assert.match(html, /id="timelineGame"[^>]*value="42"/);
  assert.match(html, /id="timelineLiquidGame"[^>]*value="33"/);

  vm.runInContext("setTimelineOutcome('ヤメ')", context);
  assert.equal(vm.runInContext("segmentTerminalLine(currentSegments[0])", context), '42G 当選前ヤメ（42/33G）');

  const secondSegmentHtml = vm.runInContext(`
    currentFlowStep = 2;
    currentEndLog = null;
    renderTimelineArea('play');
  `, context);
  assert.match(secondSegmentHtml, /id="timelineGame"[^>]*value="0"/);
  assert.match(secondSegmentHtml, /id="timelineLiquidGame"[^>]*value="0"/);
}

function testNoHitQuitExistingLogEditKeepsSavedSegmentGames() {
  const log = noHitQuitLog('m_nangoku_special', 'L南国育ちSPECIAL', 'プリリプ');
  log.startCounterGame = 42;
  log.segments[0].dataGame = 42;
  log.segments[0].liquidGame = 33;
  log.endLog.game = 42;
  log.endLog.liquidGame = 33;
  const { context } = runRecord(JSON.stringify({ version: 1, machines: [], stores: [], logs: [log] }));

  vm.runInContext(`loadLogForEdit('${log.id}')`, context);
  assert.equal(vm.runInContext('currentStartCounterGame', context), 42);
  assert.equal(vm.runInContext('currentSegments[0].dataGame', context), 42);
  assert.equal(vm.runInContext('currentSegments[0].liquidGame', context), 33);
  assert.equal(vm.runInContext("segmentTerminalLine(currentSegments[0])", context), '42G 当選前ヤメ（42/33G）');
}

function testNoHitQuitOtherPresetDoesNotOverwriteEditedGame() {
  const { context } = runRecord(undefined);
  const html = vm.runInContext(`
    selectedMachineId = 'm_tokyo_ghoul';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentFlowStep = 2;
    currentStartCounterGame = 42;
    currentTimelineManualCorrection = 9;
    currentTimelineDataGame = 50;
    currentTimeline = [];
    currentSuggestLog = [];
    currentHitEvents = [];
    currentSegments = [];
    currentEndLog = null;
    renderTimelineArea('play');
  `, context);

  assert.match(html, /id="timelineGame"[^>]*value="50"/);
  assert.match(html, /id="timelineLiquidGame"[^>]*value="59"/);
}

function installSaveLogDomScript(startCounter = 300) {
  return `
    const generic = document.getElementById('generic');
    const elements = {
      startCounterGame: { ...generic, id: 'startCounterGame', value: String(${startCounter}), dataset: {} },
      moneyStartMedals: { ...generic, id: 'moneyStartMedals', value: '0' },
      moneyDate: { ...generic, id: 'moneyDate', value: '2026-07-29' },
      moneyStore: { ...generic, id: 'moneyStore', value: 'STORE_ALPHA' },
      moneyMachineNo: { ...generic, id: 'moneyMachineNo', value: '948' },
      publishStore: { ...generic, id: 'publishStore', checked: false },
      publishMachineNo: { ...generic, id: 'publishMachineNo', checked: false },
      moneyStart: { ...generic, id: 'moneyStart', value: '10:00' },
      moneyEnd: { ...generic, id: 'moneyEnd', value: '11:00' },
      moneyEndMedals: { ...generic, id: 'moneyEndMedals', value: '782' },
      moneyCashIn: { ...generic, id: 'moneyCashIn', value: '' },
      expectedValueInput: { ...generic, id: 'expectedValueInput', value: '' },
      publicMemo: { ...generic, id: 'publicMemo', value: '' },
      privateMemo: { ...generic, id: 'privateMemo', value: '' }
    };
    document.getElementById = id => elements[id] || generic;
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentStartCounterGame = ${startCounter};
    currentStartCounterEdited = true;
    currentFlowStep = 4;
    currentTimeline = [];
    currentSegments = [];
    currentHitEvents = [normalizeHitEvent({ id: 'he_save', trigger: 'at', dataGame: 5, liquidGame: 0, createdAt: '2026-07-29T10:30:00.000Z', wizardDone: true })];
    currentEndLog = { id: 'el_save', game: 5, liquidGame: 0, reason: 'ヤメ', text: '', czCount: 0, upperCzCount: 0, atCount: 1, directAtCount: 0, episodeBonusCount: 0, createdAt: '2026-07-29T10:30:00.000Z', updatedAt: '2026-07-29T10:30:00.000Z' };
  `;
}

function testSaveLogWarnsButAllowsEndGameBeforeStartCounter() {
  const { context } = runRecord(undefined, [true, true]);
  vm.runInContext(installSaveLogDomScript(300), context);
  const savedId = vm.runInContext('saveLog()?.id || ""', context);
  assert.notEqual(savedId, '');
  assert.equal(vm.runInContext('db.logs.length', context), 1);
  assert.equal(vm.runInContext('db.logs[0].endLog.game', context), 5);
}

function testSaveLogCanCancelEndGameBeforeStartCounterWarning() {
  const { context } = runRecord(undefined, [false]);
  vm.runInContext(installSaveLogDomScript(300), context);
  const result = vm.runInContext('saveLog()', context);
  assert.equal(result, undefined);
  assert.equal(vm.runInContext('db.logs.length', context), 0);
}

function testSaveLogDoesNotWarnWhenEndGameAfterStartCounter() {
  const { context } = runRecord(undefined, [true]);
  vm.runInContext(installSaveLogDomScript(300), context);
  vm.runInContext('currentEndLog.game = 450; currentEndLog.liquidGame = 450;', context);
  const savedId = vm.runInContext('saveLog()?.id || ""', context);
  assert.notEqual(savedId, '');
  assert.equal(vm.runInContext('db.logs[0].endLog.game', context), 450);
}

function testPracticeStatsShowsUnavailableForNegativeHitResetDenominator() {
  const { context } = runRecord(undefined);
  const line = vm.runInContext(`
    practiceStatsLine(calculatePracticeStats({
      machineId: 'm_nangoku_special',
      startCounterGame: 300,
      endLog: { game: 5 },
      hitEvents: [{ id: 'he_negative', trigger: 'at', dataGame: 5, createdAt: '2026-07-29T10:30:00.000Z' }],
      money: { date: '2026-07-29', store: 'STORE_ALPHA', machineNo: '948' }
    }))
  `, context);
  assert.match(line, /算出不可（当選によるリセットあり）/);
  assert.doesNotMatch(line, /回転数：-/);
  assert.doesNotMatch(line, /-295G/);
}

function testEditEndLogUsesKeypadInsteadOfPrompt() {
  const { context } = runRecord(undefined);
  const result = JSON.parse(vm.runInContext(`
    currentEndLog = { id: 'el_edit', game: 5, liquidGame: 0, reason: 'ヤメ', text: '確認', czCount: 0, upperCzCount: 0, atCount: 1, directAtCount: 0, episodeBonusCount: 0, createdAt: '2026-07-29T10:30:00.000Z', updatedAt: '2026-07-29T10:30:00.000Z' };
    const generic = document.getElementById('generic');
    const elements = {
      endGame: { ...generic, id: 'endGame', value: '', dataset: {} },
      endLiquidGame: { ...generic, id: 'endLiquidGame', value: '', dataset: {} },
      endReason: { ...generic, id: 'endReason', value: '' },
      endText: { ...generic, id: 'endText', value: '' },
      numericKeypadLabel: { ...generic, id: 'numericKeypadLabel' },
      numericKeypadValue: { ...generic, id: 'numericKeypadValue' },
      numericKeypadHint: { ...generic, id: 'numericKeypadHint' },
      numericKeypadOverlay: { ...generic, id: 'numericKeypadOverlay', classList: { add() {}, remove() {}, toggle() {} } },
      moneyDate: { ...generic, id: 'moneyDate', value: '2026-07-29' },
      moneyStore: { ...generic, id: 'moneyStore', value: 'STORE_ALPHA' },
      moneyMachineNo: { ...generic, id: 'moneyMachineNo', value: '948' },
      practiceStatsBox: { ...generic, id: 'practiceStatsBox' },
      endLogBox: { ...generic, id: 'endLogBox' }
    };
    document.getElementById = id => elements[id] || generic;
    editEndLog();
    pressKeypad('7');
    syncEndGameFields();
    JSON.stringify({
      endGame: elements.endGame.value,
      endLiquid: elements.endLiquidGame.value,
      reason: elements.endReason.value,
      text: elements.endText.value,
      activeId: activeNumericInput && activeNumericInput.id,
      replace: elements.endGame.dataset.replaceOnNextDigit,
      currentGame: currentEndLog.game
    });
  `, context));
  assert.deepEqual(result, {
    endGame: '7',
    endLiquid: '0',
    reason: 'ヤメ',
    text: '確認',
    activeId: 'endGame',
    replace: '',
    currentGame: 7
  });
}

function battleModeQuitDomScript() {
  return `
    (() => {
    const generic = document.getElementById('generic');
    const elements = {
      battleModeOverlay: { ...generic, id: 'battleModeOverlay', classList: { add() {}, remove() {}, toggle() {} } },
      battleModeOtherSheet: { ...generic, id: 'battleModeOtherSheet', classList: { add() {}, remove() {}, toggle() {} } },
      battleModeOtherGrid: { ...generic, id: 'battleModeOtherGrid', innerHTML: '' },
      battleModeTitle: { ...generic, id: 'battleModeTitle', textContent: '' },
      battleModeCheckpointStatus: { ...generic, id: 'battleModeCheckpointStatus', innerHTML: '' },
      battleModeCounters: { ...generic, id: 'battleModeCounters', innerHTML: '' },
      battleModeGrid: { ...generic, id: 'battleModeGrid', innerHTML: '' },
      battleModeRecent: { ...generic, id: 'battleModeRecent', innerHTML: '' },
      battleModeUndoBar: { ...generic, id: 'battleModeUndoBar', textContent: '', classList: { add() {}, remove() {}, toggle() {} } },
      battleModeQuitArea: { ...generic, id: 'battleModeQuitArea', innerHTML: '' },
      battleModeToast: { ...generic, id: 'battleModeToast', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} } },
      dynamicFields: { ...generic, id: 'dynamicFields', innerHTML: '' },
      flowStepTabs: { ...generic, id: 'flowStepTabs', innerHTML: '' },
      currentContextBar: { ...generic, id: 'currentContextBar', innerHTML: '' },
      endLogBox: { ...generic, id: 'endLogBox', innerHTML: '' },
      practiceStatsBox: { ...generic, id: 'practiceStatsBox', innerHTML: '' },
      carrySummaryBox: { ...generic, id: 'carrySummaryBox', innerHTML: '' },
      timelineList: { ...generic, id: 'timelineList', innerHTML: '' },
      timelineHistoryBox: { ...generic, id: 'timelineHistoryBox', classList: { add() {}, remove() {}, toggle() {} } },
      timelineHistoryCount: { ...generic, id: 'timelineHistoryCount', textContent: '' },
      suggestLogList: { ...generic, id: 'suggestLogList', innerHTML: '' },
      pendingSuggestBox: { ...generic, id: 'pendingSuggestBox', innerHTML: '' },
      storeSelect: { ...generic, id: 'storeSelect', innerHTML: '' },
      moneyRegistrationStatus: { ...generic, id: 'moneyRegistrationStatus', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} } },
      moneyEndMedalsLinkHint: { ...generic, id: 'moneyEndMedalsLinkHint', textContent: '' },
      moneyDate: { ...generic, id: 'moneyDate', value: '2026-07-29' },
      moneyStore: { ...generic, id: 'moneyStore', value: 'STORE_ALPHA' },
      moneyMachineNo: { ...generic, id: 'moneyMachineNo', value: '948' },
      publishStore: { ...generic, id: 'publishStore', checked: false },
      publishMachineNo: { ...generic, id: 'publishMachineNo', checked: false },
      moneyStart: { ...generic, id: 'moneyStart', value: '10:00' },
      moneyEnd: { ...generic, id: 'moneyEnd', value: '' },
      moneyStartMedals: { ...generic, id: 'moneyStartMedals', value: '0' },
      moneyEndMedals: { ...generic, id: 'moneyEndMedals', value: '', dataset: {}, addEventListener() {} },
      moneyCashIn: { ...generic, id: 'moneyCashIn', value: '' },
      calcWork: { ...generic, id: 'calcWork', textContent: '' },
      calcDiff: { ...generic, id: 'calcDiff', textContent: '' },
      calcBalance: { ...generic, id: 'calcBalance', textContent: '' },
      calcHourly: { ...generic, id: 'calcHourly', textContent: '' },
      rateHint: { ...generic, id: 'rateHint', textContent: '' },
      timeWarning: { ...generic, id: 'timeWarning', style: {} },
      startMoneyDate: { ...generic, id: 'startMoneyDate', value: '' },
      startMoneyStore: { ...generic, id: 'startMoneyStore', value: '' },
      startPublishStore: { ...generic, id: 'startPublishStore', checked: false },
      startMoneyMachineNo: { ...generic, id: 'startMoneyMachineNo', value: '' },
      startPublishMachineNo: { ...generic, id: 'startPublishMachineNo', checked: false },
      startMoneyStart: { ...generic, id: 'startMoneyStart', value: '' }
    };
    document.getElementById = id => elements[id] || generic;
    document.querySelector = selector => selector === '#battleModeOtherSheet .bm-sheet-title' ? generic : null;
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentFlowStep = 2;
    battleModeOpen = true;
    currentStartCounterGame = 117;
    currentStartCounterEdited = true;
    setManualCorrectionForLiquid(222, 213);
    setTimelineGames(222, 213);
    moneyEndMedalsEdited = false;
    return { elements };
    })();
  `;
}

function testBattleModeQuitOnlyRecordsEndLogAndUndo() {
  const { context } = runRecord(undefined);
  const result = JSON.parse(vm.runInContext(`
    const setup = ${battleModeQuitDomScript()}
    battleModeQuitOnly();
    const afterRecord = {
      battleModeOpen,
      currentFlowStep,
      endGame: currentEndLog && currentEndLog.game,
      endLiquid: currentEndLog && currentEndLog.liquidGame,
      undoCount: battleModeUndoStack.length
    };
    undoBattleModeLast();
    JSON.stringify({ afterRecord, afterUndo: { endLog: currentEndLog, undoCount: battleModeUndoStack.length } });
  `, context));
  assert.deepEqual(result.afterRecord, {
    battleModeOpen: true,
    currentFlowStep: 2,
    endGame: 222,
    endLiquid: 213,
    undoCount: 1
  });
  assert.equal(result.afterUndo.endLog, null);
  assert.equal(result.afterUndo.undoCount, 0);
}

function testBattleModeQuitAndGoMoneyAppliesCreditLink() {
  const { context } = runRecord(undefined);
  const result = JSON.parse(vm.runInContext(`
    const setup = ${battleModeQuitDomScript()}
    currentIntervalEstimate = normalizeIntervalEstimate({
      initialDiff: null,
      certainty: 'unknown',
      investedTotal: 0,
      credit: 166,
      history: [
        { id: 'idh_credit_quit', at: '2026-07-29T10:30:00.000Z', mode: 'credit', label: 'クレジット更新', input: 166, before: { investedTotal: 0, credit: 0 }, after: { investedTotal: 0, credit: 166 }, summary: 'クレジット更新 0 → 166' }
      ]
    });
    battleModeQuitAndGoMoney();
    JSON.stringify({
      battleModeOpen,
      currentFlowStep,
      endGame: currentEndLog && currentEndLog.game,
      endLiquid: currentEndLog && currentEndLog.liquidGame,
      moneyEnd: setup.elements.moneyEnd.value,
      moneyEndMedals: setup.elements.moneyEndMedals.value,
      linkHint: setup.elements.moneyEndMedalsLinkHint.textContent,
      undoCount: battleModeUndoStack.length
    });
  `, context));
  assert.equal(result.battleModeOpen, false);
  assert.equal(result.currentFlowStep, 4);
  assert.equal(result.endGame, 222);
  assert.equal(result.endLiquid, 213);
  assert.notEqual(result.moneyEnd, '');
  assert.equal(result.moneyEndMedals, '166');
  assert.notEqual(result.linkHint, '');
  assert.equal(result.undoCount, 1);
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
  assert.match(grid, /当選・ヤメ・その他 ▼/);
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
  assert.match(grid, /当選・ヤメ・その他 ▼/);
  assert.match(grid, /さざなみ\s+前兆/);
  const style = extractStyle();
  assert.match(style, /\.bm-grid\{[^}]*align-content:start/);
  assert.match(style, /\.bm-quit-area\{[^}]*display:none/);
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

function testDraftRestoreKeepsPostHitBattleContext() {
  const hitAt = '2026-07-21T10:00:00.000Z';
  const creditAt = '2026-07-21T10:01:00.000Z';
  const seed = {
    version: 1,
    machines: [],
    stores: [],
    logs: [],
    shopNotes: [],
    shopNoteCards: [],
    draftLog: {
      id: 'draft_post_hit',
      sessionId: 's_post_hit',
      schemaVersion: 6,
      machineId: 'm_nangoku_special',
      aimId: 'aim_reset',
      machineName: 'L南国育ちSPECIAL',
      aimName: 'リセット狙い',
      flowStep: 2,
      status: 'active',
      state4Registered: false,
      finalized: false,
      excludeFromStats: true,
      startCounterGame: 117,
      suikaOffset: 0,
      manualCorrection: 9,
      timeline: [
        { id: 'tl_after_hit', game: 47, liquidGame: 38, text: 'リプレイフラッシュ', tagIds: ['t_nangoku_replay_flash'], countAs: [], createdAt: '2026-07-21T10:02:00.000Z' }
      ],
      hitEvents: [
        { id: 'he_bonus', trigger: 'at', dataGame: 177, liquidGame: 168, createdAt: hitAt, wizardDone: true }
      ],
      hitBranchWizard: { route: '', stepIndex: 0, done: [], eventId: 'he_bonus' },
      intervalEstimate: {
        initialDiff: null,
        certainty: 'unknown',
        loanRate: 46,
        investedTotal: 0,
        credit: 166,
        history: [
          { id: 'idh_credit', at: creditAt, mode: 'credit', label: 'クレジット更新', input: 166, before: { investedTotal: 0, credit: 0 }, after: { investedTotal: 0, credit: 166 }, summary: 'クレジット更新 0 → 166' }
        ]
      },
      segments: [],
      suggestLog: [],
      money: { date: '2026-07-21', store: 'STORE_ALPHA', machineNo: '948' }
    }
  };
  const { context } = runRecord(JSON.stringify(seed));
  vm.runInContext("loadDraftIntoInputs(db.draftLog)", context);

  assert.equal(vm.runInContext('currentTimelineDataGame', context), 47);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 38);
  assert.equal(vm.runInContext('battleModeCurrentSegmentLiquidGames()', context), 38);
  assert.equal(vm.runInContext("battleModeCreditUpdateButtonClass()", context), ' credit-ok');
  assert.equal(vm.runInContext("latestHitBeforeCurrent().id", context), 'he_bonus');
  assert.equal(vm.runInContext("battleModeReplayFlashMeterText()", context), 'リプフラ 1／38G（1/38）');
}

function testDraftRestoreFallsBackToLatestHitBeforeStartCounter() {
  const seed = {
    version: 1,
    machines: [],
    stores: [],
    logs: [],
    shopNotes: [],
    shopNoteCards: [],
    draftLog: {
      id: 'draft_post_hit_empty_timeline',
      sessionId: 's_post_hit_empty_timeline',
      schemaVersion: 6,
      machineId: 'm_nangoku_special',
      aimId: 'aim_reset',
      machineName: 'L南国育ちSPECIAL',
      aimName: 'リセット狙い',
      flowStep: 2,
      status: 'active',
      startCounterGame: 117,
      suikaOffset: 0,
      manualCorrection: 9,
      timeline: [],
      hitEvents: [
        { id: 'he_bonus_old', trigger: 'at', dataGame: 177, liquidGame: 168, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: true }
      ],
      intervalEstimate: null,
      segments: [],
      suggestLog: [],
      money: { date: '2026-07-21', store: 'STORE_ALPHA', machineNo: '948' }
    }
  };
  const { context } = runRecord(JSON.stringify(seed));
  vm.runInContext("loadDraftIntoInputs(db.draftLog)", context);

  assert.equal(vm.runInContext('currentTimelineDataGame', context), 177);
  assert.equal(vm.runInContext('timelineLiquidValue()', context), 168);
}

function testDraftRestoreKeepsCounterOnlyGameProgress() {
  const { context, localStorage } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentFlowStep = 2;
    battleModeOpen = true;
    currentStartCounterGame = 117;
    currentStartCounterEdited = true;
    resetTimelineOffsets(0, 0);
    setTimelineGames(0, 0);
    currentHitEvents = [normalizeHitEvent({ id: 'he_counter_only', trigger: 'at', dataGame: 0, liquidGame: 0, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: true })];
    battleModeIncrementGame(3);
    battleModeIncrementGame(3);
    battleModeIncrementGame(3);
  `, context);
  const stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  assert.deepEqual(stored.draftLog.timelineCounterState, { dataGame: 9, liquidGame: 9 });
  assert.equal(stored.draftLog.timeline.length, 0);

  const restored = runRecord(JSON.stringify(stored));
  vm.runInContext('loadDraftIntoInputs(db.draftLog)', restored.context);
  assert.equal(vm.runInContext('currentTimelineDataGame', restored.context), 9);
  assert.equal(vm.runInContext('timelineLiquidValue()', restored.context), 9);
}

function testBattleModeLiquidCounterNeverRestoresNegative() {
  const { context, localStorage } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentFlowStep = 2;
    battleModeOpen = true;
    currentStartCounterGame = 117;
    currentStartCounterEdited = true;
    resetTimelineOffsets(9, 0);
    setTimelineGames(0, 0);
    currentHitEvents = [normalizeHitEvent({ id: 'he_butterfly', trigger: 'at', dataGame: 0, liquidGame: 0, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: true })];
    battleModeIncrementGame(5);
  `, context);
  const stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  assert.deepEqual(stored.draftLog.timelineCounterState, { dataGame: 5, liquidGame: 0 });

  const restored = runRecord(JSON.stringify(stored));
  vm.runInContext('loadDraftIntoInputs(db.draftLog)', restored.context);
  assert.equal(vm.runInContext('currentTimelineDataGame', restored.context), 5);
  assert.equal(vm.runInContext('timelineLiquidValue()', restored.context), 0);
  assert.equal(vm.runInContext('liquidFromDataWithOffset(5, 9, currentMachine())', restored.context), 0);
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

function battleModeStateSeed() {
  return {
    version: 1,
    machines: [{
      id: 'm_state_test',
      name: '状態テスト機',
      maker: '',
      aims: [{ id: 'aim_state', name: '状態確認', fields: [] }],
      tags: [
        { id: 't_state_high_start', label: '高確 開始', optional: false, countAs: null },
        { id: 't_state_high_end', label: '高確 終了', optional: false, countAs: null },
        { id: 't_state_cz_start', label: '無名CZ 開始', optional: false, countAs: null },
        { id: 't_state_cz_end', label: '無名CZ 終了', optional: false, countAs: null }
      ],
      startTags: [],
      labelTags: [],
      states: [
        { id: 'high', label: '高確', startTagId: 't_state_high_start', endTagId: 't_state_high_end' },
        { id: 'cz_mumei', label: '無名CZ', startTagId: 't_state_cz_start', endTagId: 't_state_cz_end', endOptions: [{ key: 'success', label: '成功' }, { key: 'fail', label: '失敗' }] }
      ],
      quickPanel: { counters: [], gainButtons: [1, 3, 5, 10], events: [{ type: 'picker', ref: 'state' }] },
      suggestMaster: []
    }],
    stores: [],
    logs: []
  };
}

function installBattleModeStateDom(context) {
  vm.runInContext(`
    const generic = document.getElementById('generic');
    const elements = {
      battleModeOtherSheet: { ...generic, id: 'battleModeOtherSheet', classList: { add() {}, remove() {}, toggle() {} } },
      battleModeOtherGrid: { ...generic, id: 'battleModeOtherGrid', innerHTML: '' },
      battleModeStateBadges: { ...generic, id: 'battleModeStateBadges', innerHTML: '' },
      battleModeToast: { ...generic, id: 'battleModeToast', innerHTML: '', classList: { add() {}, remove() {}, toggle() {} } },
      suggestPickerOverlay: { ...generic, id: 'suggestPickerOverlay', classList: { add() {}, remove() {}, toggle() {} } },
      suggestPickerTitle: { ...generic, id: 'suggestPickerTitle', textContent: '', classList: { add() {}, remove() {}, toggle() {} } },
      suggestPickerBreadcrumb: { ...generic, id: 'suggestPickerBreadcrumb', textContent: '' },
      suggestPickerOptions: { ...generic, id: 'suggestPickerOptions', innerHTML: '' },
      suggestPickerBackButton: { ...generic, id: 'suggestPickerBackButton', textContent: '' },
      timelineList: { ...generic, id: 'timelineList', innerHTML: '' },
      timelineHistoryBox: { ...generic, id: 'timelineHistoryBox', classList: { add() {}, remove() {}, toggle() {} } },
      timelineHistoryCount: { ...generic, id: 'timelineHistoryCount', textContent: '' },
      suggestLogList: { ...generic, id: 'suggestLogList', innerHTML: '' },
      carrySummaryBox: { ...generic, id: 'carrySummaryBox', innerHTML: '' },
      practiceStatsBox: { ...generic, id: 'practiceStatsBox', innerHTML: '' }
    };
    document.getElementById = id => elements[id] || generic;
    document.querySelector = selector => selector === '#battleModeOtherSheet .bm-sheet-title' ? generic : null;
    selectedMachineId = 'm_state_test';
    selectedAimId = 'aim_state';
    currentFlowStep = 2;
    battleModeOpen = true;
    setTimelineGames(100, 100);
    globalThis.__stateElements = elements;
  `, context);
}

function testBattleModeStatePickerTogglesAndRestoresFromTimeline() {
  const { context, localStorage } = runRecord(JSON.stringify(battleModeStateSeed()));
  installBattleModeStateDom(context);

  assert.equal(vm.runInContext("currentMachine().states.length", context), 2);
  assert.equal(vm.runInContext("normalizeQuickPanel(currentMachine().quickPanel).events[0].ref", context), 'state');
  vm.runInContext('openBattleModeStatePicker()', context);
  let html = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  assert.match(html, /高確 開始/);
  assert.doesNotMatch(html, /高確 終了/);

  vm.runInContext("battleModeRecordState('high','start')", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(battleModeActiveStates().map(state => state.id))", context)), ['high']);
  assert.match(vm.runInContext('renderBattleModeStateBadges()', context), /高確/);
  vm.runInContext('openBattleModeStatePicker()', context);
  html = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  assert.match(html, /高確 終了/);
  assert.doesNotMatch(html, /高確 開始/);

  const stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  const restored = runRecord(JSON.stringify(stored));
  vm.runInContext("loadDraftIntoInputs(db.draftLog); selectedMachineId = 'm_state_test'; selectedAimId = 'aim_state';", restored.context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(battleModeActiveStates().map(state => state.id))", restored.context)), ['high']);

  vm.runInContext("battleModeRecordState('high','end')", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(battleModeActiveStates().map(state => state.id))", context)), []);
}

function testBattleModeStateEndOptionsUseEndTagWithoutHitFlow() {
  const { context } = runRecord(JSON.stringify(battleModeStateSeed()));
  installBattleModeStateDom(context);
  vm.runInContext("battleModeRecordState('cz_mumei','start')", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(battleModeActiveStates().map(state => state.id))", context)), ['cz_mumei']);
  vm.runInContext("openBattleModeStateEndPicker('cz_mumei')", context);
  const html = vm.runInContext("__stateElements.battleModeOtherGrid.innerHTML", context);
  assert.match(html, /無名CZ 成功/);
  vm.runInContext("battleModeRecordState('cz_mumei','end','success')", context);
  assert.equal(vm.runInContext('currentTimeline.at(-1).text', context), '無名CZ 成功');
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(currentTimeline.at(-1).tagIds)", context)), ['t_state_cz_end']);
  assert.equal(vm.runInContext('currentHitEvents.length', context), 0);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(battleModeActiveStates().map(state => state.id))", context)), []);
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

function testBattleModeInvestmentResetUsesHistoryBoundaryAndUndo() {
  const { context } = runRecord(undefined, [true]);
  vm.runInContext(`
    selectedMachineId = 'm_nangoku_special';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    battleModeOpen = true;
    currentFlowStep = 2;
    currentIntervalEstimate = normalizeIntervalEstimate({ initialDiff: null, loanRate: 46 });
    battleModeApplyDiffTrackerInput('investMedals', 100);
    battleModeApplyDiffTrackerInput('investYen', 19);
    battleModeResetInvestment();
  `, context);

  assert.equal(vm.runInContext('currentIntervalEstimate.investedTotal', context), 0);
  assert.equal(vm.runInContext("currentIntervalEstimate.history.at(-1).mode", context), 'resetInvest');
  assert.equal(vm.runInContext('battleModeCashInvestUnits()', context), 0);
  assert.equal(vm.runInContext('battleModeCashInvestMedals()', context), 0);
  assert.match(vm.runInContext('battleModeInvestmentResetReferenceText()', context), /メダル 100枚/);
  assert.match(vm.runInContext('battleModeInvestmentResetReferenceText()', context), /現金 19千円/);

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentIntervalEstimate.investedTotal', context), 974);
  assert.equal(vm.runInContext('battleModeCashInvestUnits()', context), 19);

  vm.runInContext(`
    redoBattleModeUndo();
    battleModeApplyDiffTrackerInput('investMedals', 100);
    battleModeApplyDiffTrackerInput('investYen', 9);
  `, context);
  assert.deepEqual(JSON.parse(vm.runInContext(`JSON.stringify((()=>{
    const parts=battleModeInvestmentBreakdownParts();
    return { investedTotal: parts.investedTotal, cashUnits: parts.cashUnits, medalInvest: parts.medalInvest };
  })())`, context)), { investedTotal: 514, cashUnits: 9, medalInvest: 100 });
  assert.equal(vm.runInContext('todayCashInvestUnits()', context), 9);
  assert.equal(vm.runInContext(`cashInvestUnitsForLog({
    intervalEstimate: {
      history: [
        { mode: 'investYen', input: 19, before: { investedTotal: 100 }, after: { investedTotal: 974 }, summary: '投資追加（千円） +19千円（+874枚）' },
        { mode: 'resetInvest', before: { investedTotal: 974 }, after: { investedTotal: 0 }, summary: '投資リセット 974枚 → 0枚' },
        { mode: 'investYen', input: 9, before: { investedTotal: 100 }, after: { investedTotal: 514 }, summary: '投資追加（千円） +9千円（+414枚）' }
      ]
    }
  })`, context), 9);
}

function testHitPayoutStepRecordsCreditAndAdoptsPayoutWithUndo() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_tokyo_ghoul';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentHitEvents = [normalizeHitEvent({ id: 'he_credit', trigger: 'at', dataGame: 100, liquidGame: 100, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: false })];
    hitBranchWizard = { route: 'atHit', stepIndex: 1, through: null, done: ['through'], eventId: 'he_credit' };
    currentIntervalEstimate = normalizeIntervalEstimate({
      initialDiff: null,
      loanRate: 46,
      investedTotal: 0,
      credit: 222,
      history: [
        { id: 'idh_base', at: '2026-07-21T09:59:00.000Z', mode: 'credit', label: 'クレジット更新', input: 222, before: { investedTotal: 0, credit: 0 }, after: { investedTotal: 0, credit: 222 }, summary: 'クレジット更新 0 → 222' }
      ]
    });
    const generic = document.getElementById('generic');
    const input = { ...generic, value: '563' };
    const overlay = { ...generic, classList: { add() {}, remove() {}, toggle() {} } };
    document.getElementById = id => id === 'hitPayoutInput' ? input : id === 'hitPayoutOverlay' ? overlay : generic;
    submitHitEventPayout();
  `, context);

  assert.equal(vm.runInContext('currentIntervalEstimate.credit', context), 563);
  assert.equal(vm.runInContext('currentIntervalEstimate.history.length', context), 2);
  assert.equal(vm.runInContext('currentHitEvents[0].payout', context), 341);
  assert.equal(vm.runInContext('battleModeCreditUpdateButtonClass()', context), ' credit-ok');
  assert.match(vm.runInContext('battleModeUndoStack.at(-1).label', context), /ボーナス後クレジット/);

  vm.runInContext('undoBattleModeLast()', context);
  assert.equal(vm.runInContext('currentIntervalEstimate.credit', context), 222);
  assert.equal(vm.runInContext('currentIntervalEstimate.history.length', context), 1);
  assert.equal(vm.runInContext('currentHitEvents[0].payout', context), null);
  assert.equal(vm.runInContext('battleModeCreditUpdateButtonClass()', context), ' credit-warn');
}

function testHitPayoutStepDoesNotDuplicateSameCreditHistory() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_tokyo_ghoul';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentHitEvents = [normalizeHitEvent({ id: 'he_same_credit', trigger: 'at', dataGame: 100, liquidGame: 100, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: false })];
    hitBranchWizard = { route: 'atHit', stepIndex: 1, through: null, done: ['through'], eventId: 'he_same_credit' };
    currentIntervalEstimate = normalizeIntervalEstimate({
      initialDiff: null,
      loanRate: 46,
      investedTotal: 0,
      credit: 563,
      history: [
        { id: 'idh_base', at: '2026-07-21T09:59:00.000Z', mode: 'credit', label: 'クレジット更新', input: 222, before: { investedTotal: 0, credit: 0 }, after: { investedTotal: 0, credit: 222 }, summary: 'クレジット更新 0 → 222' },
        { id: 'idh_after', at: '2026-07-21T10:01:00.000Z', mode: 'credit', label: 'クレジット更新', input: 563, before: { investedTotal: 0, credit: 222 }, after: { investedTotal: 0, credit: 563 }, summary: 'クレジット更新 222 → 563' }
      ]
    });
    const generic = document.getElementById('generic');
    const input = { ...generic, value: '563' };
    const overlay = { ...generic, classList: { add() {}, remove() {}, toggle() {} } };
    document.getElementById = id => id === 'hitPayoutInput' ? input : id === 'hitPayoutOverlay' ? overlay : generic;
    submitHitEventPayout();
  `, context);

  assert.equal(vm.runInContext('currentIntervalEstimate.history.length', context), 2);
  assert.equal(vm.runInContext('currentHitEvents[0].payout', context), 341);
  assert.match(vm.runInContext('battleModeUndoStack.at(-1).label', context), /獲得枚数採用/);
}

function testHitPayoutCreditInputSelectsAndClears() {
  const { context } = runRecord(undefined);
  const result = JSON.parse(vm.runInContext(`
    selectedMachineId = 'm_tokyo_ghoul';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentHitEvents = [normalizeHitEvent({ id: 'he_credit_select', trigger: 'at', dataGame: 100, liquidGame: 100, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: false })];
    hitBranchWizard = { route: 'atHit', stepIndex: 1, through: null, done: ['through'], eventId: 'he_credit_select' };
    currentIntervalEstimate = normalizeIntervalEstimate({ initialDiff: null, loanRate: 46, investedTotal: 0, credit: 563, history: [] });
    const generic = document.getElementById('generic');
    let focused = 0;
    let selected = 0;
    const input = { ...generic, value: '', focus() { focused += 1; }, select() { selected += 1; } };
    const overlay = { ...generic, classList: { add() { this.opened = true; }, remove() {}, toggle() {} } };
    document.getElementById = id => id === 'hitPayoutInput' ? input : id === 'hitPayoutOverlay' ? overlay : generic;
    promptHitEventPayout();
    const afterPrompt = { value: input.value, focused, selected };
    clearHitPayoutCreditInput();
    JSON.stringify({ afterPrompt, afterClear: { value: input.value, focused, selected } });
  `, context));
  assert.deepEqual(result.afterPrompt, { value: '563', focused: 1, selected: 1 });
  assert.deepEqual(result.afterClear, { value: '', focused: 2, selected: 1 });
}

function testNumericKeypadReplaceOnNextDigit() {
  const { context } = runRecord(undefined);
  const value = vm.runInContext(`
    const input = { value: '563', dataset: { replaceOnNextDigit: '1' } };
    activeNumericInput = input;
    pressKeypad('7');
    pressKeypad('8');
    input.value;
  `, context);
  assert.equal(value, '78');
}

function testHitPayoutStepRecordsCreditOnlyWithoutBaseCredit() {
  const { context } = runRecord(undefined);
  vm.runInContext(`
    selectedMachineId = 'm_tokyo_ghoul';
    selectedAimId = firstAimIdForMachine(currentMachine()) || '';
    currentHitEvents = [normalizeHitEvent({ id: 'he_no_base', trigger: 'at', dataGame: 100, liquidGame: 100, createdAt: '2026-07-21T10:00:00.000Z', wizardDone: false })];
    hitBranchWizard = { route: 'atHit', stepIndex: 1, through: null, done: ['through'], eventId: 'he_no_base' };
    currentIntervalEstimate = normalizeIntervalEstimate({ initialDiff: null, loanRate: 46, investedTotal: 0, credit: 0, history: [] });
    const generic = document.getElementById('generic');
    const input = { ...generic, value: '563' };
    const overlay = { ...generic, classList: { add() {}, remove() {}, toggle() {} } };
    document.getElementById = id => id === 'hitPayoutInput' ? input : id === 'hitPayoutOverlay' ? overlay : generic;
    submitHitEventPayout();
  `, context);

  assert.equal(vm.runInContext('currentIntervalEstimate.credit', context), 563);
  assert.equal(vm.runInContext('currentIntervalEstimate.history.length', context), 1);
  assert.equal(vm.runInContext('currentHitEvents[0].payout', context), null);
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
  assert.match(usageBanner.innerHTML, /保存に失敗する可能性/);
  assert.match(usageBanner.innerHTML, /空き容量を確保/);
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
  assert.notEqual(localStorage.getItem('nerai_record_v1'), raw);
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
  vm.runInContext(`
    db.shopNoteFavorites[''] = ['snt_result_bonus', 'snt_mode_normal_b'];
    db.shopNoteCards[0].entries.push({
      id: 'sne_old_generic',
      at: '2026-07-21T10:05:00.000Z',
      tagIds: ['snt_result_bonus'],
      tagLabels: ['ボーナス当選'],
      text: ''
    });
  `, context);
  const paletteHtml = vm.runInContext("renderShopNotePalette(db.shopNoteCards[0])", context);
  assert.equal(paletteHtml.includes('ボーナス当選'), false);
  assert.equal(paletteHtml.includes('通常B'), true);
  assert.match(vm.runInContext("renderShopNoteEntry(db.shopNoteCards[0].entries[1], db.shopNoteCards[0])", context), /ボーナス当選/);
}

function testShopNoteTagLabelsNormalizeAsPairs() {
  const { context } = runRecord(undefined);
  const normalize = entry => JSON.parse(vm.runInContext(`JSON.stringify(normalizeShopNoteEntry(${JSON.stringify(entry)}))`, context));

  const partialMissing = normalize({
    id: 'sne_pair_partial',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['snt_mode_normal_b', 'unknown_x', 'snt_other_follow'],
    tagLabels: ['L1', '', 'L2'],
    text: ''
  });
  assert.deepEqual(partialMissing.tagIds, ['snt_mode_normal_b', 'snt_other_follow']);
  assert.deepEqual(partialMissing.tagLabels, ['L1', 'L2']);
  assert.equal(partialMissing.tagIds.length, partialMissing.tagLabels.length);

  const unknownWithLabel = normalize({
    id: 'sne_pair_unknown',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['unknown_a', 'snt_mode_normal_b'],
    tagLabels: ['LA', ''],
    text: ''
  });
  assert.deepEqual(unknownWithLabel.tagIds, ['unknown_a', 'snt_mode_normal_b']);
  assert.deepEqual(unknownWithLabel.tagLabels, ['LA', '']);
  assert.equal(vm.runInContext(`renderShopNoteEntry(${JSON.stringify(unknownWithLabel)}, {machineId:''})`, context).includes('LA'), true);
  assert.equal(vm.runInContext(`renderShopNoteEntry(${JSON.stringify(unknownWithLabel)}, {machineId:''})`, context).includes('通常B'), true);

  const compressedOldBug = normalize({
    id: 'sne_pair_compressed',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['snt_mode_normal_b', 'unknown_b'],
    tagLabels: ['LB'],
    text: ''
  });
  assert.deepEqual(compressedOldBug.tagIds, ['snt_mode_normal_b']);
  assert.deepEqual(compressedOldBug.tagLabels, ['']);

  assert.equal(normalize({
    id: 'sne_pair_drop_null',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['unknown_c'],
    tagLabels: [''],
    text: ''
  }), null);
  const textOnly = normalize({
    id: 'sne_pair_text_only',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['unknown_c'],
    tagLabels: [''],
    text: '自由記述だけ'
  });
  assert.deepEqual(textOnly.tagIds, []);
  assert.deepEqual(textOnly.tagLabels, []);
  assert.equal(textOnly.text, '自由記述だけ');

  const allLabels = normalize({
    id: 'sne_pair_all_labels',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['snt_mode_normal_b', 'snt_other_follow'],
    tagLabels: ['通常Bメモ', 'フォロー候補メモ'],
    text: ''
  });
  assert.deepEqual(allLabels.tagLabels, ['通常Bメモ', 'フォロー候補メモ']);
  const noLabels = normalize({
    id: 'sne_pair_no_labels',
    at: '2026-07-21T10:00:00.000Z',
    tagIds: ['snt_mode_normal_b', 'snt_other_follow'],
    tagLabels: [],
    text: ''
  });
  assert.deepEqual(noLabels.tagIds, ['snt_mode_normal_b', 'snt_other_follow']);
  assert.deepEqual(noLabels.tagLabels, ['', '']);

  const idempotent = normalize(allLabels);
  assert.deepEqual(idempotent, allLabels);
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

function testShopNoteModalFollowsOpenedCardDate() {
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [{
    id: 'snc_0721_949',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:10:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '949',
    machineId: 'm_nangoku_special',
    entries: []
  }, {
    id: 'snc_today',
    createdAt: `${todayText}T10:00:00.000Z`,
    updatedAt: `${todayText}T10:00:00.000Z`,
    date: todayText,
    store: 'STORE_ALPHA',
    machineNo: '777',
    machineId: '',
    entries: []
  }];
  const { context } = runRecord(JSON.stringify(seed), [true]);

  vm.runInContext(`
    db.draftLog = { money: { date: '${todayText}' } };
    selectedMachineId = 'm_nangoku_special';
    let selectedShopNoteNewDate = '';
    const elements = {
      shopNoteTitle: { textContent: '' },
      shopNoteStoreLabel: { textContent: '' },
      shopNoteBody: { innerHTML: '' },
      shopNoteNewStoreText: { value: '' },
      shopNoteNewStoreSelect: { value: '' },
      shopNoteNewMachineSelect: { value: '' },
      shopNoteNewMachineNo: { value: '951' },
      logsList: { innerHTML: '' }
    };
    const overlay = {
      scrollTop: 99,
      classList: { add(name) { this.added = name; }, remove() {} },
      querySelector() { return { scrollTop: 88, scrollIntoView() {} }; }
    };
    const generic = {
      innerHTML: '',
      textContent: '',
      value: '',
      classList: { add() {}, remove() {}, toggle() {} },
      style: {},
      closest() { return { style: {}, nextElementSibling: { classList: { contains() { return false; } }, style: {} } }; },
      querySelector() { return null; },
      scrollIntoView() {}
    };
    document.getElementById = id => id === 'shopNoteOverlay' ? overlay : (elements[id] || generic);
    document.querySelector = selector => selector === 'input[name="shopNoteNewDate"]:checked' && selectedShopNoteNewDate ? { value: selectedShopNoteNewDate } : null;
    requestAnimationFrame = fn => fn();
  `, context);

  vm.runInContext("openShopNoteModal('snc_0721_949');", context);
  assert.equal(vm.runInContext("shopNoteViewDate", context), '2026-07-21');
  assert.match(vm.runInContext("document.getElementById('shopNoteStoreLabel').textContent", context), /2026-07-21 \/ 店舗: STORE_ALPHA \/ 機種: L南国育ちSPECIAL/);
  assert.match(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), new RegExp(`今日\\(${todayText}\\)`));
  assert.match(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /表示中\(2026-07-21\)/);
  assert.match(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /台949/);
  assert.doesNotMatch(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /台777/);
  vm.runInContext("createShopNoteCard();", context);
  assert.equal(vm.runInContext("db.shopNoteCards.find(card => card.machineNo === '951').date", context), todayText);
  assert.equal(vm.runInContext("shopNoteViewDate", context), todayText);
  assert.match(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /台951/);

  vm.runInContext("openShopNoteModal('snc_0721_949'); selectedShopNoteNewDate = '2026-07-21'; document.getElementById('shopNoteNewMachineNo').value = '952'; createShopNoteCard();", context);
  assert.equal(vm.runInContext("db.shopNoteCards.find(card => card.machineNo === '952').date", context), '2026-07-21');
  assert.equal(vm.runInContext("shopNoteViewDate", context), '2026-07-21');

  vm.runInContext("openShopNoteModal();", context);
  assert.equal(vm.runInContext("shopNoteViewDate", context), todayText);
  assert.match(vm.runInContext("document.getElementById('shopNoteStoreLabel').textContent", context), new RegExp(`${todayText} / 店舗: 店舗未設定 / 機種: L南国育ちSPECIAL`));
  assert.doesNotMatch(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /shopNoteNewDate/);
  assert.match(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /台777/);
  assert.doesNotMatch(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /台949/);

  vm.runInContext(`db.shopNoteCards = db.shopNoteCards.filter(card => card.date !== '${todayText}'); renderShopNoteSheet();`, context);
  assert.match(vm.runInContext("document.getElementById('shopNoteBody').innerHTML", context), /この日の他台カードはまだありません/);
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
  const realTags = palette.tags.filter(tag => tag.type !== 'divider');
  const tagIds = realTags.map(tag => tag.id);
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
  assert.equal(realTags.slice(0, 9).every(tag => tag.categoryId === 'sntc_mode'), true);
  assert.deepEqual(realTags.slice(0, 9).map(tag => tag.label), [
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
  assert.deepEqual(realTags.slice(0, 9).map(tag => tag.color), ['purple', 'red', 'rainbow', 'gray', 'gray', 'blue', 'green', 'red', 'rainbow']);
  assert.equal(realTags.some(tag => tag.hollow), false);
  assert.equal(palette.tags.filter(tag => tag.type === 'divider' && tag.label === 'ボーナス終了後').length, 1);
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
  assert.match(paletteHtml, /shop-note-color-emoji/);
  assert.match(paletteHtml, /🌈/);
  assert.equal(vm.runInContext("shopNoteColorValue('yellow')", context), '#eab308');
  assert.match(paletteHtml, /shop-note-palette-divider/);
  assert.match(paletteHtml, /ボーナス終了後/);
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
  const script = extractScript();
  assert.match(style, /\.shop-note-palette-row\{[^}]*flex-wrap:wrap/);
  assert.match(style, /\.shop-note-color-emoji\{[^}]*font-size:11px/);
  assert.match(style, /\.shop-note-badge-high\{[^}]*width:14px/);
  assert.match(style, /\.shop-note-badge-high\.strong\{[^}]*background:#c9a84c/);
  assert.doesNotMatch(style.match(/\.shop-note-palette-row\{[^}]*\}/)[0], /overflow-x:auto/);
  assert.match(style, /\.shop-note-body\{[^}]*overscroll-behavior:contain/);
  assert.match(style, /#shopNoteOverlay\{[^}]*overscroll-behavior:contain/);
  assert.match(script, /function scrollShopNoteSelectedCategoryIntoView\(\)/);
  assert.match(script, /labelRect\.top-bodyRect\.top/);
  assert.match(script, /requestAnimationFrame\(scrollShopNoteSelectedCategoryIntoView\)/);
  const { context } = runRecord(undefined);
  const unregistered = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine(''))", context));
  const unknown = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine('m_unknown_machine'))", context));
  const tokyo = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine('m_tokyo_ghoul'))", context));
  const unregisteredRealTags = unregistered.tags.filter(tag => tag.type !== 'divider');
  assert.deepEqual(unregistered.categories.map(category => category.label), ['モード示唆', '設定示唆', 'トロフィー', 'その他']);
  assert.equal(unregisteredRealTags.length, 16);
  assert.deepEqual(unregisteredRealTags.map(tag => tag.id), [
    'snt_mode_normal_a', 'snt_mode_normal_b', 'snt_mode_chance', 'snt_mode_heaven',
    'snt_setting_even', 'snt_setting_odd', 'snt_setting_high_weak', 'snt_setting_high_strong',
    'snt_trophy_bronze', 'snt_trophy_silver', 'snt_trophy_gold', 'snt_trophy_kirin', 'snt_trophy_rainbow',
    'snt_other_attention', 'snt_other_follow', 'snt_other_memo'
  ]);
  assert.deepEqual(unknown, unregistered);
  assert.equal(unregisteredRealTags.filter(tag => tag.color || tag.badge).length, 8);
  assert.deepEqual({
    blue: unregisteredRealTags.filter(tag => tag.color === 'blue').length,
    green: unregisteredRealTags.filter(tag => tag.color === 'green').length,
    purple: unregisteredRealTags.filter(tag => tag.color === 'purple').length,
    gray: unregisteredRealTags.filter(tag => tag.color === 'gray').length,
    gold: unregisteredRealTags.filter(tag => tag.color === 'gold').length,
    rainbow: unregisteredRealTags.filter(tag => tag.color === 'rainbow').length,
    highWeak: unregisteredRealTags.filter(tag => tag.badge === 'high' && !tag.badgeStrong).length,
    highStrong: unregisteredRealTags.filter(tag => tag.badge === 'high' && tag.badgeStrong).length
  }, {blue: 1, green: 1, purple: 1, gray: 1, gold: 1, rainbow: 1, highWeak: 1, highStrong: 1});
  assert.equal(unregistered.tags.some(tag => tag.hollow), false);
  assert.equal(unregistered.categories.some(category => category.id === 'sntc_setting'), true);
  assert.equal(unregistered.categories.some(category => category.id === 'sntc_kuipoint'), false);
  assert.equal(tokyo.tags.some(tag => tag.color), true);
  assert.equal(tokyo.tags.some(tag => tag.id === 'snt_result_direct_at'), true);
  assert.equal(unregistered.tags.some(tag => tag.id === 'snt_mode_reset' || tag.id === 'snt_mode_same'), false);
  assert.equal(unregistered.tags.some(tag => tag.id === 'snt_reel_blue' || tag.id === 'snt_result_bonus' || tag.id === 'snt_eyecatch_default'), false);
  assert.equal(tokyo.tags.some(tag => tag.id === 'snt_mode_reset' || tag.id === 'snt_mode_same'), false);
}

function testShopNoteRemovedCommonTagsKeepSnapshotEntries() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [{
    id: 'snc_removed_common',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '101',
    machineId: 'm_tokyo_ghoul',
    entries: [{
      id: 'sne_removed_common',
      at: '2026-07-21T10:00:00.000Z',
      tagIds: ['snt_mode_reset'],
      tagLabels: ['リセット挙動'],
      text: ''
    }]
  }];
  const { context } = runRecord(JSON.stringify(seed), [true]);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagIds[0]", context), 'snt_mode_reset');
  assert.match(vm.runInContext("renderShopNoteEntry(db.shopNoteCards[0].entries[0], db.shopNoteCards[0])", context), /リセット挙動/);
  assert.match(vm.runInContext("shopNoteCardSummaryText(db.shopNoteCards[0])", context), /リセット挙動/);
}

function testShopNoteCustomTagsAreMachineScopedAndPersistent() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.machines.push({
    id: 'm_shop_note_custom_local',
    name: 'Custom Local',
    aims: [],
    tags: [],
    suggestMaster: [],
    shopNoteTagIds: [
      { custom: true, id: 'snm_m_shop_note_custom_local_upper_cz', label: '上位CZ', categoryId: 'sntc_result', color: 'red' },
      { custom: true, id: 'snm_m_other_bad', label: '他機種不正', categoryId: 'sntc_result' },
      { custom: true, id: 'snm_m_shop_note_custom_local_bad_category', label: 'カテゴリ不正', categoryId: 'bad_category' }
    ]
  });
  seed.shopNoteCards = [{
    id: 'snc_custom',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '101',
    machineId: 'm_shop_note_custom_local',
    entries: []
  }];
  const { context, localStorage } = runRecord(JSON.stringify(seed), [true]);

  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_shop_note_custom_local').tags.some(tag => tag.id === 'snm_m_shop_note_custom_local_upper_cz' && tag.label === '上位CZ' && tag.color === 'red')", context), true);
  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_shop_note_custom_local').tags.some(tag => tag.id === 'snm_m_other_bad')", context), false);
  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_nangoku_special').tags.some(tag => tag.id === 'snm_m_shop_note_custom_local_upper_cz')", context), false);
  assert.equal(vm.runInContext("shopNoteTagsForMachine('').tags.some(tag => tag.id === 'snm_m_shop_note_custom_local_upper_cz')", context), false);
  vm.runInContext("shopNoteOpenCardId = 'snc_custom'; toggleShopNoteFavorite('snm_m_shop_note_custom_local_upper_cz');", context);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(db.shopNoteFavorites.m_shop_note_custom_local)", context)), ['snm_m_shop_note_custom_local_upper_cz']);
  vm.runInContext("addShopNoteEntry('snc_custom','snm_m_shop_note_custom_local_upper_cz');", context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagIds[0]", context), 'snm_m_shop_note_custom_local_upper_cz');
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), '上位CZ');

  const reloaded = runRecord(localStorage.getItem('nerai_record_v1'));
  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_shop_note_custom_local').tags.some(tag => tag.id === 'snm_m_shop_note_custom_local_upper_cz')", reloaded.context), true);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagIds[0]", reloaded.context), 'snm_m_shop_note_custom_local_upper_cz');
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(db.shopNoteFavorites.m_shop_note_custom_local)", reloaded.context)), ['snm_m_shop_note_custom_local_upper_cz']);
}

function testShopNoteTokyoGhoulPresetUsesAllowListAndCounter() {
  const { context, localStorage } = runRecord(undefined);
  const palette = JSON.parse(vm.runInContext("JSON.stringify(shopNoteTagsForMachine('m_tokyo_ghoul'))", context));
  const realTags = palette.tags.filter(tag => tag.type !== 'divider');
  const tagIds = realTags.map(tag => tag.id);
  const labels = realTags.map(tag => tag.label);
  const dividerLabels = palette.tags.filter(tag => tag.type === 'divider').map(tag => tag.label);
  const categoryLabels = palette.categories.map(category => category.label);
  const tagsByCategory = categoryId => realTags.filter(tag => tag.categoryId === categoryId);

  assert.deepEqual(dividerLabels, [
    '✉️ 招待状',
    '🖼️ CZ終了時の1枚絵',
    '👁 アイキャッチ',
    '獲得',
    '示唆',
    '🖼️ CZ終了時の1枚絵',
    '✉️ 招待状',
    '🏆️ トロフィー'
  ]);
  assert.deepEqual(categoryLabels, ['モード示唆', '喰ポイント', '設定示唆', '結果・状態', 'その他']);
  assert.equal(realTags.length, 58);
  assert.equal(tagsByCategory('sntc_mode').length, 25);
  assert.equal(tagsByCategory('sntc_kuipoint').length, 8);
  assert.equal(tagsByCategory('sntc_setting').length, 17);
  assert.equal(tagsByCategory('sntc_result').length, 5);
  assert.equal(tagsByCategory('sntc_other').length, 3);
  assert.equal(tagsByCategory('sntc_setting').some(tag => tag.label === '🖼️鈴屋（偶数設定濃厚）'), true);
  assert.equal(tagsByCategory('sntc_setting').some(tag => tag.label === '✉️設定4以上'), true);
  assert.equal(tagsByCategory('sntc_setting').some(tag => tag.label === '🏆️虹'), true);
  assert.equal(tagsByCategory('sntc_mode').some(tag => tag.label === '✉️ディナー'), true);
  assert.equal(tagsByCategory('sntc_mode').some(tag => tag.label === '✉️パーティ'), true);
  assert.equal(tagsByCategory('sntc_mode').some(tag => tag.label === '🖼️金木A'), true);
  assert.equal(tagsByCategory('sntc_mode').some(tag => tag.label === '👁金木研（デフォ）'), true);
  assert.equal(tagsByCategory('sntc_mode').some(tag => tag.label === 'AT駆け抜け'), false);
  assert.equal(tagsByCategory('sntc_mode').some(tag => tag.label === 'AT駆け抜け以外'), false);
  assert.equal(tagsByCategory('sntc_kuipoint').some(tag => tag.label === '喰P獲得 大'), true);
  assert.equal(tagsByCategory('sntc_kuipoint').some(tag => tag.label === '喰P示唆 なし'), true);
  assert.equal(tagsByCategory('sntc_kuipoint').filter(tag => tag.color === 'green').length, 4);
  assert.equal(tagsByCategory('sntc_kuipoint').filter(tag => tag.color === 'blue').length, 4);
  assert.equal(realTags.filter(tag => tag.color).length, 36);
  assert.equal(realTags.filter(tag => tag.color && !tag.hollow).length, 32);
  assert.equal(realTags.filter(tag => tag.color && tag.hollow).length, 4);
  assert.equal(realTags.filter(tag => tag.color === 'yellow').length, 4);
  assert.equal(tagIds.filter(id => id.startsWith('snm_m_tokyo_ghoul_')).length, 3);
  assert.equal(tagIds.includes('snm_m_tokyo_ghoul_eyecatch_ghoulized'), true);
  assert.equal(tagIds.includes('snm_m_tokyo_ghoul_upper_cz'), true);
  assert.equal(tagIds.includes('snm_m_tokyo_ghoul_episode_bonus'), true);
  assert.equal(labels.includes('👁喰種化（100G以内当選濃厚）'), true);
  assert.equal(labels.includes('上位CZ'), true);
  assert.equal(labels.includes('エピソードボーナス'), true);
  assert.equal(labels.includes('🏆️銀'), true);
  assert.equal(labels.includes('🏆️金'), true);
  assert.equal(labels.includes('🏆️虹'), true);
  assert.equal(realTags.find(tag => tag.label === '👁喰種化（100G以内当選濃厚）').color, 'red');
  assert.deepEqual(
    ['🖼️霧嶋', '🖼️笛口', '🖼️亜門', '🖼️真戸', '🖼️金木&喰種', '🖼️霧嶋&喰種', '🖼️月山', '🖼️神代'].map(label => {
      const tag = realTags.find(row => row.label === label);
      return [tag.color, !!tag.hollow];
    }),
    [['blue', false], ['blue', false], ['yellow', false], ['yellow', false], ['green', false], ['green', false], ['red', false], ['purple', false]]
  );
  assert.equal(realTags.find(tag => tag.label === '👁霧嶋董香（モードB以上示唆）').color, 'blue');
  assert.equal(realTags.find(tag => tag.label === '👁笛口雛実（モードC以上示唆）').color, 'yellow');
  assert.deepEqual(
    ['✉️600G否定', '✉️設定2否定', '✉️設定3否定', '✉️設定4否定'].map(label => {
      const tag = realTags.find(row => row.label === label);
      return [tag.color, !!tag.hollow];
    }),
    [['blue', true], ['blue', true], ['yellow', true], ['green', true]]
  );
  assert.equal(realTags.find(tag => tag.label === '✉️残り300G以内').color, 'green');
  assert.equal(realTags.find(tag => tag.label === '✉️残り200G以内').color, 'red');
  assert.equal(realTags.find(tag => tag.label === '✉️残り100G以内').color, 'purple');
  assert.equal(realTags.find(tag => tag.label === '✉️設定4以上').color, 'green');
  assert.equal(realTags.find(tag => tag.label === '✉️設定6').color, 'rainbow');
  assert.equal(realTags.find(tag => tag.label === '🖼️梟（設定4以上濃厚）').color, 'green');
  assert.equal(realTags.find(tag => tag.label === '🖼️有馬（設定6濃厚）').color, 'rainbow');
  assert.match(vm.runInContext("renderShopNoteTagLabel(shopNoteTagsForMachine('m_tokyo_ghoul').tags.find(tag => tag.label === '✉️600G否定'))", context), /shop-note-color-dot hollow/);
  assert.match(vm.runInContext("renderShopNoteTagLabel(shopNoteTagsForMachine('m_tokyo_ghoul').tags.find(tag => tag.label === '✉️設定6'))", context), /shop-note-color-emoji/);
  assert.equal(vm.runInContext(`
    [...shopNoteTagsForMachine('m_tokyo_ghoul').tags, ...shopNoteTagsForMachine('m_nangoku_special').tags]
      .filter(tag => tag.type !== 'divider' && tag.color === 'rainbow' && renderShopNoteTagLabel(tag).includes('shop-note-color-emoji')).length
  `, context), 5);
  assert.equal(realTags.find(tag => tag.label === '🏆️金').color, 'gold');
  assert.equal(realTags.find(tag => tag.label === '🏆️銀').color, 'gray');
  assert.equal(realTags.find(tag => tag.label === '🏆️虹').color, 'rainbow');
  assert.equal(tagIds.some(id => id.includes('sgp_tokyo_ghoul_game_forewarning')), false);
  assert.equal(tagIds.some(id => id.includes('sgp_tokyo_ghoul_at_end_screen')), false);
  assert.equal(tagIds.some(id => id.includes('sgp_tokyo_ghoul_eyecatch_i6')), false);
  assert.equal(tagIds.includes('snt_result_bonus'), false);
  assert.equal(tagIds.includes('snt_result_no_suggest'), false);
  assert.equal(tagIds.includes('snt_eyecatch_default'), false);
  assert.equal(tagIds.includes('snt_result_cz'), true);
  assert.equal(tagIds.includes('snt_result_direct_at'), true);
  assert.equal(tagIds.includes('snt_result_quit'), true);
  assert.equal(vm.runInContext("machineById('m_tokyo_ghoul').settingSuggestCounter.label", context), 'AT終了画面');
  assert.equal(vm.runInContext("machineById('m_tokyo_ghoul').settingSuggestCounter.items.length", context), 8);
  assert.deepEqual(JSON.parse(vm.runInContext(`JSON.stringify((()=>{
    const items=shopNoteSettingCounterForMachine('m_tokyo_ghoul').items;
    return {
      decorated:items.filter(item=>item.color||item.badge).length,
      blue:items.filter(item=>item.color==='blue').length,
      green:items.filter(item=>item.color==='green').length,
      rainbow:items.filter(item=>item.color==='rainbow').length,
      highWeak:items.filter(item=>item.badge==='high'&&!item.badgeStrong).length,
      highStrong:items.filter(item=>item.badge==='high'&&item.badgeStrong).length
    };
  })())`, context)), {decorated: 5, blue: 1, green: 1, rainbow: 1, highWeak: 1, highStrong: 1});
  assert.match(vm.runInContext(`(()=>{
    shopNoteCounterOpenCards.add('snc_tokyo_counter_preview');
    return renderShopNoteSettingCounter({id:'snc_tokyo_counter_preview',machineId:'m_tokyo_ghoul',entries:[]});
  })()`, context), /shop-note-badge-high strong/);
  assert.match(vm.runInContext(`(()=>{
    shopNoteCounterOpenCards.add('snc_tokyo_counter_preview_emoji');
    return renderShopNoteSettingCounter({id:'snc_tokyo_counter_preview_emoji',machineId:'m_tokyo_ghoul',entries:[]});
  })()`, context), /shop-note-color-emoji/);
  assert.equal(vm.runInContext("shopNoteSettingCounterForMachine('')", context), null);
  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_nangoku_special').tags.some(tag => tag.id === 'snm_m_tokyo_ghoul_upper_cz')", context), false);
  assert.equal(vm.runInContext("shopNoteTagsForMachine('').tags.some(tag => tag.id === 'snm_m_tokyo_ghoul_upper_cz')", context), false);

  vm.runInContext(`
    db.shopNoteCards = [{
      id: 'snc_tokyo_shop_note',
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z',
      date: '2026-07-21',
      store: 'STORE_ALPHA',
      machineNo: '101',
      machineId: 'm_tokyo_ghoul',
      entries: []
    }];
    shopNoteOpenCardId = 'snc_tokyo_shop_note';
    toggleShopNoteFavorite('snm_m_tokyo_ghoul_upper_cz');
    addShopNoteEntry('snc_tokyo_shop_note','snm_m_tokyo_ghoul_upper_cz');
  `, context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), '上位CZ');
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(db.shopNoteFavorites.m_tokyo_ghoul)", context)), ['snm_m_tokyo_ghoul_upper_cz']);

  const counterId = vm.runInContext("machineById('m_tokyo_ghoul').settingSuggestCounter.items[0].tagId", context);
  vm.runInContext(`addShopNoteEntry('snc_tokyo_shop_note','${counterId}');`, context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_tokyo_ghoul'))['${counterId}']`, context), 1);
  vm.runInContext(`removeShopNoteCounterEntry('snc_tokyo_shop_note','${counterId}');`, context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_tokyo_ghoul'))['${counterId}']`, context), 0);

  const reloaded = runRecord(localStorage.getItem('nerai_record_v1'));
  assert.equal(vm.runInContext("shopNoteTagsForMachine('m_tokyo_ghoul').tags.some(tag => tag.id === 'snm_m_tokyo_ghoul_upper_cz')", reloaded.context), true);
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

  vm.runInContext("vibrations = []; navigator.vibrate = pattern => { vibrations.push(pattern); return true; };", context);
  assert.match(vm.runInContext("renderShopNoteSettingCounter(db.shopNoteCards[0])", context), /設定示唆: 合計0件/);
  assert.equal(vm.runInContext("renderShopNoteSettingCounter(db.shopNoteCards[1])", context), '');
  vm.runInContext("shopNoteCounterOpenCards.add('snc_counter')", context);
  const counterHtml = vm.runInContext("renderShopNoteSettingCounter(db.shopNoteCards[0])", context);
  assert.match(counterHtml, /張り切っていこー（偶数示唆）/);
  assert.match(counterHtml, /shop-note-badge-high/);
  assert.match(counterHtml, /shop-note-color-dot/);
  assert.match(counterHtml, /shop-note-color-emoji/);
  assert.deepEqual(JSON.parse(vm.runInContext(`JSON.stringify((()=>{
    const items=shopNoteSettingCounterForMachine('m_nangoku_special').items;
    return {
      decorated:items.filter(item=>item.color||item.badge).length,
      blue:items.filter(item=>item.color==='blue').length,
      green:items.filter(item=>item.color==='green').length,
      rainbow:items.filter(item=>item.color==='rainbow').length,
      highWeak:items.filter(item=>item.badge==='high'&&!item.badgeStrong).length,
      highStrong:items.filter(item=>item.badge==='high'&&item.badgeStrong).length
    };
  })())`, context)), {decorated: 4, blue: 1, green: 1, rainbow: 1, highWeak: 1, highStrong: 0});
  vm.runInContext(`addShopNoteEntry('snc_counter','${tagId}');`, context);
  vm.runInContext(`addShopNoteEntry('snc_counter','${tagId}');`, context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${tagId}']`, context), 2);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", context), 2);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries[0].tagLabels[0]", context), '張り切っていこー（偶数示唆）');
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(vibrations)", context)), [[18], [18]]);

  const stored = localStorage.getItem('nerai_record_v1');
  const reloaded = runRecord(stored);
  vm.runInContext("vibrations = []; navigator.vibrate = pattern => { vibrations.push(pattern); return true; };", reloaded.context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${tagId}']`, reloaded.context), 2);
  vm.runInContext(`removeShopNoteCounterEntry('snc_counter','${tagId}');`, reloaded.context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${tagId}']`, reloaded.context), 1);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", reloaded.context), 1);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(vibrations)", reloaded.context)), [[22, 25]]);
}

function testShopNoteEntryLongPressDeletesIndividualEntries() {
  const seed = shopNoteMigrationSeed();
  seed.shopNotes = [];
  seed.shopNoteCards = [{
    id: 'snc_delete_nangoku',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '101',
    machineId: 'm_nangoku_special',
    entries: []
  }, {
    id: 'snc_delete_tokyo',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    date: '2026-07-21',
    store: 'STORE_ALPHA',
    machineNo: '102',
    machineId: 'm_tokyo_ghoul',
    entries: []
  }];
  const { context, localStorage } = runRecord(JSON.stringify(seed), [false, true, true, true, true]);
  const nangokuTagId = vm.runInContext("shopNoteTagsForMachine('m_nangoku_special').tags.find(tag => tag.type !== 'divider').id", context);
  const counterId = vm.runInContext("machineById('m_nangoku_special').settingSuggestCounter.items[1].tagId", context);

  vm.runInContext("vibrations = []; navigator.vibrate = pattern => { vibrations.push(pattern); return true; };", context);
  vm.runInContext(`addShopNoteEntry('snc_delete_nangoku','${nangokuTagId}');`, context);
  assert.match(vm.runInContext("renderShopNoteCardBody(db.shopNoteCards[0])", context), /記録は長押しで削除/);
  assert.match(vm.runInContext("renderShopNoteEntry(db.shopNoteCards[0].entries[0], db.shopNoteCards[0])", context), /startShopNoteEntryPress/);
  assert.doesNotMatch(vm.runInContext("renderShopNoteEntry(db.shopNoteCards[0].entries[0], db.shopNoteCards[0])", context), /onclick=/);
  const firstEntryId = vm.runInContext("db.shopNoteCards[0].entries[0].id", context);
  vm.runInContext(`startShopNoteEntryPress(null,'snc_delete_nangoku','${firstEntryId}');`, context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", context), 1);
  vm.runInContext(`startShopNoteEntryPress(null,'snc_delete_nangoku','${firstEntryId}');`, context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", context), 0);

  vm.runInContext("addShopNoteEntry('snc_delete_nangoku','','自由記述テスト');", context);
  const textEntryId = vm.runInContext("db.shopNoteCards[0].entries[0].id", context);
  vm.runInContext(`startShopNoteEntryPress(null,'snc_delete_nangoku','${textEntryId}');`, context);
  assert.equal(vm.runInContext("db.shopNoteCards[0].entries.length", context), 0);

  vm.runInContext(`addShopNoteEntry('snc_delete_nangoku','${counterId}');`, context);
  vm.runInContext(`addShopNoteEntry('snc_delete_nangoku','${counterId}');`, context);
  const counterEntryId = vm.runInContext("db.shopNoteCards[0].entries[1].id", context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${counterId}']`, context), 2);
  vm.runInContext(`startShopNoteEntryPress(null,'snc_delete_nangoku','${counterEntryId}');`, context);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards[0], shopNoteSettingCounterForMachine('m_nangoku_special'))['${counterId}']`, context), 1);

  vm.runInContext("addShopNoteEntry('snc_delete_tokyo','snm_m_tokyo_ghoul_upper_cz');", context);
  const tokyoEntryId = vm.runInContext("db.shopNoteCards[1].entries[0].id", context);
  vm.runInContext(`startShopNoteEntryPress(null,'snc_delete_tokyo','${tokyoEntryId}');`, context);
  assert.equal(vm.runInContext("db.shopNoteCards[1].entries.length", context), 0);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(vibrations)", context)), [[18], [22, 25], [18], [22, 25], [18], [18], [22, 25], [18], [22, 25]]);

  const reloaded = runRecord(localStorage.getItem('nerai_record_v1'));
  assert.equal(vm.runInContext("db.shopNoteCards.find(card => card.id === 'snc_delete_nangoku').entries.length", reloaded.context), 1);
  assert.equal(vm.runInContext("db.shopNoteCards.find(card => card.id === 'snc_delete_tokyo').entries.length", reloaded.context), 0);
  assert.equal(vm.runInContext(`shopNoteSettingCounterCounts(db.shopNoteCards.find(card => card.id === 'snc_delete_nangoku'), shopNoteSettingCounterForMachine('m_nangoku_special'))['${counterId}']`, reloaded.context), 1);
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

function suggestLogSlimSeed() {
  const suggestEntry = {
    id: 'sgl_slim_1',
    categoryId: 'sgc_slim',
    placeId: 'sgp_slim',
    itemId: 'sgi_slim',
    category: '旧カテゴリ',
    place: '旧場所',
    item: '旧内容',
    hitEventId: 'hit_slim_1',
    stateGroup: 'play',
    carryType: 'setting',
    pointRole: null,
    confidenceLevel: null,
    confidenceType: null,
    game: null,
    dataGame: null,
    liquidGame: null,
    gapOffset: 0,
    trophyCustom: '',
    nextModeHint: false,
    arimaNextOffset: null,
    source: 'wizard',
    createdAt: '2026-07-29T12:34:56.789Z'
  };
  return {
    version: 1,
    machines: [{
      id: 'm_slim',
      name: 'スリム検証機',
      maker: '',
      aims: [{ id: 'aim_slim', name: '天井狙い', fields: [] }],
      tags: [],
      startTags: [],
      labelTags: [],
      suggestMaster: [{
        id: 'sgc_slim',
        category: '設定示唆',
        enabled: true,
        useAppearG: true,
        places: [{
          id: 'sgp_slim',
          name: '終了画面',
          enabled: true,
          stateGroup: 'play',
          items: [{
            id: 'sgi_slim',
            label: '赤背景',
            enabled: true,
            carryType: 'setting',
            decorations: [{ text: '赤', color: 'red' }]
          }]
        }]
      }]
    }],
    stores: [],
    logs: [{
      id: 'log_slim',
      schemaVersion: 3,
      sessionId: 'session_slim',
      aimNumber: 1,
      status: 'active',
      machineId: 'm_slim',
      aimId: 'aim_slim',
      machineName: 'スリム検証機',
      aimName: '天井狙い',
      createdAt: '2026-07-29T12:00:00.000Z',
      updatedAt: '2026-07-29T12:45:00.000Z',
      money: { date: '2026-07-29' },
      startLog: [],
      timeline: [],
      hitEvents: [{ id: 'hit_slim_1', trigger: 'cz', createdAt: '2026-07-29T12:30:00.000Z', dataGame: 120, liquidGame: 120 }],
      suggestLog: [suggestEntry],
      segments: [{
        id: 'seg_slim',
        createdAt: '2026-07-29T12:40:00.000Z',
        timeline: [],
        hitEvents: [],
        suggestLog: [suggestEntry]
      }]
    }]
  };
}

function testSuggestLogStorageSlimAndDisplayHydratesFromIds() {
  const raw = JSON.stringify(suggestLogSlimSeed());
  const { context, localStorage } = runRecord(raw);
  const stored = JSON.parse(localStorage.getItem('nerai_record_v1'));
  const entry = stored.logs.find(log => log.id === 'log_slim').suggestLog[0];

  assert.equal(stored.logs.find(log => log.id === 'log_slim').schemaVersion, 4);
  assert.equal(Object.prototype.hasOwnProperty.call(entry, 'category'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(entry, 'place'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(entry, 'item'), false);
  ['pointRole', 'confidenceLevel', 'confidenceType', 'game', 'dataGame', 'liquidGame', 'gapOffset', 'trophyCustom', 'nextModeHint', 'arimaNextOffset'].forEach(key => {
    assert.equal(Object.prototype.hasOwnProperty.call(entry, key), false, key);
  });
  assert.equal(entry.createdAt, '2026-07-29T12:34');
  assert.equal(entry.hitEventId, 'hit_slim_1');

  const line = vm.runInContext("suggestLogLine(db.logs.find(log => log.id === 'log_slim').suggestLog[0])", context);
  assert.match(line, /終了画面/);
  assert.match(line, /赤背景/);
  assert.equal(vm.runInContext("buildShareText(db.logs.find(log => log.id === 'log_slim')).includes('赤背景')", context), true);

  const seedText = JSON.stringify(suggestLogSlimSeed());
  const firstSave = vm.runInContext(`storageDataText(normalizeData(JSON.parse(${JSON.stringify(seedText)})))`, context);
  const secondSave = vm.runInContext(`storageDataText(normalizeData(JSON.parse(${JSON.stringify(firstSave)})))`, context);
  const firstLog = JSON.parse(firstSave).logs.find(log => log.id === 'log_slim');
  const secondLog = JSON.parse(secondSave).logs.find(log => log.id === 'log_slim');
  assert.deepEqual(secondLog.suggestLog, firstLog.suggestLog);
  assert.deepEqual(secondLog.segments[0].suggestLog, firstLog.segments[0].suggestLog);
}

function testSuggestLogSlimFallbackForMissingMaster() {
  const seed = suggestLogSlimSeed();
  seed.logs[0].suggestLog[0].itemId = 'sgi_missing';
  seed.logs[0].suggestLog[0].item = '旧内容フォールバック';
  const { context } = runRecord(JSON.stringify(seed));
  const line = vm.runInContext("suggestLogLine(db.logs.find(log => log.id === 'log_slim').suggestLog[0])", context);
  assert.match(line, /旧内容フォールバック|マスタ未解決/);
}

function timelineSlimSeed() {
  const seed = suggestLogSlimSeed();
  const log = seed.logs[0];
  log.timeline = [
    {
      id: 'tl_slim_1',
      game: 120,
      liquidGame: 111,
      text: '',
      tagIds: [],
      countAs: [],
      subCounters: { rf: 0 },
      attachments: [],
      createdAt: '2026-07-29T12:34:56.789Z'
    },
    {
      id: 'tl_slim_2',
      game: 125,
      liquidGame: 116,
      text: '後の同分メモ',
      tagIds: ['t_missing'],
      countAs: [],
      subCounters: { rf: 2 },
      attachments: [{ key: 'bonus', label: '加算', value: 10, unit: 'G', estimateRole: 'liquid_bonus' }],
      createdAt: '2026-07-29T12:34:59.000Z'
    }
  ];
  log.segments[0].timeline = [log.timeline[0]];
  return seed;
}

function testTimelineStorageSlimAndHydratesDefaults() {
  const { context, localStorage } = runRecord(JSON.stringify(timelineSlimSeed()));
  const storedLog = JSON.parse(localStorage.getItem('nerai_record_v1')).logs.find(log => log.id === 'log_slim');
  const emptyEntry = storedLog.timeline[0];
  const filledEntry = storedLog.timeline[1];

  assert.equal(emptyEntry.createdAt, '2026-07-29T12:34');
  ['text', 'tagIds', 'countAs', 'subCounters', 'attachments'].forEach(key => {
    assert.equal(Object.prototype.hasOwnProperty.call(emptyEntry, key), false, key);
  });
  assert.equal(filledEntry.createdAt, '2026-07-29T12:34');
  assert.deepEqual(filledEntry.tagIds, ['t_missing']);
  assert.equal(Object.prototype.hasOwnProperty.call(filledEntry, 'countAs'), false);
  assert.deepEqual(filledEntry.subCounters, { rf: 2 });
  assert.equal(filledEntry.attachments.length, 1);

  const restored = runRecord(localStorage.getItem('nerai_record_v1'));
  const hydrated = JSON.parse(vm.runInContext("JSON.stringify(db.logs.find(log => log.id === 'log_slim').timeline[0])", restored.context));
  assert.deepEqual(hydrated.tagIds, []);
  assert.deepEqual(hydrated.countAs, []);
  assert.deepEqual(hydrated.subCounters, {});
  assert.deepEqual(hydrated.attachments, []);
}

function testTimelineSameMinuteOrderUsesArrayOrderFallback() {
  const { context } = runRecord(JSON.stringify(timelineSlimSeed()));
  const latest = vm.runInContext("latestLogGameLine(db.logs.find(log => log.id === 'log_slim'))", context);
  assert.match(latest, /125G/);
  assert.match(latest, /116G/);
  const sortedIds = JSON.parse(vm.runInContext("JSON.stringify(sortByCreatedAtWithIndex(db.logs.find(log => log.id === 'log_slim').timeline, true).map(row => row.id))", context));
  assert.deepEqual(sortedIds, ['tl_slim_2', 'tl_slim_1']);
}

function run() {
  new vm.Script(extractScript(), { filename: 'nerai-record.html<script>' });
  testTokyoGhoulPresetInitialDisplayAndSpecificFeatures();
  testKabaneriPresetSeedAndPickers();
  testKabaneriChanceEyeMeterAndCounters();
  testKabaneriChanceEyeSituationView();
  testStandardAimSeedsNoDuplicatesAndDeleteTombstone();
  testOtherPresetMachinesRemainStable();
  testNoHitQuitSegmentsAreIncludedInTextOutputs();
  testHitSegmentsRemainIncludedInTextOutputs();
  testYameOutcomeTabClosesNoHitSegmentWithoutMemoDuplicate();
  testStep4GuardClosesOrCancelsOpenNoHitSegment();
  testExistingFollowMissButtonStillArchivesSegment();
  testNoHitQuitPresetsFirstPickupStartGames();
  testNoHitQuitExistingLogEditKeepsSavedSegmentGames();
  testNoHitQuitOtherPresetDoesNotOverwriteEditedGame();
  testSaveLogWarnsButAllowsEndGameBeforeStartCounter();
  testSaveLogCanCancelEndGameBeforeStartCounterWarning();
  testSaveLogDoesNotWarnWhenEndGameAfterStartCounter();
  testPracticeStatsShowsUnavailableForNegativeHitResetDenominator();
  testEditEndLogUsesKeypadInsteadOfPrompt();
  testBattleModeQuitOnlyRecordsEndLogAndUndo();
  testBattleModeQuitAndGoMoneyAppliesCreditLink();
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
  testDraftRestoreKeepsPostHitBattleContext();
  testDraftRestoreFallsBackToLatestHitBeforeStartCounter();
  testDraftRestoreKeepsCounterOnlyGameProgress();
  testBattleModeLiquidCounterNeverRestoresNegative();
  testBattleModeReplayFlashMeterHiddenWithoutQuickPanelTag();
  testBattleModeStatePickerTogglesAndRestoresFromTimeline();
  testBattleModeStateEndOptionsUseEndTagWithoutHitFlow();
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
  testBattleModeInvestmentResetUsesHistoryBoundaryAndUndo();
  testHitPayoutStepRecordsCreditAndAdoptsPayoutWithUndo();
  testHitPayoutStepDoesNotDuplicateSameCreditHistory();
  testHitPayoutCreditInputSelectsAndClears();
  testNumericKeypadReplaceOnNextDigit();
  testHitPayoutStepRecordsCreditOnlyWithoutBaseCredit();
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
  testShopNoteTagLabelsNormalizeAsPairs();
  testShopNoteCreateKeepsExplicitUnregisteredMachine();
  testShopNoteModalFollowsOpenedCardDate();
  testShopNoteSuggestMasterPaletteAndSnapshotFallback();
  testShopNoteNangokuPaletteUsesAllowList();
  testShopNoteShortLabelsDotsAndSnapshots();
  testShopNoteWrapsPaletteRowsWithoutChangingFallbacks();
  testShopNoteRemovedCommonTagsKeepSnapshotEntries();
  testShopNoteCustomTagsAreMachineScopedAndPersistent();
  testShopNoteTokyoGhoulPresetUsesAllowListAndCounter();
  testShopNoteSettingSuggestCounterUsesEntriesOnly();
  testShopNoteEntryLongPressDeletesIndividualEntries();
  testShopNoteExistingLogsAndStorageCountsRemainStable();
  testSuggestLogStorageSlimAndDisplayHydratesFromIds();
  testSuggestLogSlimFallbackForMissingMaster();
  testTimelineStorageSlimAndHydratesDefaults();
  testTimelineSameMinuteOrderUsesArrayOrderFallback();
  testLegacyBackupLoad();
  testTokyoGhoulCustomMachineDataSurvivesSeedOnRestore();
  testLegacyBackupWithSyntheticLogAndGuard();
  console.log('nerai-record regression: PASS');
}

run();
