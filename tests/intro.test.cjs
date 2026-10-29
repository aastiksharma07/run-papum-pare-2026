const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require.resolve('../intro.js'), 'utf8');

async function fixture({ reduced = false, assetFails = false, assetStalls = false } = {}) {
  const classes = new Set(['intro-pending']);
  const events = new Map();
  const nodes = new Map();
  const animations = [];
  const timers = new Map();
  let timerId = 0, time = 0;
  const emit = (target, name, event = {}) => events.get(`${target}:${name}`)?.(event);
  const eventTarget = name => ({
    addEventListener: (type, fn) => events.set(`${name}:${type}`, fn),
    removeEventListener: type => events.delete(`${name}:${type}`)
  });
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      ...eventTarget(selector), style: {}, hidden: true,
      getBoundingClientRect: () => ({ left: 100, top: 120, width: 400, height: 256 }),
      removeAttribute() { this.style = {}; }, focus() {},
      animate(frames, options) {
        const animation = { selector, frames, options, cancelled: false, cancel() { this.cancelled = true; } };
        animations.push(animation);
        return animation;
      }
    });
    return nodes.get(selector);
  }
  const root = {clientWidth:1280, classList: {
    contains: x => classes.has(x), add: (...xs) => xs.forEach(x=>classes.add(x)),
    remove: (...xs) => xs.forEach(x=>classes.delete(x)),
    replace: (a,b) => { classes.delete(a); classes.add(b); }
  }};
  const document = { ...eventTarget('document'), documentElement: root, hidden: false,
    querySelector: node, querySelectorAll: selectors => selectors === '.headline-word'
      ? [node('.coming'), node('.soon')] : selectors.split(', ').map(node), fonts: { ready: Promise.resolve() }
  };
  const window = { ...eventTarget('window'), innerHeight:720 };
  runInNewContext(source, {
    window, document, matchMedia: () => ({ ...eventTarget('motion'), matches:reduced }),
    Image: class { decode() { return assetStalls ? new Promise(()=>{}) : assetFails ? Promise.reject(Error('asset')) : Promise.resolve(); } },
    setTimeout: (fn, delay) => { const id=++timerId; timers.set(id,{at:time+delay,fn}); return id; },
    clearTimeout: id => timers.delete(id)
  });
  const flush = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
  await flush();
  async function advance(ms) {
    const end=time+ms;
    while ([...timers.values()].some(t=>t.at<=end)) {
      const [id,timer]=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      time=timer.at; timers.delete(id); timer.fn(); await flush();
    }
    time=end; await flush();
  }
  return {classes,animations,emit,node,advance};
}

function assertComplete(f) {
  assert.equal(f.classes.size, 0);
  assert.equal(f.node('.skip-intro').hidden, true);
  assert.ok(f.animations.every(a=>a.cancelled));
}

test('runner glides, words slide in opposite directions, then all animation state clears', async () => {
  const f=await fixture();
  assert.ok(f.classes.has('intro-playing'));
  const runner=f.animations.find(a=>a.selector==='.logo-runner');
  assert.equal(runner.frames[0].transform,'translate(-850px, 0)');
  await f.advance(2950);
  assert.equal(f.animations.find(a=>a.selector==='.coming').frames[0].transform,'translateX(-115%)');
  assert.equal(f.animations.find(a=>a.selector==='.soon').frames[0].transform,'translateX(115%)');
  assert.ok(f.animations.every(a=>a.frames.every(frame=>!('opacity' in frame))));
  await f.advance(1300);
  assertComplete(f);
});
for (const [name,target,event,payload] of [
  ['skip','.skip-intro','click',{}], ['Escape','document','keydown',{key:'Escape'}],
  ['resize','window','resize',{}], ['motion preference change','motion','change',{}]
]) test(`${name} resolves immediately to the complete page`,async()=>{
  const f=await fixture();f.emit(target,event,payload);assertComplete(f);
  await f.advance(5000);assertComplete(f);
});
test('reduced motion avoids the intro',async()=>{const f=await fixture({reduced:true});assertComplete(f);assert.equal(f.animations.length,0);});
test('broken logo asset fails open',async()=>{assertComplete(await fixture({assetFails:true}));});
test('stalled logo loading fails open after 1.8 seconds',async()=>{const f=await fixture({assetStalls:true});await f.advance(1800);assertComplete(f);});
