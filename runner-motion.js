/* An articulated, code-native running cycle for the approved logo intro. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const DEFAULT_DURATION = 1100;
  const POSE_LOCK = .86;
  // Joint coordinates in the original, approved logo. Returning each skin
  // transform to identity preserves the artwork exactly at the landing pose.
  const REFERENCE_POSE = {
    frontLeg:{hip:{x:1077,y:402},knee:{x:1182,y:419},ankle:{x:1098,y:533},footAngle:61},
    rearLeg:{hip:{x:1065,y:411},knee:{x:991,y:496},ankle:{x:880,y:584},footAngle:84},
    frontArm:{shoulder:{x:1170,y:286},elbow:{x:1197,y:341},wrist:{x:1253,y:293}},
    rearArm:{shoulder:{x:1114,y:266},elbow:{x:1054,y:267},wrist:{x:988,y:323}}
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const point = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
  const rounded = n => Math.round(n * 100) / 100;
  const xy = p => `${rounded(p.x)} ${rounded(p.y)}`;

  // A two-bone solver keeps the knee and elbow connected at every frame.
  function joint(start, end, upper, lower, bend = 1) {
    const dx = end.x - start.x, dy = end.y - start.y;
    const distance = Math.max(.001, Math.hypot(dx, dy));
    const reach = clamp(distance, Math.abs(upper - lower) + .01, upper + lower - .01);
    const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
    const across = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend;
    return { x: start.x + dx / distance * along + dy / distance * across,
      y: start.y + dy / distance * along - dx / distance * across };
  }

  function cubic(a, b, c, d, t) {
    const u = 1 - t;
    return { x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x,
      y: u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y };
  }

  function ankleHeight(angle) {
    const radians = angle * Math.PI / 180;
    const sole = Math.max(...[[37,9],[37,17],[30,17],[-14,10]].map(([x,y])=>x*Math.sin(radians)+y*Math.cos(radians)));
    return 647 - sole;
  }

  function leg(phase, hip) {
    phase = ((phase % 1) + 1) % 1;
    let ankle, footAngle;
    if (phase < .42) {
      // The support foot travels backward relative to the body at the same
      // speed as forward travel, so it stays planted instead of skating.
      footAngle = mix(-10, 24, smooth(phase / .42));
      ankle = { x: hip.x + 90 - phase * 425, y: ankleHeight(footAngle) };
    } else {
      const t = (phase - .42) / .58;
      ankle = cubic(
        {x:hip.x - 88.5,y:ankleHeight(24)}, {x:hip.x - 200,y:424},
        {x:hip.x + 205,y:456}, {x:hip.x + 90,y:ankleHeight(-10)}, t
      );
      footAngle = t < .42 ? mix(24,65,smooth(t/.42)) : mix(65,-10,smooth((t-.42)/.58));
    }
    return {hip, knee:joint(hip,ankle,126,130), ankle, footAngle};
  }

  function arm(phase, shoulder) {
    // Arms oppose the same-side leg. Elbows stay bent through the swing.
    const angle = -.05 - .85 * Math.cos(TAU * phase);
    const elbow = { x: shoulder.x + Math.sin(angle) * 76,
      y: shoulder.y + Math.cos(angle) * 76 };
    const forearm = angle + 1.60 + .06 * Math.sin(TAU * phase);
    const wrist = { x: elbow.x + Math.sin(forearm) * 72,
      y: elbow.y + Math.cos(forearm) * 72 };
    return {shoulder,elbow,wrist};
  }

  // Pose matching is independent of frame rate; dropped frames cannot speed
  // up the cadence or leave a joint in a previous frame.
  function travelProgress(progress) {
    return progress < .8 ? progress / .9 : (.8 + (progress - .8) - (progress - .8) ** 2 / .4) / .9;
  }

  function sample(elapsed, duration = DEFAULT_DURATION, options = {}) {
    const rawProgress = elapsed / duration;
    const progress = clamp(rawProgress, 0, 1);
    const settling = options.settle !== false;
    const phase = (settling ? travelProgress(progress) : rawProgress) * (options.cycles ?? 2);
    const settle = settling ? smooth((progress - .68) / (POSE_LOCK - .68)) : 0;
    const bounce = 7 * Math.cos(TAU * 2 * (phase - .15)) * (1 - settle) || 0;
    const hip = {x:1074,y:407 + bounce};
    const frontLeg = leg(phase,hip);
    const rearLeg = leg(phase + .5,{x:1067,y:hip.y - 2});
    const frontArm = arm(phase,{x:1170,y:285 + bounce});
    const rearArm = arm(phase + .5,{x:1120,y:285 + bounce});
    function settleLeg(value, target) {
      return {hip:point(value.hip,target.hip,settle),knee:point(value.knee,target.knee,settle),
        ankle:point(value.ankle,target.ankle,settle),footAngle:mix(value.footAngle,target.footAngle,settle)};
    }
    function settleArm(value,target) {
      return {shoulder:point(value.shoulder,target.shoulder,settle),elbow:point(value.elbow,target.elbow,settle),wrist:point(value.wrist,target.wrist,settle)};
    }
    return {
      bounce, match:settle,
      frontLeg:settleLeg(frontLeg,REFERENCE_POSE.frontLeg),
      rearLeg:settleLeg(rearLeg,REFERENCE_POSE.rearLeg),
      frontArm:settleArm(frontArm,REFERENCE_POSE.frontArm),
      rearArm:settleArm(rearArm,REFERENCE_POSE.rearArm)
    };
  }

  // Tapered filled contours give thighs, calves, and forearms volume, rather
  // than rotating flat crops or treating each limb as a uniform stick.
  function segment(a,b,ra,rb,bulge=0) {
    const length = Math.max(.001,Math.hypot(b.x-a.x,b.y-a.y));
    const u={x:(b.x-a.x)/length,y:(b.y-a.y)/length}, n={x:-u.y,y:u.x};
    const at=(t,r)=>({x:mix(a.x,b.x,t)+n.x*r,y:mix(a.y,b.y,t)+n.y*r});
    const end={x:b.x+u.x*rb,y:b.y+u.y*rb};
    const start={x:a.x-u.x*ra,y:a.y-u.y*ra};
    return `M${xy(at(0,ra))} C${xy(at(.34,ra+bulge))} ${xy(at(.72,rb+bulge))} ${xy(at(1,rb))} Q${xy(end)} ${xy(at(1,-rb))} C${xy(at(.72,-rb-bulge))} ${xy(at(.34,-ra-bulge))} ${xy(at(0,-ra))} Q${xy(start)} ${xy(at(0,ra))}Z`;
  }

  // Rotate and extend along a bone while preserving its width. Unlike a
  // bounding-box resize, this never fattens a limb as its angle changes.
  function boneMatrix(a,b,start,end) {
    const sourceLength=Math.hypot(b.x-a.x,b.y-a.y);
    const targetLength=Math.max(.001,Math.hypot(end.x-start.x,end.y-start.y));
    const ux=(b.x-a.x)/sourceLength,uy=(b.y-a.y)/sourceLength;
    const vx=(end.x-start.x)/targetLength,vy=(end.y-start.y)/targetLength;
    const scale=targetLength/sourceLength;
    const aa=vx*scale*ux+vy*uy,bb=vy*scale*ux-vx*uy;
    const cc=vx*scale*uy-vy*ux,dd=vy*scale*uy+vx*ux;
    return [aa,bb,cc,dd,start.x-aa*a.x-cc*a.y,start.y-bb*a.x-dd*a.y];
  }

  function rigidMatrix(source,target,radians) {
    const c=Math.cos(radians),s=Math.sin(radians);
    return [c,s,-s,c,target.x-c*source.x+s*source.y,target.y-s*source.x-c*source.y];
  }

  const matrixString = values => `matrix(${values.map(n=>Math.round(n*1000000)/1000000).join(' ')})`;
  const angle = (a,b) => Math.atan2(b.y-a.y,b.x-a.x);

  function create(svg,options={}) {
    const canvas=svg.querySelector?.('.runner-canvas')||svg;
    let mesh=null;
    try { mesh=canvas&&root.PapumPareRunnerSkin?.create(canvas,options.source,options.outline,{REFERENCE_POSE,boneMatrix,rigidMatrix}); }
    catch(error) { canvas?.setAttribute('hidden',''); }
    const fallback=svg.querySelector?.('.runner-skin-fallback');
    if(mesh&&fallback)fallback.style.display='none';
    if(!mesh&&fallback)fallback.style.display='block';
    const parts = Object.fromEntries([...(svg.querySelectorAll?.('[data-runner-part]')||[])].map(node=>[node.dataset.runnerPart,node]));
    let frameId = null, stopped = false;
    const set = (name,value) => parts[name].setAttribute('d',value);
    function drawLeg(name,value) {
      set(`${name}-thigh`,segment(value.hip,value.knee,25,16,4));
      set(`${name}-calf`,segment(value.knee,value.ankle,16,8,5));
      parts[`${name}-knee`].setAttribute('transform',`translate(${xy(value.knee)})`);
      parts[`${name}-shoe`].setAttribute('transform',`translate(${xy(value.ankle)}) rotate(${rounded(value.footAngle)})`);
    }
    function drawArm(name,value) {
      set(`${name}-upper`,segment(value.shoulder,value.elbow,17,12,2));
      set(`${name}-lower`,segment(value.elbow,value.wrist,12,8,2));
      parts[`${name}-elbow`].setAttribute('transform',`translate(${xy(value.elbow)})`);
      parts[`${name}-hand`].setAttribute('transform',`translate(${xy(value.wrist)}) rotate(-25)`);
    }
    function draw(elapsed,duration=DEFAULT_DURATION,options={}) {
      const pose=sample(elapsed,duration,options);
      if(mesh) mesh.draw(pose);
      else if(parts['rear-thigh']) {
        // Keep the original vector rig usable for future scroll scenes.
        drawLeg('rear',pose.rearLeg);drawLeg('front',pose.frontLeg);
        drawArm('rear',pose.rearArm);drawArm('front',pose.frontArm);
        parts.body.setAttribute('transform',`translate(0 ${rounded(pose.bounce)})`);
      }
      return pose;
    }
    function stop() { stopped=true;if(frameId!==null) cancelAnimationFrame(frameId);frameId=null; }
    function play(settings=DEFAULT_DURATION) {
      const config=typeof settings==='number'?{duration:settings}:settings;
      const duration=config.duration??DEFAULT_DURATION;
      if(!Number.isFinite(duration)||duration<=0)throw new RangeError('Runner duration must be positive.');
      const loop=config.loop===true;
      const options={settle:config.settle??!loop,cycles:config.cycles??2};
      stop();stopped=false;
      if(!mesh&&!parts['rear-thigh']){draw(duration,duration,options);return;}
      if(root.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
        draw(duration,duration);return;
      }
      const began=performance.now();
      draw(0,duration,options);
      const tick=now=>{
        if(stopped)return;
        const elapsed=loop?now-began:Math.min(now-began,duration);
        draw(elapsed,duration,options);
        if(loop||elapsed<duration)frameId=requestAnimationFrame(tick);else frameId=null;
      };
      frameId=requestAnimationFrame(tick);
    }
    // A normalized scroll progress controls one stride without starting a timer.
    function seek(progress) {
      stop();
      return draw(clamp(progress,0,1)*DEFAULT_DURATION,DEFAULT_DURATION,{settle:false,cycles:1});
    }
    function destroy(){stop();mesh?.dispose();}
    return {play,stop,draw,seek,destroy};
  }
  const api={create,sample,joint,segment,travelProgress,boneMatrix,rigidMatrix,REFERENCE_POSE,DEFAULT_DURATION,POSE_LOCK};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PapumPareRunner=api;
})(typeof window==='undefined'?{}:window);
