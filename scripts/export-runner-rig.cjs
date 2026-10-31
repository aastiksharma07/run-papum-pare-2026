// Export a portable SVG preview/fallback of the approved runner. The animated
// canvas lives in HTML, outside SVG, to preserve Safari transform behavior.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const defs=source.split('<!-- runner-skin-defs:start -->')[1].split('<!-- runner-skin-defs:end -->')[0];
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="840 170 500 520" role="img" aria-labelledby="runner-asset-title">\n<title id="runner-asset-title">Run Papum Pare reusable runner</title>\n<defs>${defs}</defs>\n<image href="./run-papum-pare-2026-logo-transparent-v2.webp" width="1568" height="1003" clip-path="url(#runner-clip)"/>\n</svg>\n`;
fs.writeFileSync(path.join(root,'assets/brand/runner-rig.svg'),svg);
