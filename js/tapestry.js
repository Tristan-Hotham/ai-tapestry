/* The AI Tapestry: a hand-scrolled embroidery of the history of artificial intelligence, in the manner of the Bayeux
 * Tapestry. Every figure is built from a small kit of stitched shapes (laid-and-couched wool fills, stem-stitch
 * outlines) so a new scene is a few lines of data in data/scenes.js.
 * Dr Tristan Hotham, Independent researcher, 2026. MIT licence. Nothing is copied from the Bayeux Tapestry itself. */
(function (global) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const H = 560, TOP = 70, BOT = 470, G = 438;                 // strip height, band edges, ground line
  // wool, after the ten or so natural dyes of the original: madder reds, weld yellows, woad blues and greens
  const W = {
    linen: '#E9DDC1', thread: '#2E2620', red: '#A4452E', rust: '#B9663C', ochre: '#C99A3A', buff: '#D8BF8A',
    sage: '#7D8B55', green: '#4E6040', teal: '#3E6A68', blue: '#2F4766', sky: '#7C97A6', grey: '#8A8172', white: '#F3EBD6',
  };
  let svg, defs, uid = 0;
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

  // ---------------- materials: laid work (parallel couched threads) in each wool, and a slightly irregular stitch
  function materials() {
    defs = el('defs', {}, svg);
    // wool: a small wobble so no line is ruler-straight
    const f = el('filter', { id: 'wool', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '1', seed: '3', result: 'n' }, f);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '1.6' }, f);
    // the linen ground
    const l = el('filter', { id: 'linen', x: '0', y: '0', width: '100%', height: '100%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.55 0.9', numOctaves: '3', seed: '8', result: 't' }, l);
    el('feColorMatrix', { in: 't', type: 'matrix', values: '0 0 0 0 0.43  0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 0.22 0', result: 'c' }, l);
    el('feComposite', { in: 'c', in2: 'SourceGraphic', operator: 'over' }, l);
    for (const [k, c] of Object.entries(W)) {
      if (k === 'linen' || k === 'thread') continue;
      for (const [suf, ang] of [['', 35], ['v', 90], ['h', 0]]) {
        const p = el('pattern', { id: 'lw-' + k + suf, width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${ang})` }, defs);
        el('rect', { width: 4, height: 4, fill: c }, p);
        el('line', { x1: 0, y1: 0.5, x2: 4, y2: 0.5, stroke: shade(c, -0.18), 'stroke-width': 0.9 }, p);
        el('line', { x1: 0, y1: 2.5, x2: 4, y2: 2.5, stroke: shade(c, 0.1), 'stroke-width': 0.6, opacity: 0.7 }, p);
      }
    }
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
    return '#' + ((f(r) << 16) | (f(g) << 8) | f(b)).toString(16).padStart(6, '0');
  }
  const fill = (c, dir) => W[c] ? `url(#lw-${c}${dir || ''})` : c;

  // ---------------- the stitch kit (each takes a parent group and draws in local coordinates)
  function P(g, d, c, o) {
    o = o || {};
    return el('path', { d, fill: c ? fill(c, o.dir) : 'none', stroke: o.stroke || W.thread, 'stroke-width': o.w || 2.1,
      'stroke-dasharray': o.solid ? '' : '5.5 1.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#wool)', opacity: o.op || 1 }, g);
  }
  const L = (g, x1, y1, x2, y2, o) => P(g, `M${x1} ${y1} L${x2} ${y2}`, null, o);
  const C = (g, cx, cy, r, c, o) => P(g, `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`, c, o);
  const R = (g, x, y, w, h, c, o) => P(g, `M${x} ${y} h${w} v${h} h${-w} Z`, c, o);
  const T = (g, x, y, s, size, col, o) => {
    o = o || {};
    const t = el('text', { x, y, 'font-family': o.font || "'Cinzel', 'Trajan Pro', serif", 'font-size': size, fill: W[col] || col || W.blue,
      'text-anchor': o.anchor || 'middle', 'letter-spacing': o.ls == null ? 2 : o.ls, 'font-weight': o.bold ? 700 : 600, filter: 'url(#wool)', opacity: o.op || 1 }, g);
    if (o.halo) { t.setAttribute('stroke', W.linen); t.setAttribute('stroke-width', 6); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke-linejoin', 'round'); }
    t.textContent = s; return t;
  };
  const grp = (p, x, y, s, flip) => el('g', { transform: `translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}${s && s !== 1 ? ` scale(${s})` : ''}` }, p);

  // a person in the Bayeux manner, standing on y=0, facing right: oval head, short tunic, coloured hose
  // pose: stand | point | raise | cheer | sit | walk | lean | carry | type | think
  function person(p, x, o) {
    o = Object.assign({ tunic: 'red', legs: 'blue', hair: 'ochre', pose: 'stand', s: 1, face: 1 }, o || {});
    const g = grp(p, x, o.y == null ? G : o.y, o.s, o.face < 0);
    const sit = o.pose === 'sit' || o.pose === 'type';
    const hip = sit ? -42 : -46, sh = sit ? -80 : -84;
    // legs
    if (sit) {
      P(g, `M-4 ${hip} L14 ${hip + 2} L15 0 L11 0 L10 ${hip + 7} L-6 ${hip + 6} Z`, o.legs, { w: 1.7 });
      P(g, `M-9 ${hip + 1} L7 ${hip + 4} L8 0 L4 0 L3 ${hip + 9} L-10 ${hip + 7} Z`, o.legs2 || o.legs, { w: 1.7, dir: 'v' });
    } else {
      const st = o.pose === 'walk' || o.pose === 'carry' ? 11 : 5;
      P(g, `M-5 ${hip} L${-4 - st} -2 L${-st} -2 L1 ${hip + 6} Z`, o.legs, { w: 1.7, dir: 'v' });
      P(g, `M1 ${hip} L${2 + st} -2 L${6 + st} -2 L6 ${hip + 4} Z`, o.legs2 || o.legs, { w: 1.7, dir: 'v' });
      P(g, `M${-4 - st} -1 l-6 0`, null, { w: 2.6 }); P(g, `M${6 + st} -1 l7 0`, null, { w: 2.6 });
    }
    // tunic, flared at the hem, with a band at neck and hem
    P(g, `M-9 ${sh} Q-14 ${hip} -16 ${hip + 6} L16 ${hip + 6} Q13 ${hip} 9 ${sh} Q0 ${sh - 4} -9 ${sh} Z`, o.tunic);
    P(g, `M-16 ${hip + 2} L16 ${hip + 2}`, null, { w: 1.4, stroke: shade(W[o.tunic] || o.tunic, -0.35) });
    if (o.cloak) P(g, `M-9 ${sh} Q-22 ${sh + 20} -19 ${hip + 2} L-12 ${hip} Q-12 ${sh + 14} -4 ${sh - 2} Z`, o.cloak);
    // arms by pose (shoulder at 0,sh); a = [upper end x,y, hand x,y] for front and back arm
    const A = {
      stand: [[6, sh + 20, 8, sh + 34], [-6, sh + 20, -8, sh + 34]],
      point: [[20, sh + 4, 36, sh - 2], [-6, sh + 20, -8, sh + 34]],
      raise: [[14, sh - 14, 18, sh - 30], [-6, sh + 20, -8, sh + 34]],
      cheer: [[14, sh - 14, 20, sh - 30], [-14, sh - 14, -20, sh - 30]],
      sit: [[16, sh + 14, 28, sh + 14], [-4, sh + 20, 4, sh + 30]],
      walk: [[12, sh + 18, 18, sh + 30], [-12, sh + 18, -18, sh + 28]],
      lean: [[18, sh + 10, 30, sh + 18], [10, sh + 16, 24, sh + 26]],
      carry: [[16, sh + 8, 30, sh + 2], [10, sh + 12, 26, sh + 6]],
      type: [[18, sh + 14, 32, sh + 20], [12, sh + 18, 28, sh + 24]],
      think: [[12, sh + 18, 6, sh - 4], [-6, sh + 20, -8, sh + 34]],
    }[o.pose] || [[6, sh + 20, 8, sh + 34], [-6, sh + 20, -8, sh + 34]];
    for (const [i, a] of A.entries()) {
      const sx = i ? -6 : 6;
      P(g, `M${sx} ${sh + 2} L${a[0]} ${a[1]} L${a[2]} ${a[3]}`, null, { w: 4.6, stroke: shade(W[o.tunic] || o.tunic, i ? -0.25 : -0.1), solid: true });
      P(g, `M${sx} ${sh + 2} L${a[0]} ${a[1]} L${a[2]} ${a[3]}`, null, { w: 1.2 });
      C(g, a[2], a[3], 2.6, 'white', { w: 1.2 });
    }
    // head: oval, cap of hair, nose to the right, an eye
    P(g, `M-1 ${sh - 2} l0 -5`, null, { w: 4, stroke: W.white, solid: true });
    P(g, `M-7 ${sh - 14} Q-8 ${sh - 26} 1 ${sh - 27} Q10 ${sh - 26} 9 ${sh - 15} L11 ${sh - 12} L8 ${sh - 11} Q6 ${sh - 5} 0 ${sh - 5} Q-7 ${sh - 6} -7 ${sh - 14} Z`, 'white');
    if (o.bald !== true) P(g, `M-8 ${sh - 13} Q-9 ${sh - 28} 1 ${sh - 28} Q9 ${sh - 28} 9 ${sh - 19} Q3 ${sh - 22} -2 ${sh - 19} Q-4 ${sh - 15} -8 ${sh - 13} Z`, o.hair);
    if (o.long) P(g, `M-8 ${sh - 14} Q-12 ${sh - 2} -6 ${sh + 6} L-2 ${sh - 6} Z`, o.hair);
    if (o.beard) P(g, `M0 ${sh - 6} Q6 ${sh - 2} 9 ${sh - 10} Q8 ${sh - 4} 2 ${sh - 2} Z`, o.hair);
    C(g, 4, sh - 17, 0.9, W.thread, { w: 1, solid: true });
    if (o.crown) P(g, `M-7 ${sh - 27} l2 -8 l3 5 l3 -7 l3 7 l3 -5 l1 8 Z`, 'ochre', { w: 1.4 });
    if (o.hat) P(g, `M-9 ${sh - 25} Q1 ${sh - 40} 11 ${sh - 25} Z`, o.hat, { w: 1.4 });
    if (o.mitre) P(g, `M-6 ${sh - 26} L-2 ${sh - 42} L2 ${sh - 33} L6 ${sh - 42} L9 ${sh - 26} Z`, o.mitre, { w: 1.4 });
    // what they hold, in the front hand
    const hx = A[0][2], hy = A[0][3];
    if (o.hold === 'scroll') { R(g, hx - 2, hy - 18, 8, 22, 'white', { w: 1.3 }); for (let k = 0; k < 4; k++) L(g, hx, hy - 13 + k * 4, hx + 4, hy - 13 + k * 4, { w: 0.8 }); }
    if (o.hold === 'quill') { P(g, `M${hx} ${hy} L${hx + 10} ${hy - 22} Q${hx + 14} ${hy - 14} ${hx + 2} ${hy - 2} Z`, 'white', { w: 1.1 }); }
    if (o.hold === 'staff') L(g, hx, hy + 30, hx + 2, hy - 40, { w: 2.4 });
    if (o.hold === 'cup') P(g, `M${hx - 5} ${hy - 8} L${hx + 5} ${hy - 8} L${hx + 3} ${hy} L${hx - 3} ${hy} Z`, 'ochre', { w: 1.2 });
    if (o.hold === 'coin') C(g, hx + 2, hy - 2, 4, 'ochre', { w: 1.2 });
    if (o.hold === 'trumpet') P(g, `M${hx} ${hy} L${hx + 26} ${hy - 12} L${hx + 30} ${hy - 20} L${hx + 32} ${hy - 4} L${hx + 26} ${hy - 9} Z`, 'ochre', { w: 1.3 });
    if (o.hold === 'book') R(g, hx - 6, hy - 14, 14, 16, 'blue', { w: 1.3 });
    if (o.hold === 'medal') { L(g, hx, hy, hx, hy + 8, { w: 1 }); C(g, hx, hy + 12, 5, 'ochre', { w: 1.3 }); }
    if (o.hold === 'phone') R(g, hx - 2, hy - 10, 6, 11, 'blue', { w: 1.2 });
    return g;
  }

  // ---------------- things
  const things = {
    // Babbage's Analytical Engine: columns of figure wheels on a frame, a crank
    engine(p, x, o) {
      const g = grp(p, x, G, (o && o.s) || 1);
      R(g, -60, -150, 120, 8, 'ochre'); R(g, -64, -6, 128, 8, 'ochre');
      for (let i = 0; i < 5; i++) { const cx = -44 + i * 22; L(g, cx, -142, cx, -6, { w: 2.4 }); for (let k = 0; k < 6; k++) P(g, `M${cx - 8} ${-128 + k * 20} h16 l-2 6 h-12 Z`, k % 2 ? 'rust' : 'buff', { w: 1.2 }); }
      C(g, 72, -70, 12, 'sage'); L(g, 72, -70, 90, -88, { w: 2.6 }); C(g, 90, -88, 3, 'red', { w: 1 });
      if (o && o.unfinished) for (let i = 0; i < 3; i++) P(g, `M${64 + i * 6} -150 q6 ${20 + i * 8} -2 ${40 + i * 10}`, null, { w: 1.2, op: 0.7, stroke: W.rust });
      return g;
    },
    cards(p, x, y, n) { const g = grp(p, x, y); for (let i = 0; i < (n || 5); i++) { R(g, i * 6, -i * 4, 30, 18, 'buff', { w: 1.1 }); for (let k = 0; k < 4; k++) C(g, i * 6 + 6 + k * 6, -i * 4 + 8, 1.2, W.thread, { w: 0.6, solid: true }); } return g; },
    // a hanging curtain between two rooms (the imitation game)
    curtain(p, x, h) { const g = grp(p, x, G); L(g, -40, -(h || 190), 40, -(h || 190), { w: 3 }); for (let i = 0; i < 6; i++) P(g, `M${-38 + i * 13} ${-(h || 190)} q-6 ${(h || 190) / 2} 0 ${(h || 190) - 4}`, null, { w: 1.6 }); P(g, `M-38 ${-(h || 190)} h76 v${(h || 190) - 4} h-76 Z`, 'teal', { op: 0.55, w: 1 }); return g; },
    // a hall with round arches (a college, a mansion)
    hall(p, x, o) {
      o = o || {}; const w = o.w || 220, h = o.h || 170, g = grp(p, x, G);
      R(g, -w / 2, -h, w, h, o.c || 'buff', { dir: 'h' });
      P(g, `M${-w / 2 - 12} ${-h} L0 ${-h - 50} L${w / 2 + 12} ${-h} Z`, o.roof || 'red', { dir: 'v' });
      for (let i = 0; i < (o.arches || 4); i++) { const ax = -w / 2 + (i + 0.5) * w / (o.arches || 4); P(g, `M${ax - 12} 0 v-46 a12 12 0 0 1 24 0 v46`, 'blue', { w: 1.6 }); }
      if (o.tower) { R(g, w / 2 - 30, -h - 70, 30, 70, o.c || 'buff'); P(g, `M${w / 2 - 34} ${-h - 70} L${w / 2 - 15} ${-h - 100} L${w / 2 + 4} ${-h - 70} Z`, 'teal'); }
      if (o.label) T(g, 0, -h + 22, o.label, 13, 'blue', { ls: 1 });
      return g;
    },
    // a stylised tree, the original's way of dividing one scene from the next
    tree(p, x, o) {
      o = o || {}; const g = grp(p, x, G, o.s || 1);
      P(g, 'M-5 0 Q-3 -60 0 -120 Q3 -60 5 0 Z', 'rust', { dir: 'v' });
      for (let i = 0; i < 4; i++) { const y = -60 - i * 26, d = 34 - i * 6; P(g, `M0 ${y} Q${-d} ${y - 6} ${-d - 6} ${y - 28} Q${-d / 2} ${y - 18} 0 ${y - 12} Z`, i % 2 ? 'sage' : 'green'); P(g, `M0 ${y} Q${d} ${y - 6} ${d + 6} ${y - 28} Q${d / 2} ${y - 18} 0 ${y - 12} Z`, i % 2 ? 'green' : 'sage'); }
      P(g, 'M-14 -164 Q0 -196 14 -164 Q0 -172 -14 -164 Z', 'teal');
      return g;
    },
    // a table for a feast
    table(p, x, o) { const g = grp(p, x, G); const w = (o && o.w) || 200; P(g, `M${-w / 2} -46 Q0 -54 ${w / 2} -46 L${w / 2 - 10} -30 L${-w / 2 + 10} -30 Z`, 'white', { dir: 'h' }); L(g, -w / 2 + 16, -30, -w / 2 + 12, 0, { w: 2.4 }); L(g, w / 2 - 16, -30, w / 2 - 12, 0, { w: 2.4 }); for (let i = 0; i < 4; i++) { const cx = -w / 2 + 30 + i * (w - 60) / 3; C(g, cx, -54, 7, i % 2 ? 'ochre' : 'rust', { w: 1.2 }); } return g; },
    // a terminal or screen on a desk; text optional
    screen(p, x, o) {
      o = o || {}; const g = grp(p, x, G, o.s || 1);
      R(g, -26, -40, 52, 40, 'buff', { dir: 'h' });
      R(g, -24, -98, 48, 42, 'grey'); R(g, -18, -92, 36, 30, o.glow || 'teal', { w: 1.2 });
      if (o.text) T(g, 0, -74, o.text, Math.min(7, 44 / o.text.length), 'white', { ls: 0.5, font: "'IBM Plex Mono', monospace" });
      R(g, -6, -56, 12, 16, 'grey', { w: 1.2 });
      return g;
    },
    // a cabinet of the expert-system era, with blinking lamps and tape reels
    cabinet(p, x, o) { const g = grp(p, x, G, (o && o.s) || 0.9); R(g, -30, -150, 60, 150, o && o.c || 'blue', { dir: 'v' }); C(g, -12, -124, 10, 'buff'); C(g, 12, -124, 10, 'buff'); for (let i = 0; i < 5; i++) C(g, -18 + i * 9, -92, 2.5, i % 2 ? 'red' : 'ochre', { w: 1 }); if (o && o.label) T(g, 0, -60, o.label, Math.min(10, 80 / o.label.length), 'white', { ls: 0.3 }); return g; },
    chess(p, x) { const g = grp(p, x, G); P(g, 'M-60 -60 L60 -60 L80 -30 L-80 -30 Z', 'white'); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) P(g, `M${-60 + i * 15 - j * 10} ${-60 + j * 15} l15 0 l-5 15 l-15 0 Z`, 'blue', { w: 0.8 }); L(g, -70, -30, -70, 0, { w: 2.4 }); L(g, 70, -30, 70, 0, { w: 2.4 }); P(g, 'M-14 -64 q-2 -16 6 -24 q10 -4 10 8 q-6 -2 -6 6 l6 10 Z', 'white'); P(g, 'M16 -64 l2 -18 l-4 -6 l10 0 l-4 6 l2 18 Z', 'blue'); return g; },
    // a quiz podium with a screen
    podium(p, x, o) { const g = grp(p, x, G); P(g, 'M-26 0 L-22 -70 L22 -70 L26 0 Z', (o && o.c) || 'blue', { dir: 'v' }); R(g, -18, -64, 36, 18, 'teal', { w: 1.2 }); if (o && o.label) T(g, 0, -51, o.label, 9, 'white', { ls: 0.5 }); return g; },
    // a graphics card, rendered as a furnace with fans (the forge of the deep-learning age)
    gpu(p, x, o) { const g = grp(p, x, G, (o && o.s) || 1); R(g, -50, -60, 100, 60, 'grey', { dir: 'h' }); C(g, -24, -30, 17, 'blue'); C(g, 24, -30, 17, 'blue'); for (const cx of [-24, 24]) for (let i = 0; i < 4; i++) L(g, cx, -30, cx + 15 * Math.cos(i * 1.57 + 0.4), -30 + 15 * Math.sin(i * 1.57 + 0.4), { w: 1.2 }); for (let i = 0; i < 3; i++) P(g, `M${-30 + i * 30} -64 q-8 -14 0 -26 q8 12 0 26`, 'rust', { w: 1.2 }); return g; },
    cat(p, x, o) { const g = grp(p, x, (o && o.y) || G, (o && o.s) || 1, o && o.face < 0); P(g, 'M-20 0 Q-22 -22 -2 -24 Q12 -24 14 -16 L16 -30 L20 -20 L24 -30 L26 -14 Q30 -2 22 0 Z', (o && o.c) || 'ochre'); P(g, 'M-20 -6 Q-36 -10 -32 -28', null, { w: 2.2 }); C(g, 20, -16, 0.9, W.thread, { w: 1 }); return g; },
    // a Go board with stones
    go(p, x) { const g = grp(p, x, G); P(g, 'M-56 -50 L56 -50 L70 -26 L-70 -26 Z', 'buff'); for (let i = 0; i < 6; i++) L(g, -52 + i * 22, -50, -64 + i * 26, -26, { w: 0.9 }); for (let i = 0; i < 3; i++) L(g, -56 + i * 4, -50 + i * 8, 56 + i * 4.7, -50 + i * 8, { w: 0.9 }); for (const [sx, sy, c] of [[-30, -44, 'white'], [-6, -36, 'blue'], [20, -42, 'white'], [34, -32, 'blue'], [8, -30, 'red']]) C(g, sx, sy, 4.2, c, { w: 1 }); L(g, -64, -26, -64, 0, { w: 2.4 }); L(g, 64, -26, 64, 0, { w: 2.4 }); return g; },
    // a comet with a fiery tail, after the star the people point at in the original
    comet(p, x, y) { const g = grp(p, x, y); for (let i = 0; i < 5; i++) P(g, `M0 0 Q${-60 - i * 6} ${-20 + i * 10} ${-150 + i * 8} ${-14 + i * 12}`, null, { w: 3 - i * 0.3, stroke: [W.red, W.rust, W.ochre, W.red, W.rust][i] }); C(g, 0, 0, 13, 'ochre'); for (let i = 0; i < 8; i++) L(g, 0, 0, 22 * Math.cos(i * 0.785), 22 * Math.sin(i * 0.785), { w: 1.6 }); return g; },
    // a chest bound with iron (the model kept back)
    chest(p, x, o) { const g = grp(p, x, G); P(g, 'M-34 0 L-34 -40 Q0 -62 34 -40 L34 0 Z', 'rust', { dir: 'h' }); L(g, -34, -40, 34, -40, { w: 2.4 }); for (const bx of [-18, 18]) L(g, bx, -50, bx, 0, { w: 3, stroke: W.grey }); R(g, -6, -36, 12, 12, 'ochre', { w: 1.2 }); return g; },
    // a protein, as a folded ribbon
    protein(p, x, y) { const g = grp(p, x, y); P(g, 'M-50 20 C-40 -40 -10 40 0 -10 C10 -60 30 30 40 -20 C46 -50 60 -10 50 10 C40 30 10 10 0 30 C-20 50 -40 10 -50 20 Z', 'teal'); P(g, 'M-44 10 C-30 -20 -10 20 0 0 C10 -30 30 10 40 -10', null, { w: 1.6, stroke: W.ochre }); return g; },
    // a longship, the Bayeux fleet (here: the fleet of the data centres)
    ship(p, x, o) {
      o = o || {}; const g = grp(p, x, G + 4, o.s || 1, o.face < 0);
      P(g, 'M-90 -20 Q-96 -46 -110 -60 Q-92 -54 -84 -30 L80 -30 Q92 -54 110 -62 Q100 -44 94 -20 Q0 6 -90 -20 Z', o.c || 'rust', { dir: 'h' });
      for (let i = 0; i < 7; i++) C(g, -60 + i * 20, -26, 6, i % 2 ? 'ochre' : 'teal', { w: 1.1 });
      L(g, 0, -30, 0, -150, { w: 3 });
      P(g, 'M2 -146 Q50 -120 46 -60 L2 -60 Z', o.sail || 'white');
      if (o.cargo) for (let i = 0; i < 3; i++) R(g, -50 + i * 34, -52, 26, 22, 'grey', { w: 1.3 });
      for (let i = 0; i < 6; i++) P(g, `M${-100 + i * 40} 2 q10 -8 20 0 q10 8 20 0`, null, { w: 1.3, stroke: W.teal });
      return g;
    },
    whale(p, x, o) { const g = grp(p, x, G - 6, (o && o.s) || 1, o && o.face < 0); P(g, 'M-80 -10 Q-70 -60 0 -60 Q60 -58 80 -26 Q86 -14 70 -8 Q30 4 -40 -2 L-70 14 L-64 -6 L-92 -14 Q-84 -16 -80 -10 Z', 'blue', { dir: 'h' }); P(g, 'M-60 -20 Q0 -10 66 -16', null, { w: 1.4, stroke: W.white }); C(g, 52, -34, 2, W.thread, { w: 1 }); for (let i = 0; i < 3; i++) P(g, `M10 -62 q${-10 + i * 10} -20 ${-6 + i * 12} -34`, null, { w: 1.4, stroke: W.sky }); for (let i = 0; i < 6; i++) P(g, `M${-100 + i * 36} 8 q9 -7 18 0 q9 7 18 0`, null, { w: 1.3, stroke: W.teal }); return g; },
    // a falling coin shower, and a chart going down
    coins(p, x, y, n, fall) { const g = grp(p, x, y); for (let i = 0; i < (n || 6); i++) C(g, (i % 3) * 14 - 14, (fall ? i * 16 : -i * 6), 6, 'ochre', { w: 1.2 }); return g; },
    // a snowflake, frost on the border
    flake(p, x, y, s) { const g = grp(p, x, y, s || 1); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; L(g, 0, 0, 12 * Math.cos(a), 12 * Math.sin(a), { w: 1.6, stroke: W.sky }); } return g; },
    // a speech scroll above a figure
    speech(p, x, y, s, o) { const g = grp(p, x, y); const w = Math.max(60, s.length * 7.2 + 16); P(g, `M${-w / 2} -14 h${w} v18 h${-w / 2 + 14} l-10 10 l-2 -10 h${-w / 2 + 2} Z`, 'white', { w: 1.3 }); T(g, 0, 0, s, 10, (o && o.c) || 'blue', { ls: 0.6, font: "'IBM Plex Mono', monospace" }); return g; },
    // a laurel-wreathed medal
    medal(p, x, y) { const g = grp(p, x, y); C(g, 0, 0, 16, 'ochre'); C(g, 0, 0, 9, 'buff', { w: 1.2 }); for (let i = 0; i < 6; i++) { P(g, `M${-18 - i} ${10 - i * 6} q-8 -2 -6 -8 q6 0 6 8`, 'sage', { w: 1 }); P(g, `M${18 + i} ${10 - i * 6} q8 -2 6 -8 q-6 0 -6 8`, 'sage', { w: 1 }); } return g; },
    // a little stitched robot helper (an agent)
    agent(p, x, o) { o = o || {}; const g = grp(p, x, G, o.s || 1, o.face < 0); R(g, -12, -46, 24, 30, o.c || 'teal'); R(g, -9, -64, 18, 16, 'buff'); C(g, -3, -57, 1.5, W.thread, { w: 1 }); C(g, 4, -57, 1.5, W.thread, { w: 1 }); L(g, 0, -64, 0, -72, { w: 1.4 }); C(g, 0, -74, 2.4, 'red', { w: 1 }); L(g, -6, -16, -8, 0, { w: 3 }); L(g, 6, -16, 8, 0, { w: 3 }); if (o.carry) R(g, 14, -50, 16, 14, o.carry, { w: 1.2 }); return g; },
    // a needle with a long thread, for the unfinished end
    needle(p, x, y) { const g = grp(p, x, y); P(g, 'M0 0 L90 -40 L92 -36 Z', 'grey', { w: 1.2 }); P(g, 'M90 -40 C140 -80 180 20 230 -30 C260 -60 300 0 330 -20', null, { w: 2, stroke: W.red, solid: true }); return g; },
    // a stool or bench to sit on
    bench(p, x, w) { const g = grp(p, x, G); R(g, -(w || 30) / 2, -44, w || 30, 6, 'rust', { w: 1.4 }); L(g, -(w || 30) / 2 + 4, -38, -(w || 30) / 2 + 2, 0, { w: 2.2 }); L(g, (w || 30) / 2 - 4, -38, (w || 30) / 2 - 2, 0, { w: 2.2 }); return g; },
    sun(p, x, y) { const g = grp(p, x, y); C(g, 0, 0, 14, 'ochre'); for (let i = 0; i < 10; i++) { const a = i * 0.628; L(g, 18 * Math.cos(a), 18 * Math.sin(a), 26 * Math.cos(a), 26 * Math.sin(a), { w: 1.6 }); } return g; },
    // a calendar page reading AESTAS, for the summer it was meant to take
    calendar(p, x, y, t) { const g = grp(p, x, y); R(g, -26, -30, 52, 40, 'white', { w: 1.3 }); R(g, -26, -30, 52, 10, 'red', { w: 1.2 }); T(g, 0, 2, t || 'AESTAS', 9, 'blue', { ls: 0.5 }); return g; },
    // a couch (for the patient who confides in ELIZA)
    couch(p, x) { const g = grp(p, x, G); P(g, 'M-50 0 L-50 -30 Q-50 -48 -36 -46 L40 -34 L44 0 Z', 'sage'); P(g, 'M-50 -30 Q-70 -36 -62 -54 Q-48 -56 -46 -40', 'sage'); return g; },
    star(p, x, y, s) { const g = grp(p, x, y, s || 1); P(g, 'M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3 Z', 'ochre', { w: 1.1 }); return g; },
    // a book or paper title, held up as a banner
    banner(p, x, y, t, o) { const g = grp(p, x, y); const w = Math.max(80, t.length * 7.6 + 20); P(g, `M${-w / 2} -16 h${w} l-8 12 l8 12 h${-w} l8 -12 Z`, (o && o.c) || 'white', { w: 1.4 }); T(g, 0, 4, t, 10, (o && o.tc) || 'red', { ls: 0.8 }); return g; },
  };

  // margin creatures for the borders: pairs of birds and beasts, as in the original's borders
  function beast(p, x, y, k, face) {
    const g = grp(p, x, y, 1.35, face < 0);
    if (k === 0) { P(g, 'M-14 0 Q-12 -14 2 -14 Q8 -22 14 -16 L18 -14 L12 -10 Q12 0 -14 0 Z', 'teal'); P(g, 'M-10 -6 Q-2 -24 6 -10', 'ochre', { w: 1.2 }); L(g, -4, 0, -6, 8, { w: 1.4 }); L(g, 4, 0, 6, 8, { w: 1.4 }); }
    else if (k === 1) { P(g, 'M-18 -4 Q-16 -16 0 -16 Q14 -16 16 -8 L22 -14 L20 -4 Q18 2 -18 -4 Z', 'rust'); for (const lx of [-12, -4, 6, 12]) L(g, lx, -2, lx - 1, 10, { w: 1.6 }); P(g, 'M-18 -8 q-10 -6 -6 -16', null, { w: 1.4 }); }
    else { P(g, 'M-14 4 Q-16 -10 -2 -12 Q10 -14 14 -4 Q8 6 -14 4 Z', 'sage'); P(g, 'M10 -10 L16 -18 L18 -8 Z', 'ochre', { w: 1 }); }
    return g;
  }

  // ---------------- build the strip
  function build(container, scenes, opts) {
    opts = opts || {};
    const SC = opts.scale || 1.95;   // figures are drawn at about two-thirds of the band's height, as in the original
    let total = 60; for (const s of scenes) total += s.w * SC + (s.divider === false ? 0 : 70);
    total += 40;
    svg = el('svg', { viewBox: `0 0 ${total} ${H}`, height: '100%', class: 'tap-svg', role: 'img', 'aria-label': 'The AI Tapestry: an embroidered history of artificial intelligence' }, null);
        materials();
    el('rect', { x: 0, y: 0, width: total, height: H, fill: W.linen, filter: 'url(#linen)' }, svg);
    // border bands: framing lines, diagonal bars dividing little panels
    const bands = el('g', {}, svg);
    for (const y of [TOP, BOT]) { L(bands, 10, y, total - 10, y, { w: 2.4 }); L(bands, 10, y + (y === TOP ? -4 : 4), total - 10, y + (y === TOP ? -4 : 4), { w: 1.2, op: 0.7 }); }
    L(bands, 10, 8, total - 10, 8, { w: 1.6 }); L(bands, 10, H - 8, total - 10, H - 8, { w: 1.6 });
    let k = 0;
    for (let x = 40; x < total - 60; x += 110, k++) {
      for (const [y0, y1] of [[10, TOP - 6], [BOT + 6, H - 10]]) P(bands, `M${x} ${y0} L${x + 30} ${y1} L${x + 38} ${y1} L${x + 8} ${y0} Z`, k % 2 ? 'red' : 'teal', { w: 1.2 });
    }
    // scenes
    const out = []; let x = 60;
    for (const [i, s] of scenes.entries()) {
      const g = el('g', { class: 'scene', 'data-i': i, transform: `translate(${x} 0)`, tabindex: 0 }, svg);
      const sw = s.w * SC;
      el('rect', { x: -20, y: TOP, width: sw + 40, height: BOT - TOP, fill: 'transparent', class: 'hit' }, g);
      // caption across the top of the main band, in the manner of the original's Latin
      if (s.latin) {
        const words = s.latin.split(' '); let line = '', lines = [];
        for (const w of words) { if ((line + ' ' + w).length > sw / 24 && line) { lines.push(line); line = w; } else line = line ? line + ' ' + w : w; }
        lines.push(line);
        lines.forEach((t, j) => T(g, sw / 2, TOP + 34 + j * 30, t, 25, j % 2 ? 'red' : 'blue', { ls: 3 }));
      }
      T(g, sw - 6, BOT - 10, String(s.year), 15, 'rust', { anchor: 'end', ls: 1 });
      const gd = el('g', { transform: `translate(0 ${G}) scale(${SC}) translate(0 ${-G})` }, g);
      for (const it of s.draw || []) {
        const [fn, ...a] = it;
        if (fn === 'person') person(gd, a[0], a[1]);
        else if (fn === 'text') T(gd, a[0], a[1], a[2], a[3] || 12, a[4] || 'blue', a[5]);
        else if (things[fn]) things[fn](gd, ...a);
      }
      // margins: a pair of beasts each side unless the scene has its own marginal joke
      const mt = el('g', {}, g), mb = el('g', {}, g);
      const X = a => [a[0] * SC].concat(a.slice(1));
      if (s.top) for (const it of s.top) { const [fn, ...a0] = it, a = X(a0); if (fn === 'text') T(mt, a[0], a[1], a[2], (a[3] || 10) * 1.45, a[4] || 'blue', Object.assign({ ls: 0.6, halo: true }, a[5] || {})); else if (things[fn]) things[fn](mt, ...a); }
      else { beast(mt, sw * 0.3, 40, i % 3, 1); beast(mt, sw * 0.7, 40, i % 3, -1); }
      if (s.bottom) for (const it of s.bottom) { const [fn, ...a0] = it, a = X(a0); if (fn === 'person') person(mb, a[0], Object.assign({ y: H - 14, s: 0.45 }, a[1])); else if (fn === 'text') T(mb, a[0], a[1], a[2], (a[3] || 10) * 1.45, a[4] || 'blue', Object.assign({ ls: 0.6, halo: true }, a[5] || {})); else if (things[fn]) things[fn](mb, ...a); }
      else { beast(mb, sw * 0.3, 525, (i + 1) % 3, 1); beast(mb, sw * 0.7, 525, (i + 1) % 3, -1); }
      out.push({ x, w: sw, el: g });
      x += sw;
      if (s.divider !== false && i < scenes.length - 1) { things.tree(svg, x + 35, { s: 1.05 }); x += 70; }
    }
    container.appendChild(svg);
    return { svg, total, scenes: out, H };
  }

  global.Tapestry = { build, W, person, things };
})(window);
