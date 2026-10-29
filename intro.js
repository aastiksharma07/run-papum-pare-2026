(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const logo = document.querySelector('.official-logo');
  const skip = document.querySelector('.skip-intro');
  const animations = new Set();
  const timers = new Set();
  let finished = false;
  const ease = 'cubic-bezier(.22, 1, .36, 1)';

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(window.introWatchdog);
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
    root.classList.remove('intro-pending', 'intro-playing', 'is-revealing');
    logo.removeAttribute('style');
    if (document.activeElement === skip) document.querySelector('main').focus({ preventScroll: true });
    skip.hidden = true;
    window.removeEventListener('resize', finish);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reduceMotion.removeEventListener('change', finish);
  }

  function onVisibilityChange() {
    if (document.hidden) finish();
  }

  function after(delay, action) {
    const id = setTimeout(() => { timers.delete(id); if (!finished) action(); }, delay);
    timers.add(id);
  }

  function animate(element, frames, options) {
    const animation = element.animate(frames, { fill: 'both', easing: ease, ...options });
    animations.add(animation);
    return animation;
  }

  async function start() {
    if (!root.classList.contains('intro-pending') || reduceMotion.matches) return finish();
    const source = new Image();
    source.src = './assets/brand/run-papum-pare-2026-logo-transparent-v2.webp';
    // Skip gracefully on a slow connection; never hold visitors behind a loading screen.
    let assetTimeout;
    const ready = await Promise.race([
      Promise.all([source.decode(), document.fonts.ready]).then(() => true).catch(() => false),
      new Promise(resolve => { assetTimeout = setTimeout(() => resolve(false), 1800); })
    ]);
    clearTimeout(assetTimeout);
    if (!ready || window.introExpired || finished || document.hidden) return finish();

    const box = logo.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const stageWidth = Math.min(width * .80, height * .75, 620);
    const scale = stageWidth / box.width;
    const dx = width / 2 - (box.left + box.width / 2);
    const dy = height / 2 - (box.top + box.height / 2);
    const stage = `translate(${dx}px, ${dy}px) scale(${scale})`;
    logo.style.transform = stage;
    root.classList.replace('intro-pending', 'intro-playing');
    skip.hidden = false;

    const runner = document.querySelector('.logo-runner');
    // One continuous glide: preserve the runner's approved silhouette.
    animate(runner, [
      { transform: 'translate(-850px, 0)', visibility: 'visible' },
      { transform: 'translate(0, 0)', visibility: 'visible' }
    ], { duration: 1200, easing: 'cubic-bezier(.45,0,.15,1)' });

    document.querySelectorAll('.logo-scene, .logo-type').forEach(element => {
      animate(element, [
        { visibility: 'hidden', offset: 0 },
        { visibility: 'visible', offset: .001 },
        { visibility: 'visible', offset: 1 }
      ], { delay: 1250, duration: 700 });
    });

    // Scale the assembled mark as one piece so its layers never separate.
    animate(logo, [
      { transform: stage, offset: 0 },
      { transform: stage, offset: 1250 / 3400, easing: ease },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale * 1.018})`, offset: 1500 / 3400, easing: ease },
      { transform: stage, offset: 2050 / 3400 },
      { transform: stage, offset: 2350 / 3400, easing: ease },
      { transform: 'translate(0, 0) scale(1)', offset: 1 }
    ], { duration: 3400, easing: 'linear' });
    after(2950, () => {
      root.classList.add('is-revealing');
      document.querySelectorAll('.headline-word').forEach((word, index) => {
        animate(word, [
          { transform: `translateX(${index === 0 ? '-115%' : '115%'})` },
          { transform: 'translateX(0)' }
        ], { delay: index * 120, duration: 1050 });
      });
      document.querySelectorAll('.stay-tuned, .identity-location, .announcement-location').forEach(element => {
        animate(element, [
          { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)' }
        ], { delay: 600, duration: 550 });
      });
    });
    after(4250, finish);
    window.addEventListener('resize', finish, { once: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    reduceMotion.addEventListener('change', finish, { once: true });
  }

  skip.addEventListener('click', finish);
  document.querySelector('.skip-link').addEventListener('click', finish);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') finish(); });
  start().catch(finish);
})();
