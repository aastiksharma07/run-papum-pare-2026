const {test}=require('node:test');
const assert=require('node:assert/strict');
const {sample,travelProgress,create,DEFAULT_DURATION,POSE_LOCK,boneMatrix,rigidMatrix,REFERENCE_POSE}=require('../runner-motion.js');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

test('running poses keep the knees connected at natural bone lengths',()=>{
  for(let ms=0;ms<DEFAULT_DURATION*.67;ms+=8){
    const pose=sample(ms);
    for(const leg of [pose.frontLeg,pose.rearLeg]){
      assert.ok(Math.abs(distance(leg.hip,leg.knee)-126)<.001);
      assert.ok(Math.abs(distance(leg.knee,leg.ankle)-130)<.001);
      for(const p of [leg.hip,leg.knee,leg.ankle]) assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    }
  }
});
test('stance foot stays planted while the body travels forward',()=>{
  const positions=[0,30,60,90,120].map(ms=>{
    const leg=sample(ms).frontLeg;
    return leg.ankle.x+850*travelProgress(ms/DEFAULT_DURATION);
  });
  assert.ok(Math.max(...positions)-Math.min(...positions)<.001);
});
test('gait has recovery and opposite leg phases rather than a rigid sliding pose',()=>{
  const frames=[0,175,350,525,700].map(ms=>sample(ms));
  assert.ok(frames.some(f=>Math.abs(f.frontLeg.ankle.y-f.rearLeg.ankle.y)>50));
  assert.ok(Math.max(...frames.map(f=>f.frontArm.wrist.x))-Math.min(...frames.map(f=>f.frontArm.wrist.x))>60);
});
test('travel slows continuously to a stop and resolves into the approved pose',()=>{
  assert.equal(travelProgress(0),0);assert.equal(travelProgress(1),1);
  assert.ok(travelProgress(.99)-travelProgress(.98)>travelProgress(1)-travelProgress(.99));
  const pose=sample(DEFAULT_DURATION);
  assert.equal(pose.bounce,0);
  assert.deepEqual(pose.frontLeg.ankle,{x:1098,y:533});
  assert.deepEqual(pose.rearArm.wrist,{x:988,y:323});
});

test('saved cycle can be scrubbed from scroll progress without a running timer',()=>{
  const names=['front','rear'].flatMap(side=>['thigh','calf','knee','shoe','upper','lower','elbow','hand'].map(part=>`${side}-${part}`)).concat('body');
  const nodes=names.map(name=>({dataset:{runnerPart:name},setAttribute(){}}));
  const motion=create({querySelectorAll:()=>nodes});
  const a=motion.seek(0),b=motion.seek(1);
  assert.ok(distance(a.frontLeg.ankle,b.frontLeg.ankle)<.001);
  assert.ok(distance(a.frontArm.wrist,b.frontArm.wrist)<.001);
  const mid=motion.seek(.5);
  assert.ok(distance(a.frontLeg.ankle,mid.frontLeg.ankle)>80);
});

test('continuous playback can run past its duration and stop without leaving a frame queued',()=>{
  const request=global.requestAnimationFrame,cancel=global.cancelAnimationFrame;
  const pending=new Map();let id=0;
  global.requestAnimationFrame=callback=>{pending.set(++id,callback);return id;};
  global.cancelAnimationFrame=handle=>pending.delete(handle);
  try{
    const names=['front','rear'].flatMap(side=>['thigh','calf','knee','shoe','upper','lower','elbow','hand'].map(part=>`${side}-${part}`)).concat('body');
    const nodes=names.map(name=>({dataset:{runnerPart:name},setAttribute(key,value){assert.ok(!String(value).includes('NaN'));}}));
    const motion=create({querySelectorAll:()=>nodes});
    motion.play({loop:true});
    const [handle,frame]=[...pending][0];pending.delete(handle);
    frame(performance.now()+DEFAULT_DURATION*3);
    assert.equal(pending.size,1);
    motion.stop();assert.equal(pending.size,0);
  }finally{global.requestAnimationFrame=request;global.cancelAnimationFrame=cancel;}
});

test('joint transforms lock into the approved pose before travel stops',()=>{
  const locked=sample(DEFAULT_DURATION*POSE_LOCK),end=sample(DEFAULT_DURATION);
  for(const limb of ['frontLeg','rearLeg','frontArm','rearArm']){
    for(const key of Object.keys(end[limb])){
      const a=locked[limb][key],b=end[limb][key];
      if(typeof a==='object') assert.ok(distance(a,b)<.001);
      else assert.ok(Math.abs(a-b)<.001);
    }
  }
  assert.equal(locked.bounce,0);
});


const transform=(matrix,p)=>({x:matrix[0]*p.x+matrix[2]*p.y+matrix[4],y:matrix[1]*p.x+matrix[3]*p.y+matrix[5]});
test('artwork skin maps each bone endpoint to its live position without changing width',()=>{
  for(let ms=0;ms<=DEFAULT_DURATION;ms+=37){
    const pose=sample(ms);
    for(const side of ['rear','front'])for(const kind of ['Leg','Arm']){
      const ref=REFERENCE_POSE[side+kind],live=pose[side+kind];
      const keys=kind==='Leg'?['hip','knee','ankle']:['shoulder','elbow','wrist'];
      for(let i=0;i<2;i++){
        const a=ref[keys[i]],b=ref[keys[i+1]],m=boneMatrix(a,b,live[keys[i]],live[keys[i+1]]);
        assert.ok(distance(transform(m,a),live[keys[i]])<.00001);
        assert.ok(distance(transform(m,b),live[keys[i+1]])<.00001);
        const length=distance(a,b),normal={x:a.x-(b.y-a.y)/length,y:a.y+(b.x-a.x)/length};
        assert.ok(Math.abs(distance(transform(m,normal),transform(m,a))-1)<.00001);
      }
    }
  }
});
test('all artwork transforms become identity at the landing pose, with no replacement image',()=>{
  const pose=sample(DEFAULT_DURATION*POSE_LOCK);
  const identity=[1,0,0,1,0,0];
  for(const side of ['rear','front'])for(const kind of ['Leg','Arm']){
    const ref=REFERENCE_POSE[side+kind],live=pose[side+kind];
    const keys=kind==='Leg'?['hip','knee','ankle']:['shoulder','elbow','wrist'];
    for(let i=0;i<2;i++)boneMatrix(ref[keys[i]],ref[keys[i+1]],live[keys[i]],live[keys[i+1]]).forEach((v,j)=>assert.ok(Math.abs(v-identity[j])<.00001));
    const endpoint=ref[keys[2]];
    rigidMatrix(endpoint,endpoint,0).forEach((v,j)=>assert.ok(Math.abs(v-identity[j])<.00001));
  }
});
