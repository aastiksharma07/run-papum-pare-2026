const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require.resolve('../intro.js'), 'utf8');

async function fixture({ reduced = false, assetFails = false, assetStalls = false, runnerFails = false, width = 1280, height = 720 } = {}) {
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
      getAttribute: () => 'M0 0Z',
      removeAttribute() { this.style = {}; }, focus() {},
      animate(frames, options) {
        const animation = { selector, frames, options, cancelled: false, cancel() { this.cancelled = true; } };
        animations.push(animation);
        return animation;
      }
    });
    return nodes.get(selector);
  }
  const root = {clientWidth:width, classList: {
    contains: x => classes.has(x), add: (...xs) => xs.forEach(x=>classes.add(x)),
    remove: (...xs) => xs.forEach(x=>classes.delete(x)),
    replace: (a,b) => { classes.delete(a); classes.add(b); }
  }};
  const document = { ...eventTarget('document'), documentElement: root, hidden: false,
    querySelector: node, querySelectorAll: selectors => selectors === '.headline-word'
      ? [node('.coming'), node('.soon')] : selectors.split(', ').map(node), fonts: { ready: Promise.resolve() }
  };
  const motion = { plays: 0, stops: 0, play() { this.plays++; }, stop() { this.stops++; } };
  const window = { PapumPareRunner: { create: () => {if(runnerFails)throw Error('WebGL unavailable');return motion;}, POSE_LOCK: .86 }, ...eventTarget('window'), innerHeight:height };
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
  return {classes,animations,emit,node,advance,motion};
}

function assertComplete(f) {
  assert.equal(f.classes.size, 0);
  assert.ok(f.animations.every(a=>a.cancelled));
  if (f.motion.plays) assert.equal(f.motion.stops,1);
}

test('runner glides, words slide in opposite directions, then all animation state clears', async () => {
  const f=await fixture();
  assert.ok(f.classes.has('intro-playing'));
  const runner=f.animations.find(a=>a.selector==='.logo-runner');
  assert.equal(runner.frames[0].transform,'translateX(-54.20918%)');
  assert.equal(runner.frames.at(-1).transform,'translateX(0%)');
  const logoJourney = f.animations.find(a=>a.selector==='.official-logo');
  await f.advance(logoJourney.options.delay - 1);
  assert.equal(f.animations.some(a=>a.selector==='.coming'), false);
  await f.advance(1);
  assert.equal(f.animations.find(a=>a.selector==='.coming').frames[0].transform,'translateX(-850px)');
  assert.equal(f.animations.find(a=>a.selector==='.soon').frames[0].transform,'translateX(850px)');
  assert.equal(runner.options.duration, 1100);
  const logoReveal=f.animations.find(a=>a.selector==='.logo-reveal-sweep');
  assert.ok(logoJourney.options.delay >= runner.options.duration);
  assert.ok(logoJourney.options.delay >= logoReveal.options.delay + logoReveal.options.duration);
  assert.equal(f.animations.some(a=>a.selector==='.runner-approved'||a.selector==='.runner-articulated'),false);
  assert.ok(f.animations.filter(a=>a.selector==='.logo-runner').every(a=>a.frames.every(frame=>!('opacity' in frame))));
  assert.ok(f.animations.filter(a=>a.selector==='.coming'||a.selector==='.soon').every(a=>a.frames.every(frame=>!('opacity' in frame))));
  await f.advance(1600);
  assertComplete(f);
});
for (const [name,target,event,payload] of [
  ['Escape','document','keydown',{key:'Escape'}],
  ['resize','window','resize',{}], ['motion preference change','motion','change',{}]
]) test(`${name} resolves immediately to the complete page`,async()=>{
  const f=await fixture();f.emit(target,event,payload);assertComplete(f);
  await f.advance(5000);assertComplete(f);
});
test('reduced motion avoids the intro',async()=>{const f=await fixture({reduced:true});assertComplete(f);assert.equal(f.animations.length,0);});
test('broken logo asset fails open',async()=>{assertComplete(await fixture({assetFails:true}));});
test('unavailable graphics renderer shows the complete static page',async()=>{assertComplete(await fixture({runnerFails:true}));});
test('stalled logo loading fails open after 1.8 seconds',async()=>{const f=await fixture({assetStalls:true});await f.advance(1800);assertComplete(f);});

test('mobile portrait splash is centered in the viewport',async()=>{
  const f=await fixture({width:390,height:844});
  const logo=f.animations.find(a=>a.selector==='.official-logo');
  const [dx,dy]=logo.frames[0].transform.match(/translate\(([-.\d]+)px, ([-.\d]+)px\)/).slice(1).map(Number);
  assert.equal(100+400/2+dx,390/2);
  assert.equal(120+256/2+dy,844/2);
});
