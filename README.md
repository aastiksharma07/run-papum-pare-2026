# Run Papum Pare Marathon 2026

Repository for the Run Papum Pare Marathon 2026 coming-soon website and approved creative assets.

**RUN TODAY, INSPIRE GENERATIONS**

Papum Pare · Arunachal Pradesh

## Approved poster

The final client-approved poster below is the visual reference for the website. Preserve the official logo, warm ivory background, forest-green typography, sunrise accents, landscape-filled headline, and subtle contour treatment.

[View the full-resolution approved poster](Papum%20Pare%20Marathon%20Coming%20Soon.png)

![Run Papum Pare Marathon 2026 — Coming Soon](Papum%20Pare%20Marathon%20Coming%20Soon.png)

## Website

A responsive, buildless coming-soon page for GitHub Pages. The desktop layout places the official identity beside the announcement; mobile stacks them vertically. The exact approved poster lettering is retained as two independently animated SVG groups, with an accessible HTML heading. Both word layers share the optimized poster artwork; they are not retyped in a substitute font. The logo uses the approved transparent raster asset layered into the runner and a softly masked complete mark; the source artwork is unchanged.

The page includes the official motto, “Coming Soon,” “Stay Tuned,” and location. The composition scales to the available viewport height so desktop and mobile fit on one screen. The standalone transparent-sky mountain panorama scales proportionally at its original 3:1 aspect ratio, with no stretching, cropping, or fade. The header and footer markup are commented out for later reuse, with their styles retained. Fonts are served locally with their licenses. A short JavaScript intro slides the unaltered runner from left to right, softly fades in the complete logo from left to right, then settles it into its responsive position. The runner overlay remains opaque until it has arrived and the complete mark underneath is visible. The desktop intro stays above the mountain ridgeline; a static image takes over afterward for crisp rendering. “Coming” slides in from the left and “Soon” from the right as the logo begins moving to its final position, without opacity fades. Their longer, symmetric easing starts just outside the headline viewport to keep the first visible movement gentle. Escape, reduced-motion preferences, viewport resizing, and backgrounding all resolve immediately to the complete page. Without JavaScript, the final composition is visible. A bounded asset-loading wait and startup watchdog prevent the intro from blocking content. No registration form, unconfirmed dates, analytics, or external runtime dependencies are used.

### Local preview

From this folder, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173`. Choose another port if 4173 is occupied.

### GitHub Pages

Pages is configured to deploy from **main / (root)**. Pushing website changes to `main` updates the page. `.nojekyll` keeps the files as a plain static site.

The existing `CNAME` points to `runpapumpare.sovereignforge.us`; keep it when updating the site. Canonical and social preview metadata use its intended HTTPS address. The custom domain is served over HTTPS.

### Files

- `index.html`: page content, accessibility, artwork viewports, and sharing metadata.
- `styles.css`: brand palette, layout, poster headline layers, and motion preferences.
- `intro.js`: staged Web Animations API sequence, keyboard controls, and graceful fallbacks.
- `assets/approved-poster.webp`: optimized website copy of the approved poster.
- `assets/landscape/mountain-panorama.png`: reusable transparent-sky landscape source; the page uses the WebP copy.
- `assets/landscape/mountain-panorama-prompt.txt`: landscape generation brief.
- `assets/brand/run-papum-pare-2026-logo-transparent-v2.png`: reusable transparent logo for future materials; the matching lossless WebP is used on the website.
- `assets/contours.svg`: decorative, abstract contours; not a marathon route.
- `assets/fonts/`: self-hosted Manrope and Barlow Condensed fonts and licenses.
- `Papum Pare Marathon Coming Soon.png`: the original approved poster.

Only add event dates, registration, or official social links once confirmed.

### Transparent logo

The reusable PNG was produced with the built-in image generation tool as an AI-assisted background extraction from the client-approved poster, then checked for its wording and composition. It is a raster derivative, not an original vector master. The PNG preserves alpha transparency and the website uses a lossless WebP copy. The original poster is the approval reference.

The [extraction prompt](assets/brand/logo-extraction-prompt.txt) records the preservation constraints. A finishing pass added transparent safety space around the leaf ornament. Keep the transparent canvas when reusing the asset and avoid stretching its aspect ratio.
