import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";
const load = async (file, extra = {}) => {
  const c = vm.createContext(extra);
  vm.runInContext(
    await readFile(new URL("../public/" + file, import.meta.url), "utf8"),
    c,
  );
  return c;
};
const loadChapters = async () => {
  const c = vm.createContext({});
  for (const f of ["pinyin-content.js", "chapters.js"])
    vm.runInContext(
      await readFile(new URL("../public/" + f, import.meta.url), "utf8"),
      c,
    );
  return c;
};
test("stable curriculum IDs, input vocabulary, and original lesson compatibility", async () => {
  const c = await loadChapters();
  vm.runInContext("globalThis.catalog=CHAPTERS;globalThis.worlds=WORLDS", c);
  assert.equal(c.catalog.length, 114);
  assert.equal(c.worlds.length, 18);
  assert.equal(new Set(c.catalog.map((x) => x.title)).size, 114);
  assert.equal(c.worlds[16].name, "拼音世界");
  assert.equal(c.worlds[17].name, "认字世界");
  assert.equal(c.catalog.filter((x) => x.world === 16).length, 14);
  assert.equal(c.catalog.filter((x) => x.world === 17).length, 4);
  let count = 0;
  for (const [id, ch] of c.catalog.entries()) {
    assert.equal(ch.id, id);
    // 原有 96 章仍是每世界 6 章；追加的拼音/认字世界按实际课数排布。
    if (id < 96) assert.equal(ch.world, Math.floor(id / 6));
    assert.equal(ch.phases.length, 3);
    for (const ph of ch.phases) {
      assert(ph.keys.length > 0);
      for (const k of ph.keys) {
        assert(
          /^[A-Z0-9;,./]$/.test(k) ||
            /^SHIFT\+[A-Z]$/.test(k) ||
            ["SPACE", "BACKSPACE", "ENTER"].includes(k),
        );
        count++;
      }
    }
  }
  assert.equal(count, 2452);
  const expected = (
    await readFile(new URL("./legacy-chapters.sha256", import.meta.url), "utf8")
  ).trim();
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(c.catalog.slice(0, 36)))
      .digest("hex"),
    expected,
  );
});
test("all decoration IDs and original purchases remain valid", async () => {
  const c = await load("room.js");
  vm.runInContext("globalThis.items=ROOM_ITEMS", c);
  assert.equal(c.items.length, 36);
  assert.equal(new Set(c.items.map((x) => x.id)).size, 36);
  for (const id of ["plant", "rug", "lamp", "telescope", "cake", "piano"])
    assert(c.items.some((x) => x.id === id));
  for (const slot of ["plant", "floor", "light", "window", "table", "toy"])
    assert.equal(c.items.filter((x) => x.slot === slot).length, 6);
  assert(c.items.every((x) => Number.isInteger(x.cost) && x.cost > 0));
});
test("face crop enlarges a small box and keeps the crop inside the frame", async () => {
  const c = await load("face-camera.js");
  vm.runInContext("globalThis.crop=FaceCamera.frameCrop", c);
  for (const box of [
    { originX: 12, originY: 30, width: 25, height: 35 },
    { originX: 0, originY: 0, width: 90, height: 80 },
    { originX: 300, originY: 220, width: 30, height: 40 },
  ]) {
    const p = c.crop(box, 320, 240),
      side = p.size * 240;
    assert(p.size > 0 && p.size <= 1);
    assert(p.x * 320 - side / 2 >= -1e-8);
    assert(p.x * 320 + side / 2 <= 320 + 1e-8);
    assert(p.y * 240 - side / 2 >= -1e-8);
    assert(p.y * 240 + side / 2 <= 240 + 1e-8);
  }
  assert(
    c.crop({ originX: 90, originY: 60, width: 30, height: 35 }, 320, 240).size <
      0.3,
  );
});
test("missing optional recordings neither fetch nor queue speech", async () => {
  let requests = 0;
  const c = await load("voice-clips.js", {
    fetch: () => {
      requests++;
      throw Error("Must not fetch");
    },
    state: { sound: true, voice: true },
    document: { hidden: false },
  });
  vm.runInContext(
    (await readFile(new URL("../public/voice.js", import.meta.url), "utf8")) +
      ";globalThis.director=VoiceDirector;globalThis.clips=VOICE_CLIPS",
    c,
  );
  assert.equal(Object.keys(c.clips).length, 147);
  assert(Object.values(c.clips).every((x) => x.text && x.url === null));
  assert.equal(await c.director.buffer("intro-0"), null);
  c.director.request("intro-0");
  assert.equal(c.director.pending, null);
  assert.equal(requests, 0);
});
test("target letters render as a case pair while other keys stay unchanged", async () => {
  const c = await load("key-display.js");
  const K = c.KeyDisplay;
  assert.equal(K.label("A"), "A·a");
  assert.match(K.html("A"), /class="key-pair"/);
  assert.match(K.html("A"), />A</);
  assert.match(K.html("A"), />a</);
  for (const [key, text] of [
    ["SHIFT+A", "Shift + A"],
    ["0", "0"],
    ["1", "1"],
    [";", ";"],
    [",", ","],
    [".", "."],
    ["/", "/"],
    ["SPACE", "␣"],
    ["ENTER", "↵"],
    ["BACKSPACE", "⌫"],
  ]) {
    assert.equal(K.label(key), text);
    assert.doesNotMatch(K.html(key), /key-pair/);
  }
});
test("progress import validates types, keeps unknown fields and summarizes", async () => {
  const c = await load("progress-file.js");
  const P = c.ProgressFile;
  const backup = {
    shells: 21,
    total: 30,
    rounds: 2,
    seconds: 120,
    keys: { a: { good: 3, miss: 1 } },
    completed: { 96: { stars: 3 }, 100: { stars: 1 } },
    owned: ["plant"],
    sound: true,
    music: false,
    voice: false,
    reduced: false,
    handGuide: true,
    volume: 0.5,
    checkpoint: null,
    sticker: "🌟",
    customField: { keep: true },
  };
  const ok = P.parse(JSON.stringify(backup));
  assert.equal(ok.ok, true);
  assert.equal(ok.data.customField.keep, true);
  assert.equal(ok.data.keys.a.good, 3);
  assert.equal(ok.summary.completed, 2);
  assert.equal(ok.summary.shells, 21);
  assert.equal(ok.summary.minutes, 2);
  for (const text of [
    "[]",
    "null",
    '"text"',
    "42",
    '{"shells":"3"}',
    '{"keys":[]}',
    '{"owned":{}}',
    '{"sound":"yes"}',
    '{"volume":1.2}',
    '{"checkpoint":[]}',
    '{"sticker":1}',
    "{bad",
  ]) {
    const bad = P.parse(text);
    assert.equal(bad.ok, false);
    assert.equal(typeof bad.error, "string");
  }
  assert.equal(P.parse(" ".repeat(512 * 1024 + 1)).ok, false);
  assert.match(
    P.fileName(new Date(2026, 0, 5, 7, 8)),
    /^keyboard-island-progress-\d{8}-\d{4}\.json$/,
  );
  assert.equal(
    P.fileName(new Date(2026, 0, 5, 7, 8)),
    "keyboard-island-progress-20260105-0708.json",
  );
});
