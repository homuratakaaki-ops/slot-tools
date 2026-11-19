const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

test("ハイビリターン30の開始状態は表示だけを変更し、従来値を選択する", () => {
  const html = fs.readFileSync(path.join(__dirname, "../tools/rec/index.html"), "utf8");
  const slice = (start, end) => html.slice(html.indexOf(start), html.indexOf(end, html.indexOf(start)));
  const hibi = slice("  ,hibireturn:{", "    counter3:").match(/setup:\[([\s\S]*?)\n    \]/)[0];
  const another = html.match(/\{key:"state",label:"状態",type:"select",options:\["不明","リセット後","AT後","CZ後"\]\}/)[0];
  function mk(tag, cls, text) {
    const node = {tag, cls, text, children: [], style: {}, listeners: {}, classList: {add(){}, remove(){}, toggle(){}}};
    node.setAttribute = () => {};
    node.append = (...children) => node.children.push(...children);
    node.addEventListener = (name, listener) => { node.listeners[name] = listener; };
    node.querySelectorAll = name => node.children.filter(child => child.tag === name);
    Object.defineProperty(node, "innerHTML", {set(){ node.children = []; }});
    return node;
  }
  const fields = mk("div"), lcd = mk("div"), total = mk("div");
  const box = {mk, el: key => ({stFields:fields,stLcdWrap:lcd,stTotalHint:total})[key]};
  vm.createContext(box);
  vm.runInContext(
    "const MACHINES={hibireturn:{" + hibi + "}, generic:{setup:[]}, other:{setup:[" + another + "]}}; " +
    "let pickedMachine='hibireturn',setupVals;" + slice("function optRow(", "/* 行タグ") +
    slice("function renderSetupFields(){", "function showSetup(){") +
    "this.render=id=>{pickedMachine=id;renderSetupFields()};this.pick=()=>setupVals;", box
  );
  const buttons = label => fields.children[fields.children.findIndex(node => node.text === label) + 1].children;
  box.render("hibireturn");
  const state = buttons("状態");
  assert.deepEqual(state.map(node => node.text), ["天国後", "朝イチ"]);
  state[0].listeners.click();
  assert.equal(box.pick().stage0, "不明");
  state[1].listeners.click();
  assert.equal(box.pick().stage0, "リセット後");
  assert.deepEqual(buttons("前回のボーナス").map(node => node.text), ["不明", "BIG", "REG"]);
  box.render("other");
  assert.deepEqual(buttons("状態").map(node => node.text), ["不明", "リセット後", "AT後", "CZ後"]);
});
