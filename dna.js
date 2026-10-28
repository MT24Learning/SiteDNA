// Measures this page the way SiteDNA measures any website, and draws its colors as a strip.
// Everything runs in the visitor's browser; nothing is sent anywhere.
(() => {
  const strip = document.getElementById('dna');
  if (!strip) return;

  // Any CSS color -> #RRGGBB by painting one pixel on a canvas
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const toHex = css => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a === 0 ? null : '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  // WCAG 2 contrast ratio
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

  // Count text and background colors of every visible element (the strip itself excluded)
  const counts = new Map();
  for (const el of [document.body, ...document.body.querySelectorAll('*')]) {
    if (strip.contains(el) || el.getClientRects().length === 0) continue;
    const s = getComputedStyle(el);
    for (const c of [s.color, s.backgroundColor]) {
      const hex = toHex(c);
      if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
    }
  }

  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 9);
  top.forEach(([hex, n], i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.background = hex;
    bar.style.flexGrow = Math.sqrt(n).toFixed(2); // wider = used more often
    bar.style.setProperty('--i', i);
    const label = document.createElement('span');
    label.textContent = hex;
    label.style.color = ratio(hex, '#FFFFFF') >= ratio(hex, '#0D1322') ? '#FFFFFF' : '#0D1322';
    bar.append(label);
    strip.append(bar);
  });
  strip.setAttribute('aria-label', 'Colors measured from this page, most used first: ' + top.map(([hex]) => hex).join(', '));

  document.getElementById('dnaCount').textContent = counts.size;
  document.getElementById('dnaFont').textContent =
    getComputedStyle(document.querySelector('h1')).fontFamily.split(',')[0].replace(/["']/g, '');

  const lede = document.querySelector('.lede');
  const r = ratio(toHex(getComputedStyle(lede).color), toHex(getComputedStyle(document.body).backgroundColor));
  const shown = (Math.floor(r * 10) / 10).toFixed(1); // rounded down, never flattering
  document.getElementById('dnaContrast').textContent = `${shown}:1, ${r >= 4.5 ? 'passes' : 'fails'} WCAG AA`;
})();
