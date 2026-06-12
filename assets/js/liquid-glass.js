// ── Liquid-glass refraction ──
// Real lens refraction on the glass surfaces, after the technique in
// https://kube.io/blog/liquid-glass-css-svg/ : model the element as a
// glass slab with a circular bevel, derive per-pixel refraction vectors
// via Snell's law, encode them into an RGB displacement map, and apply
// it with an SVG feDisplacementMap inside backdrop-filter.
// Only Chromium renders SVG filters in backdrop-filter; everywhere else
// this script exits and the stylesheet's frosted blur remains.
(function () {
  if (!/Chrom(e|ium)/.test(navigator.userAgent)) return;

  const svgNS = 'http://www.w3.org/2000/svg';
  const host = document.createElementNS(svgNS, 'svg');
  host.setAttribute('width', '0');
  host.setAttribute('height', '0');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'absolute';
  const defs = document.createElementNS(svgNS, 'defs');
  host.appendChild(defs);
  document.body.appendChild(host);
  document.documentElement.classList.add('liquid-glass');

  const IOR = 1.5;

  // Displacement map for a w×h rounded rect: flat center, circular
  // bevel of width `bevel` at the rim, refracting through `depth` px of
  // glass. R encodes X displacement, G encodes Y, 128 = neutral.
  function buildMap(w, h, radius, bevel, depth) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const vec = new Float32Array(w * h * 2);
    const hw = w / 2, hh = h / 2;
    const r = Math.min(radius, hw, hh);
    let max = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - hw, py = y + 0.5 - hh;
        const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
        // Rounded-rect SDF and its outward normal
        let sdf, nx, ny;
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy);
          sdf = len - r;
          nx = qx / len;
          ny = qy / len;
        } else if (qx > qy) {
          sdf = qx - r; nx = 1; ny = 0;
        } else {
          sdf = qy - r; nx = 0; ny = 1;
        }
        const d = -sdf; // distance inward from the edge
        if (d >= 0 && d < bevel) {
          // Circular bevel: surface normal tilt grows toward the rim
          const sinA = Math.min(1 - d / bevel, 0.9999);
          const dev = Math.asin(sinA) - Math.asin(sinA / IOR);
          // The bevel acts as a prism with its base inward, so the
          // transmitted ray (and the sampled backdrop) shifts inward —
          // which also keeps sampling inside the filter region.
          const mag = -depth * Math.tan(dev);
          const i = (y * w + x) * 2;
          vec[i] = (px < 0 ? -nx : nx) * mag;
          vec[i + 1] = (py < 0 ? -ny : ny) * mag;
          const am = Math.max(Math.abs(vec[i]), Math.abs(vec[i + 1]));
          if (am > max) max = am;
        }
      }
    }
    // feDisplacementMap offsets by scale * (channel - 0.5)
    const scale = Math.max(1, max * 2);
    for (let p = 0, j = 0; p < w * h; p++, j += 2) {
      const o = p * 4;
      data[o]     = Math.round(255 * (0.5 + vec[j] / scale));
      data[o + 1] = Math.round(255 * (0.5 + vec[j + 1] / scale));
      data[o + 2] = 128;
      data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return { url: canvas.toDataURL(), scale };
  }

  let uid = 0;
  function liquefy(el, opts = {}) {
    const id = 'lq-' + (++uid);
    const filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const feImg = document.createElementNS(svgNS, 'feImage');
    feImg.setAttribute('x', '0');
    feImg.setAttribute('y', '0');
    feImg.setAttribute('result', 'map');
    const feDisp = document.createElementNS(svgNS, 'feDisplacementMap');
    feDisp.setAttribute('in', 'SourceGraphic');
    feDisp.setAttribute('in2', 'map');
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');
    filter.appendChild(feImg);
    filter.appendChild(feDisp);
    defs.appendChild(filter);

    let lastW = 0, lastH = 0, timer = null;
    function refresh() {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      const radius = Math.min(parseFloat(getComputedStyle(el).borderRadius) || 0, w / 2, h / 2);
      const bevel = (Math.min(w, h) / 2) * (opts.bevel ?? 1);
      const depth = Math.max(3, bevel * (opts.depth ?? 0.6));
      const map = buildMap(w, h, radius, bevel, depth);
      feImg.setAttribute('href', map.url);
      feImg.setAttribute('width', w);
      feImg.setAttribute('height', h);
      feDisp.setAttribute('scale', map.scale);
      el.style.backdropFilter =
        `url(#${id}) blur(${opts.blur ?? 2}px) saturate(${opts.saturate ?? 200}%) brightness(${opts.brightness ?? 1.05})`;
    }
    // Debounced: the nav lenses animate width, so the observer fires
    // throughout the transition — regenerate once it settles.
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 80);
    }).observe(el);
    refresh();
  }

  [
    ['nav.top-nav',        { blur: 3, saturate: 220, brightness: 1.06 }],
    ['nav.bottom-nav',     { blur: 3, saturate: 220, brightness: 1.06 }],
    ['.nav-lens',          { blur: 1, saturate: 240, brightness: 1.04, depth: 0.8 }],
    ['.bottom-nav-lens',   { blur: 1, saturate: 240, brightness: 1.04, depth: 0.8 }],
    ['.theme-toggle',      { blur: 2, saturate: 200 }],
    ['.scroll-dots',       { blur: 2, saturate: 200 }],
    ['.cmdk-trigger-hint', { blur: 2, saturate: 200 }]
  ].forEach(([sel, opts]) =>
    document.querySelectorAll(sel).forEach(el => liquefy(el, opts))
  );
})();
