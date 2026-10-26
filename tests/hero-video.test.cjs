const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'hero-video.js'), 'utf8');

function setup({ reduced = false, protocol = 'http:', random = 0 } = {}) {
  const rootClasses = new Set();
  const layerClasses = new Set();
  const events = {};
  const callbacks = {};
  const timers = new Map();
  let timerId = 0;
  let options;
  let videoTime = 0;
  const calls = [];
  const hero = { clientWidth: 390, clientHeight: 844, dataset: {} };
  const notice = { hidden: true };
  const dimensions = {};
  const layer = { classList: { add: v => layerClasses.add(v), remove: v => layerClasses.delete(v) }, style: { setProperty: (k, v) => dimensions[k] = v } };
  const player = {
    getIframe: () => ({ setAttribute() {} }),
    mute: () => calls.push('mute'),
    playVideo: () => calls.push('play'),
    pauseVideo: () => calls.push('pause'),
    unloadModule: name => calls.push(['unload', name]),
    setOption: (module, option, value) => calls.push(['option', module, option, Object.keys(value).length]),
    seekTo: time => { videoTime = time; calls.push(['seek', time]); },
    getCurrentTime: () => videoTime
  };
  const document = {
    hidden: false,
    documentElement: { classList: { contains: v => rootClasses.has(v) } },
    querySelector: selector => selector === '.hero' ? hero : selector === '.hero-video' ? layer : selector === '.hero-local-notice' ? notice : null,
    addEventListener: (type, fn) => events[type] = fn
  };
  const YT = { Player: function (id, config) { options = config; return player; }, PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 } };
  const window = { YT, addEventListener: (type, fn) => events[type] = fn };
  vm.runInNewContext(source, {
    window, document, YT, location: { origin: 'http://localhost:4173', protocol },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
      Math: { random: () => random, floor: Math.floor, max: Math.max, ceil: Math.ceil },
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { constructor(fn) { callbacks.intersection = fn; } observe() {} },
    MutationObserver: class { constructor(fn) { callbacks.mutation = fn; } observe() {} },
    setInterval: fn => { timers.set(++timerId, fn); return timerId; },
    clearInterval: id => timers.delete(id)
  });
  return { options, calls, events, callbacks, rootClasses, hero, notice, dimensions, timers, document, layerClasses, player,
    ready: () => options.events.onReady({ target: player }),
    setTime: time => videoTime = time,
    tick: () => timers.forEach(fn => fn()) };
}

test('keeps player edge information outside the hero and disables available captions', () => {
  const h = setup(); h.ready();
  assert.ok(parseInt(h.dimensions['--video-height']) >= h.hero.clientHeight + 240);
  assert.ok(h.calls.some(c => Array.isArray(c) && c[0] === 'unload' && c[1] === 'captions'));
  h.calls.length = 0;
  h.options.events.onApiChange({ target: h.player });
  assert.deepEqual(h.calls, [['option', 'captions', 'track', 0], ['unload', 'captions']]);
  delete h.player.unloadModule;
  h.calls.length = 0;
  assert.doesNotThrow(() => h.options.events.onApiChange({ target: h.player }));
  assert.deepEqual(h.calls, [['option', 'captions', 'track', 0]]);
  assert.equal(h.options.playerVars.cc_load_policy, 0);
  h.player.unloadModule = () => { throw new Error('Module unavailable'); };
  assert.doesNotThrow(() => h.options.events.onStateChange({ data: 1 }));
  assert.equal(h.hero.dataset.videoState, 'playing');
});

test('starts from a curated random moment, mutes before playback and covers a portrait hero', () => {
  const h = setup({ random: .5 }); h.ready();
  assert.equal(h.options.playerVars.controls, 0);
  assert.equal(h.options.playerVars.autoplay, 1);
  assert.equal(h.options.playerVars.mute, 1);
  assert.equal(h.options.playerVars.disablekb, 1);
  assert.equal(h.options.playerVars.end, 174);
  assert.ok(h.calls.indexOf('mute') < h.calls.indexOf('play'));
  assert.ok(h.calls.some(c => Array.isArray(c) && c[1] === 96));
  assert.ok(parseInt(h.dimensions['--video-width']) >= 390);
  assert.ok(parseInt(h.dimensions['--video-height']) >= 844);
});

test('supports every configured random opening point', () => {
  for (const [random, expected] of [[0, 0], [.24, 0], [.25, 29], [.49, 29], [.5, 96], [.74, 96], [.75, 130], [.99, 130]]) {
    const h = setup({ random }); h.ready();
    assert.ok(h.calls.some(c => Array.isArray(c) && c[1] === expected), `random=${random}`);
  }
});
test('loops at 02:54, preserves playback before the boundary and restarts on ended', () => {
  const h = setup(); h.ready(); h.calls.length = 0;
  h.setTime(173.8); h.tick(); assert.equal(h.calls.length, 0);
  h.setTime(174); h.tick(); assert.equal(h.calls[0][1], 0);
  h.calls.length = 0;
  h.options.events.onStateChange({ data: 0 });
  assert.equal(h.calls[0][1], 0); assert.equal(h.calls[1], 'play');
});
test('pauses when hidden or motion is disabled, and resumes within the selected segment', () => {
  const h = setup(); h.ready(); h.calls.length = 0;
  h.document.hidden = true; h.events.visibilitychange(); assert.equal(h.calls.at(-1), 'pause');
  h.setTime(180); h.tick(); assert.equal(h.calls.at(-1), 'pause');
  h.document.hidden = false; h.events.visibilitychange();
  assert.equal(h.calls.at(-2)[1], 0); assert.equal(h.calls.at(-1), 'play');
  h.rootClasses.add('motion-paused'); h.callbacks.mutation(); assert.equal(h.calls.at(-1), 'pause');
});
test('restores looping after browser back/forward cache', () => {
  const h = setup(); h.ready(); assert.equal(h.timers.size, 1);
  h.events.pagehide(); assert.equal(h.timers.size, 0);
  h.events.pageshow({ persisted: true }); assert.equal(h.timers.size, 1);
  h.setTime(174); h.tick(); assert.equal(h.calls.at(-1)[1], 0);
});
test('reduced-motion visitors do not load the player', () => {
  const h = setup({ reduced: true }); assert.equal(h.options, undefined); assert.equal(h.timers.size, 0);
});
test('player errors retain the fallback and stop loop checks', () => {
  const h = setup(); h.ready();
  h.options.events.onStateChange({ data: 1 }); assert.ok(h.layerClasses.has('is-playing'));
  h.options.events.onError(); assert.equal(h.hero.dataset.videoState, 'unavailable');
  assert.equal(h.layerClasses.has('is-playing'), false); assert.equal(h.timers.size, 0);
});
test('direct file opening explains how to launch the working HTTP preview', () => {
  const h = setup({ protocol: 'file:' });
  assert.equal(h.options, undefined);
  assert.equal(h.notice.hidden, false);
  assert.equal(h.hero.dataset.videoState, 'local-file');
});
