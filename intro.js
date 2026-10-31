(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const logo = document.querySelector('.official-logo');
  const animations = new Set();
  const timers = new Set();
  let finished = false;
  let runnerMotion = null;
  const ease = 'cubic-bezier(.25, .8, .25, 1)';
  const timing = {
    run: 1100, revealStart: 200, revealDuration: 1450,
    settleStart: 1800, settleDuration: 950,
    headlineDuration: 1350, headlineStagger: 100, finish: 3400
  };

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(window.introWatchdog);
    if(runnerMotion?.destroy)runnerMotion.destroy();else runnerMotion?.stop();
    timers.forEach(clearTimeout);
    animations.forEach(animation => animation.cancel());
    root.classList.remove('intro-pending', 'intro-playing', 'is-revealing');
    logo.removeAttribute('style');
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
    const hero = document.querySelector('.announcement').getBoundingClientRect();
    // Keep the desktop splash above the complete mountain ridgeline.
    const stageWidth = Math.min(width * .80, hero.height * .70 * (1568 / 1003), 620);
    const scale = stageWidth / box.width;
    const dx = width / 2 - (box.left + box.width / 2);
    const splashTop = hero.top + Math.max(12, hero.height * .035);
    const mobilePortrait = width <= 620 && window.innerHeight > width;
    const stageCenterY = mobilePortrait ? window.innerHeight / 2
      : splashTop + stageWidth / (2 * (1568 / 1003));
    const dy = stageCenterY - (box.top + box.height / 2);
    const stage = `translate(${dx}px, ${dy}px) scale(${scale})`;
    logo.style.transform = stage;
    root.classList.replace('intro-pending', 'intro-playing');

    const runner = document.querySelector('.logo-runner');
    runnerMotion = window.PapumPareRunner.create(document.querySelector('.runner-articulated'),{source,outline:document.querySelector('#runner-outline').getAttribute('d')});
    runnerMotion.play(timing.run);
    // Ground travel and the two-cycle stride share one clock.
    animate(runner, [
      { transform: 'translate(-850px, 0)', visibility: 'visible', offset: 0 },
      { transform: 'translate(-94.444px, 0)', visibility: 'visible', offset: .8, easing: 'cubic-bezier(.333333, .666667, .666667, 1)' },
      { transform: 'translate(0, 0)', visibility: 'visible', offset: 1 }
    ], { duration: timing.run, easing: 'linear' });

    // The same approved artwork moves throughout the stride. Its joint
    // transforms return to identity, so there is no runner fade or swap.

    // A wide feathered mask creates a directional fade, with no hard wipe edge.
    animate(document.querySelector('.logo-reveal-sweep'), [
      { transform: 'translateX(-2568px)' }, { transform: 'translateX(0)' }
    ], { delay: timing.revealStart, duration: timing.revealDuration, easing: 'linear' });

    // Keep the printed runner out of the background; the skinned original
    // remains solid and aligned as the complete mark moves into position.
    animate(logo, [{ transform: stage }, { transform: 'translate(0, 0) scale(1)' }], {
      delay: timing.settleStart, duration: timing.settleDuration
    });
    after(timing.settleStart, () => {
      root.classList.add('is-revealing');
      // Start each word just outside its viewport so its first visible motion
      // is gentle, then use symmetric easing for a quick, continuous glide.
      document.querySelectorAll('.headline-word').forEach((word, index) => {
        animate(word, [
          { transform: `translateX(${index === 0 ? '-850px' : '850px'})` },
          { transform: 'translateX(0)' }
        ], { delay: index * timing.headlineStagger, duration: timing.headlineDuration, easing: 'cubic-bezier(.37, 0, .63, 1)' });
      });
      document.querySelectorAll('.stay-tuned, .identity-location, .announcement-location').forEach(element => {
        animate(element, [
          { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)' }
        ], { delay: 480, duration: 450 });
      });
    });
    after(timing.finish, finish);
    window.addEventListener('resize', finish, { once: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    reduceMotion.addEventListener('change', finish, { once: true });
  }

  document.querySelector('.skip-link').addEventListener('click', finish);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') finish(); });
  start().catch(finish);
})();
