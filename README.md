# Run Papum Pare Marathon 2026

Repository for the Run Papum Pare Marathon 2026 coming-soon website and approved creative assets.

**RUN TODAY, INSPIRE GENERATIONS**

Papum Pare · Arunachal Pradesh

## Approved poster

The final client-approved poster below is the visual reference for the website. Preserve the official logo, warm ivory background, forest-green typography, sunrise accents, landscape-filled headline, and subtle contour treatment.

[View the full-resolution approved poster](Papum%20Pare%20Marathon%20Coming%20Soon.png)

![Run Papum Pare Marathon 2026 — Coming Soon](Papum%20Pare%20Marathon%20Coming%20Soon.png)

## Website

A responsive, buildless coming-soon page for GitHub Pages. The desktop layout places the official identity beside the announcement; mobile stacks them vertically. The headline is displayed from the approved poster through an SVG viewport. The logo uses a separate transparent raster asset derived from the poster. The original poster PNG remains unchanged, and a 265 KB WebP copy is used for its website artwork.

The page includes the official motto, “Coming Soon,” “Stay Tuned,” location, and a link to the approved announcement. Fonts are served locally with their licenses. Subtle entrance and contour animations respect reduced-motion preferences. No JavaScript, registration form, unconfirmed dates, analytics, or external runtime dependencies are used.

### Local preview

From this folder, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173`. Choose another port if 4173 is occupied.

### GitHub Pages

Pages is configured to deploy from **main / (root)**. Pushing website changes to `main` updates the page. `.nojekyll` keeps the files as a plain static site.

The existing `CNAME` points to `runpapumpare.sovereignforge.us`; keep it when updating the site. Canonical and social preview metadata use its intended HTTPS address. GitHub must finish provisioning a valid certificate before HTTPS can be enforced in repository Settings → Pages.

### Files

- `index.html`: page content, accessibility, artwork viewports, and sharing metadata.
- `styles.css`: brand palette, layout, typography, and motion preferences.
- `assets/approved-poster.webp`: optimized website copy of the approved poster.
- `assets/brand/run-papum-pare-2026-logo-transparent-v2.png`: reusable transparent logo for future materials; the matching lossless WebP is used on the website.
- `assets/contours.svg`: decorative, abstract contours; not a marathon route.
- `assets/fonts/`: self-hosted Manrope and Barlow Condensed fonts and licenses.
- `Papum Pare Marathon Coming Soon.png`: the original approved poster.

Only add event dates, registration, or official social links once confirmed.

### Transparent logo

The reusable PNG was produced with the built-in image generation tool as an AI-assisted background extraction from the client-approved poster, then checked for its wording and composition. It is a raster derivative, not an original vector master. The PNG preserves alpha transparency and the website uses a lossless WebP copy. The original poster is the approval reference.

The [extraction prompt](assets/brand/logo-extraction-prompt.txt) records the preservation constraints. A finishing pass added transparent safety space around the leaf ornament. Keep the transparent canvas when reusing the asset and avoid stretching its aspect ratio.
