# Reusable Papum Pare runner

The running cycle is preserved separately from the coming-soon intro:

- `runner-motion.js` — joint solver, stride timing, continuous playback, and scroll scrubbing.
- `runner-skin.js` — continuous mesh that bends the approved artwork without seams or fades.
- `assets/brand/runner-rig.svg` — reusable skin canvas, outline, and static artwork fallback.
- `assets/brand/runner-rig-vector.svg` — preserved original articulated vector variant.
- `assets/brand/run-papum-pare-2026-logo-transparent-v2.webp` — the approved logo artwork used for the complete runner's original appearance.

Keep the SVG and WebP together. The SVG is a reusable source asset; use an inline SVG element with the JavaScript controller to animate it. The main page embeds the same rig directly so the intro does not wait for another fetch.

## Mount the saved rig

Load `runner-skin.js` and then `runner-motion.js` with normal script tags before this code:

```js
const text = await fetch('./assets/brand/runner-rig.svg').then(response => response.text());
const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
const svg = document.importNode(parsed.documentElement, true);
// Imported SVG resolves image URLs against the page, so set the asset URL explicitly.
svg.querySelector('image').setAttribute('href', './assets/brand/run-papum-pare-2026-logo-transparent-v2.webp');
document.querySelector('#runner-container').append(svg);
const image = new Image();
image.src = './assets/brand/run-papum-pare-2026-logo-transparent-v2.webp';
await image.decode();
const runner = PapumPareRunner.create(svg, {
  source: image,
  outline: svg.querySelector('#runner-outline').getAttribute('d')
});
```

## Playback

```js
runner.play();                              // Two strides, then the logo pose.
runner.play({ duration: 1100, loop: true });  // Continuous running, no settling.
runner.stop();                              // Cancel the animation frame.
```

The mesh uses the approved artwork throughout. Each bone returns to its original coordinates before the runner stops travelling, so there is no opacity transition or replacement figure. Continuous loops and scroll scrubbing keep the running cycle separate from this pose match.

The artwork skin needs WebGL. If it is unavailable, the coming-soon intro resolves immediately to the complete static page. The saved vector variant uses the same controller without a GPU skin: initialize it with `PapumPareRunner.create(svg)` and no options. The standalone saved SVG displays its static artwork until initialized.

Call `runner.destroy()` when removing a skin rig to stop its animation and release its GPU buffers and texture. Use `runner.stop()` when you intend to resume it.

Continuous playback automatically respects reduced-motion preferences at startup.

## Future scroll animation

```js
// progress is supplied by the future website's scroll controller, from 0 to 1.
runner.seek(progress); // One full stride; no independent animation timer.
```

`seek()` can be called in either direction. It stops continuous playback before rendering the requested pose, so scrolling and a timer cannot compete. Progress 0 and 1 are the same stride pose, allowing the future scroll controller to repeat the cycle. Keep the figure still when reduced motion is requested.

The runner's travel across the page is intentionally separate from its gait. The future website can position or translate the SVG along a scroll path while using `seek()` to control its limbs.

## Refresh the saved SVG

After adjusting the inline rig or its outline in `index.html`, regenerate the reusable asset:

```sh
node scripts/export-runner-rig.cjs
```

The export preserves the same canvas, outline, and approved artwork fallback. Check the motion and lifecycle tests with `node --test tests/*.test.cjs`.
