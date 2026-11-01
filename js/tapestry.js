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
    black: '#2E2925', pink: '#C98C7C',
    // skin and hair wools for the faces
    skin: '#F1E5CB', tan: '#DDB78C', olive: '#C99E74', brown: '#94643F', deep: '#6E4A2E', chestnut: '#6B4A32', silver: '#CFC8B8',
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
    mailPattern();
  }
  function mailPattern() {
    const p = el('pattern', { id: 'mail', width: 4, height: 3.4, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 4, height: 3.4, fill: '#9A9284' }, p);
    for (const [cx, cy] of [[1, 1], [3, 2.7]]) el('circle', { cx, cy, r: 1.05, fill: 'none', stroke: '#4A443B', 'stroke-width': 0.55 }, p);
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
    if (o.transformFrom) { const m = /translate\(([-\d.e]+) ([-\d.e]+)\)(?: scale\(-1 1\))?(?: scale\(([-\d.e]+)\))?/.exec(o.transformFrom.getAttribute('transform')); const sc = m && m[3] ? +m[3] : 1; x = (m ? +m[1] : 0) + x; y = (m ? +m[2] : 0) + o.dy * sc; size = size * Math.max(0.75, sc); }
    const t = el('text', { x, y, 'font-family': o.font || "'Cinzel', 'Trajan Pro', serif", 'font-size': size, fill: W[col] || col || W.blue,
      'text-anchor': o.anchor || 'middle', 'letter-spacing': o.ls == null ? 2 : o.ls, 'font-weight': o.bold ? 700 : 600, filter: 'url(#wool)', opacity: o.op || 1 }, g);
    if (o.halo) { t.setAttribute('stroke', W.linen); t.setAttribute('stroke-width', 6); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke-linejoin', 'round'); }
    t.textContent = s; return t;
  };
  const grp = (p, x, y, s, flip) => el('g', { transform: `translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}${s && s !== 1 ? ` scale(${s})` : ''}` }, p);

  // a person in the Bayeux manner, standing on y=0, facing right: oval head, short tunic, coloured hose
  // pose: stand | point | raise | cheer | sit | walk | lean | carry | type | think
  // likenesses of the people the cloth names, from their best-known photographs: hair, beard, glasses, skin
  const LOOKS = {
    ADA: { outfit: 'gown',  hair: 'black', hstyle: 'ringlets' },
    CAROLVS: { headwear: 'tophat', outfit: 'suit', tie: 'red',  hair: 'grey', hstyle: 'receding', beard: 'sideburns', age: 1 },
    TVRING: { outfit: 'suit', tie: 'blue',  hair: 'chestnut', hstyle: 'wavy' },
    MCCARTHY: { outfit: 'suit', tie: 'red',  hair: 'black', hstyle: 'crop', glasses: true },
    MINSKY: { outfit: 'suit', tie: 'teal',  hair: 'grey', bald: true, hstyle: 'sides', glasses: 'square' },
    ROSENBLATT: { outfit: 'labcoat',  hair: 'black', hstyle: 'wavy' },
    IOSEPH: { outfit: 'suit',  hair: 'grey', hstyle: 'curly', beard: false, moustache: true, age: 1 },
    LIGHTHILL: { outfit: 'robe', headwear: 'mortar',  hair: 'grey', hstyle: 'receding', glasses: true, age: 1 },
    GARRY: { outfit: 'suit', tie: 'red',  hair: 'black', hstyle: 'curly' },
    SAMVEL: {  hair: 'chestnut', hstyle: 'curly' },
    ELON: {  hair: 'chestnut', hstyle: 'quiff', beard: 'short' },
    ILYA: { hair: 'black', bald: true, hstyle: 'sides', beard: 'short' },
    GREG: { hair: 'black', hstyle: 'crop' },
    'LEE SEDOL': { hair: 'black', hstyle: 'fringe', skin: 'tan' },
    VILELMVS: { hair: 'black', hstyle: 'crop', skin: 'brown', beard: 'goatee' },
    'VERVS VILELMVS': { hair: 'black', hstyle: 'crop', skin: 'brown', beard: 'goatee' },
    IENSEN: {  hair: 'grey', hstyle: 'swept', skin: 'tan' },
    HOPFIELD: { outfit: 'suit',  hair: 'silver', hstyle: 'receding', glasses: true, beard: false, age: 1 },
    HINTON: { outfit: 'suit',  hair: 'silver', hstyle: 'swept', age: 1 },
    DEMIS: {  hair: 'black', hstyle: 'receding', skin: 'olive' },
    IVMPER: { outfit: 'suit',  hair: 'chestnut', hstyle: 'crop', glasses: true, beard: 'short' },
    BAKER: {  hair: 'silver', hstyle: 'receding', beard: 'full', glasses: true, age: 1 },
    THOMAS: { outfit: 'robe',  hair: 'chestnut', hstyle: 'crop', beard: 'full' },
    MIQVELA: { outfit: 'gown',  hair: 'black', hstyle: 'buns', skin: 'olive', freckles: true },
  };
  const VAR = { st: ['cap', 'crop', 'curly', 'wavy', 'cap', 'fringe', 'quiff'], sk: ['skin', 'skin', 'tan', 'skin', 'olive', 'brown', 'skin', 'deep'] };
  function person(p, x, o) {
    o = o || {};
    const look = o.name ? LOOKS[o.name] : null;
    const hsh = Math.abs(Math.round(x * 7 + (p.childNodes ? p.childNodes.length : 0) * 13));
    o = Object.assign({ tunic: 'red', legs: 'blue', hair: 'ochre', pose: 'stand', s: 1, face: 1 },
      look ? {} : { hstyle: VAR.st[hsh % VAR.st.length], skin: VAR.sk[(hsh >> 3) % VAR.sk.length] }, o, look || {});
    const g = grp(p, x, o.y == null ? G : o.y, o.s, o.face < 0);
    if (o.pose === 'fall') g.setAttribute('transform', g.getAttribute('transform') + ' rotate(-22)');
    const sit = o.pose === 'sit' || o.pose === 'type';
    const hip = sit ? -42 : -46, sh = sit ? -80 : -84;
    // costume: tunic (the original's), gown, robe, mail, suit or lab coat; picked per person, or varied for the crowd
    const OUT = ['tunic', 'tunic', 'tunic', 'gown', 'mail', 'robe', 'tunic', 'suit', 'tunic', 'gown'];
    const outfit = o.outfit || (o.jacket ? 'suit' : (o.name ? 'tunic' : OUT[(hsh >> 5) % OUT.length]));
    if (!o.headwear && !o.name && !o.crown && !o.hat && !o.mitre && (hsh >> 2) % 7 === 0) o.headwear = ['helmet', 'cap', 'beanie', 'hood'][(hsh >> 4) % 4];
    if (outfit === 'mail' && !o.headwear && !o.crown && (hsh % 2)) o.headwear = 'helmet';
    const tc = W[o.tunic] || o.tunic, skinC = W[o.skin || 'skin'];
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
      shrug: [[16, sh + 14, 24, sh + 2], [-16, sh + 14, -24, sh + 2]],
      facepalm: [[14, sh + 6, 8, sh - 16], [-6, sh + 20, -8, sh + 34]],
      run: [[16, sh + 12, 28, sh + 2], [-14, sh + 16, -26, sh + 24]],
      eat: [[16, sh + 12, 10, sh - 8], [10, sh + 18, 22, sh + 22]],
      wave: [[16, sh - 4, 26, sh - 26], [-6, sh + 20, -8, sh + 34]],
      crowd: [[18, sh + 2, 34, sh - 10], [-14, sh - 14, -20, sh - 30]],
      offer: [[20, sh + 8, 38, sh + 4], [14, sh + 14, 32, sh + 12]],
      fall: [[18, sh - 10, 30, sh - 24], [-14, sh - 12, -26, sh - 22]],
      shout: [[18, sh - 6, 32, sh - 20], [-6, sh + 20, -8, sh + 34]],
    }[o.pose] || [[6, sh + 20, 8, sh + 34], [-6, sh + 20, -8, sh + 34]];
    // an arm as a tapered sleeve (shoulder, elbow, wrist), with a mitten hand and fingers
    const sleeveCol = outfit === 'mail' ? 'url(#mail)' : outfit === 'labcoat' ? 'white' : o.tunic;
    const arm = (i, a) => {
      const sx = i ? -6 : 6, pts = [[sx, sh + 3], [a[0], a[1]], [a[2], a[3]]], wd = [4.2, 3.5, 2.9];
      const nrm = (p0, p1) => { const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
      const n0 = nrm(pts[0], pts[1]), n2 = nrm(pts[1], pts[2]); const n1 = [(n0[0] + n2[0]) / 2, (n0[1] + n2[1]) / 2];
      const N = [n0, n1, n2], A1 = pts.map((q, k) => [q[0] + N[k][0] * wd[k], q[1] + N[k][1] * wd[k]]), B1 = pts.map((q, k) => [q[0] - N[k][0] * wd[k], q[1] - N[k][1] * wd[k]]);
      const d = 'M' + A1.map(q => q.join(' ')).join(' L') + ' L' + B1.reverse().map(q => q.join(' ')).join(' L') + ' Z';
      P(g, d, i ? (outfit === 'mail' ? 'url(#mail)' : shade(tc, -0.22)) : sleeveCol, { w: 1.3, dir: 'v' });
      if (outfit !== 'mail' && outfit !== 'labcoat') { const cx = a[2] - (a[2] - a[0]) * 0.18, cy = a[3] - (a[3] - a[1]) * 0.18; P(g, `M${cx + N[2][0] * 3.2} ${cy + N[2][1] * 3.2} L${cx - N[2][0] * 3.2} ${cy - N[2][1] * 3.2}`, null, { w: 1.3, solid: true, stroke: shade(tc, -0.45) }); }
      C(g, a[2], a[3], 3.2, skinC, { w: 1.1 });
      const ang = Math.atan2(a[3] - a[1], a[2] - a[0]);
      for (const dd of [-0.55, 0, 0.55]) P(g, `M${a[2]} ${a[3]} l${5.5 * Math.cos(ang + dd)} ${5.5 * Math.sin(ang + dd)}`, null, { w: 1.4, solid: true, stroke: W.thread });
    };
    arm(1, A[1]);
    // legs, with shoes
    const shoe = o.shoes || (outfit === 'suit' ? 'black' : outfit === 'mail' ? 'grey' : ['black', 'rust', 'black', 'blue'][(hsh >> 6) % 4]);
    const legC = outfit === 'suit' ? (o.trousers || o.tunic) : outfit === 'labcoat' ? (o.legs || 'blue') : o.legs;
    if (sit) {
      P(g, `M-4 ${hip} L14 ${hip + 2} L16 -3 L10 -3 L9 ${hip + 8} L-6 ${hip + 7} Z`, legC, { w: 1.6 });
      P(g, `M-10 ${hip + 1} L7 ${hip + 4} L9 -3 L3 -3 L2 ${hip + 10} L-11 ${hip + 8} Z`, o.legs2 || legC, { w: 1.6, dir: 'v' });
      P(g, `M9 -4 L18 -4 Q22 -3 21 0 L9 0 Z`, shoe, { w: 1.2 }); P(g, `M2 -4 L11 -4 Q15 -3 14 0 L2 0 Z`, shoe, { w: 1.2 });
    } else {
      const st = o.pose === 'walk' || o.pose === 'carry' ? 11 : o.pose === 'run' ? 17 : o.pose === 'fall' ? 9 : 5;
      P(g, `M-7 ${hip} Q${-5 - st / 2} ${hip / 2} ${-5 - st} -4 L${1 - st} -4 Q${-1 - st / 3} ${hip / 2} 1 ${hip + 6} Z`, legC, { w: 1.6, dir: 'v' });
      P(g, `M0 ${hip} Q${3 + st / 2} ${hip / 2} ${1 + st} -4 L${7 + st} -4 Q${5 + st / 3} ${hip / 2} 7 ${hip + 4} Z`, o.legs2 || legC, { w: 1.6, dir: 'v' });
      P(g, `M${-5 - st} -5 L${2 - st} -5 L${2 - st} 0 L${-12 - st} 0 Q${-12 - st} -4 ${-5 - st} -5 Z`, shoe, { w: 1.2 });
      P(g, `M${1 + st} -5 L${8 + st} -5 Q${15 + st} -4 ${15 + st} 0 L${1 + st} 0 Z`, shoe, { w: 1.2 });
      if (o.garters !== false && outfit !== 'suit' && outfit !== 'gown' && outfit !== 'robe' && outfit !== 'labcoat') for (let k = 1; k < 4; k++) { const yy = hip + k * (-hip / 4); const fx = q => -3 + (-st - 1) * q; const t0 = (yy - hip) / -hip;
        P(g, `M${fx(t0) - 3} ${yy - 3} l6 5 M${fx(t0) + 3} ${yy - 3} l-6 5`, null, { w: 0.8, solid: true, stroke: shade(W[legC] || legC, -0.45) }); }
    }
    // the body: shoulders a little wider than the head, then the costume
    const hem = outfit === 'gown' || outfit === 'robe' ? (sit ? -4 : -3) : outfit === 'labcoat' || outfit === 'mail' ? hip + 22 : outfit === 'suit' ? hip + 2 : hip + 6;
    const flare = outfit === 'gown' ? 22 : outfit === 'robe' ? 18 : outfit === 'suit' ? 12 : 16;
    const bodyFill = outfit === 'mail' ? 'url(#mail)' : outfit === 'labcoat' ? 'white' : o.tunic;
    if (sit && (outfit === 'gown' || outfit === 'robe')) P(g, `M-12 ${sh + 2} Q-14 ${hip} -14 ${hip + 4} L16 ${hip + 2} L18 -4 L4 -4 L3 ${hip + 10} L-12 ${hip + 10} Z`, bodyFill);
    else P(g, `M-11 ${sh + 1} Q-13 ${sh + 20} -12 ${hip - 8} Q${-flare + 2} ${hip} ${-flare} ${hem} L${flare} ${hem} Q${flare - 2} ${hip} 12 ${hip - 8} Q13 ${sh + 20} 11 ${sh + 1} Q0 ${sh - 4} -11 ${sh + 1} Z`, bodyFill, { dir: outfit === 'gown' ? 'v' : '' });
    if (outfit === 'mail') { P(g, `M-11 ${sh + 1} Q0 ${sh - 4} 11 ${sh + 1} L9 ${sh + 8} Q0 ${sh + 4} -9 ${sh + 8} Z`, o.tunic, { w: 1.2 }); P(g, `M${-flare} ${hem} L${flare} ${hem}`, null, { w: 2, solid: true, stroke: tc }); }
    else if (outfit === 'gown') { P(g, `M-10 ${sh + 2} Q0 ${sh + 8} 10 ${sh + 2}`, null, { w: 2, solid: true, stroke: W.ochre }); P(g, `M-11 ${hip - 10} Q0 ${hip - 6} 11 ${hip - 10}`, null, { w: 2.4, solid: true, stroke: shade(tc, -0.4) }); for (let k = -18; k <= 18; k += 6) C(g, k, hem - 3, 1.2, W.ochre, { w: 0.5, solid: true }); }
    else if (outfit === 'robe') { P(g, `M-4 ${sh} L-2 ${hem}`, null, { w: 4, solid: true, stroke: W.ochre, op: 0.9 }); P(g, `M-11 ${sh + 1} Q-16 ${sh + 8} -12 ${sh + 14}`, null, { w: 3, solid: true, stroke: shade(tc, -0.3) }); }
    else if (outfit === 'suit') { P(g, `M-3 ${sh} L1 ${sh + 16} L6 ${sh}`, 'white', { w: 1.1, solid: true }); P(g, `M-6 ${sh + 1} L1 ${sh + 20} M8 ${sh + 1} L1 ${sh + 20}`, null, { w: 1.3, solid: true, stroke: shade(tc, -0.5) }); if (!o.jacket) P(g, `M1 ${sh + 2} l-2 3 l2 13 l2 -13 Z`, o.tie || 'red', { w: 0.9 }); for (let k = 0; k < 2; k++) C(g, 3, sh + 24 + k * 6, 0.9, W.thread, { w: 0.6, solid: true }); }
    else if (outfit === 'labcoat') { L(g, 1, sh + 2, 1, hem, { w: 1, solid: true }); R(g, 4, sh + 14, 6, 5, null, { w: 0.8, solid: true }); L(g, 6, sh + 13, 6, sh + 17, { w: 1.2, solid: true, stroke: W.blue }); }
    else { P(g, `M-16 ${hip + 2} L16 ${hip + 2}`, null, { w: 1.4, stroke: shade(tc, -0.35) }); }
    if (outfit === 'tunic' && !o.jacket) { P(g, `M-11 ${hip - 12} Q0 ${hip - 9} 11 ${hip - 12}`, null, { w: 2.2, solid: true, stroke: shade(tc, -0.45) }); C(g, 1, hip - 10.5, 1.6, 'ochre', { w: 0.6, solid: true }); for (let k = -12; k <= 12; k += 6) C(g, k, hip + 3, 1, W.linen, { w: 0.5, solid: true }); P(g, `M-7 ${sh + 1} Q0 ${sh + 7} 7 ${sh + 1}`, null, { w: 1.6, solid: true, stroke: W.ochre }); }
    if (o.cloak) { P(g, `M-11 ${sh} Q-24 ${sh + 20} -21 ${hip + 2} L-13 ${hip} Q-13 ${sh + 14} -4 ${sh - 2} Z`, o.cloak); C(g, 7, sh + 2, 2.2, 'ochre', { w: 0.8 }); }
    if (o.jacket) { P(g, `M-4 ${sh - 1} L2 ${sh + 18} L8 ${sh - 1}`, null, { w: 1.3, solid: true, stroke: W.buff }); P(g, `M-11 ${sh + 8} q4 10 2 20 M12 ${sh + 8} q-4 10 -2 20`, null, { w: 1, stroke: '#7A6E66', solid: true }); P(g, `M-8 ${sh + 30} l-2 6`, null, { w: 1.2, stroke: '#D9CCB4', solid: true }); }
    if (o.tie && outfit !== 'suit') P(g, `M1 ${sh} l-3 4 l3 20 l3 -20 Z`, o.tie, { w: 1 });
    if (o.hoodie) P(g, `M-10 ${sh + 2} Q-18 ${sh - 14} -8 ${sh - 20}`, null, { w: 3.4, stroke: shade(tc, -0.15), solid: true });
    arm(0, A[0]);
    // head, drawn a little larger than the body's scale so the face can carry detail
    P(g, `M-1 ${sh - 2} l0 -5`, null, { w: 4, stroke: W[o.skin] || W.white, solid: true });
    const hg = el('g', { transform: `translate(0 ${sh - 4}) scale(1.22) translate(0 ${-(sh - 4)})` }, g);
    const sk = o.skin || 'skin', hc = W[o.hair] || o.hair, dark = shade(W[sk], -0.42);
    if (o.hstyle === 'buns') { C(hg, -3, sh - 29, 4.2, o.hair, { w: 1.2 }); C(hg, 6, sh - 30, 4.2, o.hair, { w: 1.2 }); }
    if (o.hstyle === 'ringlets') C(hg, -9, sh - 18, 4, o.hair, { w: 1.2 });
    // face: brow, nose, lips, chin, jaw to the ear
    P(hg, `M-7 ${sh - 14} Q-8 ${sh - 26} 1 ${sh - 27} Q10 ${sh - 26} 9.5 ${sh - 19} L10 ${sh - 17} L14 ${sh - 12} L10 ${sh - 11} L10.5 ${sh - 9} L9 ${sh - 8} L9.5 ${sh - 6.5} Q6 ${sh - 3} 1 ${sh - 4} Q-6 ${sh - 6} -7 ${sh - 14} Z`, sk, { w: 1.6 });
    // hair
    const HS = {
      cap: `M-8 ${sh - 13} Q-9 ${sh - 28} 1 ${sh - 28} Q9 ${sh - 28} 9.5 ${sh - 20} Q3 ${sh - 23} -2 ${sh - 20} Q-4 ${sh - 16} -8 ${sh - 13} Z`,
      crop: `M-7.6 ${sh - 13} Q-9 ${sh - 28} 1 ${sh - 28} Q8 ${sh - 28} 9.3 ${sh - 22} Q4 ${sh - 24.5} -1 ${sh - 22} Q-4 ${sh - 18} -7.6 ${sh - 13} Z`,
      curly: `M-8 ${sh - 12} Q-11 ${sh - 18} -8 ${sh - 24} Q-6 ${sh - 31} 0 ${sh - 30} Q5 ${sh - 33} 8 ${sh - 28} Q12 ${sh - 26} 10 ${sh - 21} Q4 ${sh - 24} -1 ${sh - 21} Q-4 ${sh - 17} -8 ${sh - 12} Z`,
      wavy: `M-8 ${sh - 13} Q-10 ${sh - 26} -2 ${sh - 29} Q6 ${sh - 31} 10 ${sh - 24} Q8 ${sh - 21} 5 ${sh - 23} Q2 ${sh - 21} -1 ${sh - 21} Q-4 ${sh - 17} -8 ${sh - 13} Z`,
      quiff: `M-8 ${sh - 13} Q-9 ${sh - 28} 0 ${sh - 29} Q6 ${sh - 33} 11 ${sh - 27} Q10 ${sh - 23} 7 ${sh - 23} Q3 ${sh - 23} -1 ${sh - 21} Q-4 ${sh - 17} -8 ${sh - 13} Z`,
      swept: `M-8 ${sh - 12} Q-12 ${sh - 18} -10 ${sh - 24} L-6 ${sh - 26} L-8 ${sh - 30} L-2 ${sh - 29} L-1 ${sh - 33} L3 ${sh - 30} L6 ${sh - 32} L7 ${sh - 28} Q10 ${sh - 26} 9.5 ${sh - 22} Q4 ${sh - 25} -1 ${sh - 22} Q-4 ${sh - 17} -8 ${sh - 12} Z`,
      receding: `M-8 ${sh - 12} Q-9.5 ${sh - 27} -1 ${sh - 28} Q4 ${sh - 28} 5 ${sh - 26} Q1 ${sh - 24} -2 ${sh - 19} Q-5 ${sh - 15} -8 ${sh - 12} Z`,
      sides: `M-8 ${sh - 11} Q-9.5 ${sh - 19} -6 ${sh - 23} Q-3 ${sh - 19} -4 ${sh - 13} Z`,
      fringe: `M-8 ${sh - 12} Q-10 ${sh - 28} 1 ${sh - 29} Q10 ${sh - 28} 10.5 ${sh - 19} L8.5 ${sh - 19.5} L7 ${sh - 18.5} L5 ${sh - 19.5} Q1 ${sh - 20} -1 ${sh - 19} Q-4 ${sh - 15} -8 ${sh - 12} Z`,
      ringlets: `M-8 ${sh - 12} Q-10 ${sh - 27} 1 ${sh - 28} Q9 ${sh - 28} 9.5 ${sh - 21} Q5 ${sh - 25.5} 1 ${sh - 24} Q-3 ${sh - 22} -4 ${sh - 16} Q-5 ${sh - 12} -8 ${sh - 12} Z`,
      buns: `M-8 ${sh - 12} Q-10 ${sh - 28} 1 ${sh - 28} Q10 ${sh - 28} 10.5 ${sh - 19} L8.5 ${sh - 20} L6 ${sh - 19} L3.5 ${sh - 20} Q0 ${sh - 20} -1 ${sh - 19} Q-4 ${sh - 15} -8 ${sh - 12} Z`,
    };
    const hs = o.bald === true ? (o.hstyle === 'sides' ? 'sides' : null) : (o.hstyle || 'cap');
    if (hs && HS[hs]) P(hg, HS[hs], o.hair, { w: 1.5 });
    if (hs === 'curly') for (let k = 0; k < 5; k++) P(hg, `M${-7 + k * 3.6} ${sh - 26 + Math.abs(k - 2)} q1.6 -2.4 3.2 0`, null, { w: 0.8, solid: true, stroke: shade(hc, -0.4) });
    if (hs === 'swept' || hs === 'wavy' || hs === 'quiff') for (let k = 0; k < 3; k++) P(hg, `M${6 - k * 4} ${sh - 25 - (k % 2)} Q${1 - k * 4} ${sh - 27} ${-3 - k * 4} ${sh - 22}`, null, { w: 0.7, solid: true, stroke: shade(hc, -0.4) });
    if (hs === 'ringlets') for (let k = 0; k < 2; k++) P(hg, `M${-6 + k * 3} ${sh - 14} q-2 3 0 5 q2 2 0 5`, null, { w: 2, solid: true, stroke: hc });
    if (o.long) P(hg, `M-8 ${sh - 14} Q-12 ${sh - 2} -6 ${sh + 6} L-2 ${sh - 6} Z`, o.hair, { w: 1.4 });
    // headwear
    const hwr = o.headwear;
    if (hwr === 'helmet') { P(hg, `M-9 ${sh - 20} Q-8 ${sh - 36} 1 ${sh - 40} Q10 ${sh - 36} 11 ${sh - 20} Z`, 'grey', { w: 1.4, dir: 'v' }); R(hg, -9.5, sh - 22, 21, 3.4, 'ochre', { w: 1 }); R(hg, 8.5, sh - 21, 2.4, 9, 'grey', { w: 0.9 }); }
    if (hwr === 'cap') { P(hg, `M-8 ${sh - 21} Q-7 ${sh - 33} 2 ${sh - 33} Q10 ${sh - 32} 10 ${sh - 22} Z`, o.hatc || 'red', { w: 1.3 }); P(hg, `M8 ${sh - 23} L18 ${sh - 21} L10 ${sh - 20} Z`, o.hatc || 'red', { w: 1.1 }); }
    if (hwr === 'beanie') { P(hg, `M-8.5 ${sh - 19} Q-8 ${sh - 34} 1 ${sh - 34} Q10 ${sh - 33} 10 ${sh - 20} Z`, o.hatc || 'teal', { w: 1.3, dir: 'v' }); C(hg, 1, sh - 35, 2.6, 'white', { w: 0.9 }); }
    if (hwr === 'hood') P(hg, `M-10 ${sh - 6} Q-13 ${sh - 26} -2 ${sh - 32} Q10 ${sh - 33} 11 ${sh - 22} Q4 ${sh - 28} -1 ${sh - 24} Q-6 ${sh - 18} -6 ${sh - 4} Z`, o.hatc || shade(tc, -0.2), { w: 1.3 });
    if (hwr === 'tophat') { R(hg, -6, sh - 48, 14, 22, 'black', { w: 1.3 }); R(hg, -10, sh - 28, 22, 3, 'black', { w: 1.2 }); R(hg, -6, sh - 32, 14, 3, 'red', { w: 0.8 }); }
    if (hwr === 'wig') { for (let k = 0; k < 4; k++) { C(hg, -8, sh - 25 + k * 5, 2.8, 'white', { w: 0.8 }); } P(hg, `M-9 ${sh - 24} Q0 ${sh - 34} 10 ${sh - 24} Q2 ${sh - 27} -9 ${sh - 24} Z`, 'white', { w: 1 }); }
    if (hwr === 'mortar') { P(hg, `M-12 ${sh - 31} L2 ${sh - 35} L16 ${sh - 31} L2 ${sh - 27} Z`, 'black', { w: 1.2 }); P(hg, `M-7 ${sh - 29} L-7 ${sh - 22} Q2 ${sh - 25} 11 ${sh - 22} L11 ${sh - 29}`, 'black', { w: 1 }); P(hg, `M2 ${sh - 31} q8 2 10 10`, null, { w: 1.2, solid: true, stroke: W.ochre }); }
    if (hwr === 'headphones') { P(hg, `M-5 ${sh - 16} Q-4 ${sh - 34} 4 ${sh - 32}`, null, { w: 2.2, solid: true }); R(hg, -7, sh - 19, 5, 7, 'red', { w: 1 }); }
    if (hwr === 'chef') { R(hg, -7, sh - 30, 16, 8, 'white', { w: 1.1 }); C(hg, -3, sh - 34, 5, 'white', { w: 1 }); C(hg, 5, sh - 34, 5, 'white', { w: 1 }); }
    // ear
    P(hg, `M-3.5 ${sh - 18} q-3.2 0.5 -2.6 4.5 q0.6 2.5 2.8 1.8`, sk, { w: 1.1, solid: true });
    P(hg, `M-4.2 ${sh - 16.5} q-1 1.2 0 2.4`, null, { w: 0.6, solid: true, stroke: dark });
    // beard
    const bd = o.beard === true ? 'full' : o.beard;
    if (bd === 'full') P(hg, `M-3 ${sh - 13} Q-4 ${sh - 5} 1 ${sh - 3} Q7 ${sh - 2} 10 ${sh - 7} L9 ${sh - 9.5} Q6 ${sh - 7} 3 ${sh - 9} Q0 ${sh - 9} -1 ${sh - 13} Z`, o.beardColor || o.hair, { w: 1.2 });
    if (bd === 'short') for (let k = 0; k < 9; k++) C(hg, -2 + k * 1.3, sh - 9 + Math.abs(k - 5) * -0.55 + 3.2, 0.45, null, { w: 0.9, solid: true, stroke: hc });
    if (bd === 'goatee') P(hg, `M5 ${sh - 6} Q8 ${sh - 3} 10 ${sh - 6.5} L9.5 ${sh - 8} Q7 ${sh - 7} 5 ${sh - 6} Z`, o.beardColor || o.hair, { w: 0.9 });
    if (bd === 'sideburns') P(hg, `M-2 ${sh - 18} Q-3 ${sh - 10} 1 ${sh - 7} L2 ${sh - 9} Q0 ${sh - 12} 0 ${sh - 18} Z`, o.beardColor || o.hair, { w: 1 });
    // eye: an almond of white with a dark pupil, lid line, and a brow in the hair's colour
    const mood = o.mood || '';
    P(hg, `M2.2 ${sh - 17.2} Q4.8 ${sh - 19.6} 7.4 ${sh - 17.2} Q4.8 ${sh - 15.6} 2.2 ${sh - 17.2} Z`, '#FBF6EA', { w: 0.8, solid: true });
    C(hg, mood === 'shock' || mood === 'shout' ? 4.8 : 5.4, sh - 17.3, 1.15, W.thread, { w: 0.6, solid: true });
    const bc = hs && o.hair !== 'silver' && o.hair !== 'white' ? shade(hc, -0.3) : W.thread;
    if (mood === 'angry') P(hg, `M1.5 ${sh - 22} L7.8 ${sh - 19.2}`, null, { w: 1.5, solid: true, stroke: bc });
    else if (mood === 'shock' || mood === 'shout') P(hg, `M1.5 ${sh - 22.5} Q4.7 ${sh - 25} 7.8 ${sh - 22}`, null, { w: 1.2, solid: true, stroke: bc });
    else if (mood === 'sad') P(hg, `M1.5 ${sh - 20.2} L7.8 ${sh - 22}`, null, { w: 1.2, solid: true, stroke: bc });
    else P(hg, `M1.5 ${sh - 20.8} Q4.7 ${sh - 22.2} 7.8 ${sh - 20.8}`, null, { w: 1.2, solid: true, stroke: bc });
    if (o.age) P(hg, `M2 ${sh - 14.5} q2.5 1 5 0 M1.5 ${sh - 23.5} l4 0`, null, { w: 0.5, solid: true, stroke: dark });
    // nostril, cheek, lips
    P(hg, `M11 ${sh - 12.6} q-1.2 0.4 -1.6 -0.8`, null, { w: 0.7, solid: true, stroke: dark });
    C(hg, 5.2, sh - 11.5, 2.1, '#D9826A', { w: 0.1, solid: true, op: 0.45, stroke: 'none' });
    if (mood === 'happy') P(hg, `M6 ${sh - 8.6} Q8.4 ${sh - 6.4} 10.2 ${sh - 8.4}`, null, { w: 1.1, solid: true, stroke: '#8E3A2A' });
    else if (mood === 'angry' || mood === 'sad') P(hg, `M6 ${sh - 7.2} Q8 ${sh - 9.2} 10.2 ${sh - 7.6}`, null, { w: 1.1, solid: true, stroke: '#8E3A2A' });
    else if (mood === 'shock' || mood === 'shout') P(hg, `M7.2 ${sh - 9.5} a1.9 ${mood === 'shout' ? 2.6 : 1.9} 0 1 0 0.1 0 Z`, '#8E3A2A', { w: 0.9, solid: true });
    else P(hg, `M6.5 ${sh - 8.2} Q8.3 ${sh - 7.6} 10.2 ${sh - 8.2}`, null, { w: 1, solid: true, stroke: '#8E3A2A' });
    if (o.freckles) for (const [fx, fy] of [[4, -12.5], [6.5, -13], [5.5, -11]]) C(hg, fx, sh + fy, 0.35, null, { w: 0.8, solid: true, stroke: dark });
    if (o.melt) { for (let k = 0; k < 4; k++) P(hg, `M${-4 + k * 4} ${sh - 6} q${k % 2 ? 2 : -2} 6 0 ${8 + k * 3}`, null, { w: 1.6, stroke: W.ochre, solid: true }); P(hg, `M-7 ${sh - 14} q-4 6 -2 12`, null, { w: 1.4, stroke: W[sk], solid: true }); C(hg, -2, sh - 18, 1.2, W.thread, { w: 1, solid: true }); }
    if (o.moustache) P(hg, `M6 ${sh - 9.6} Q9 ${sh - 11.4} 11.6 ${sh - 9}`, null, { w: 2.2, solid: true, stroke: W[o.hair] || o.hair });
    if (o.glasses) { if (o.glasses === 'square') R(hg, 1.4, sh - 20, 7.6, 5.4, null, { w: 1, solid: true }); else C(hg, 5, sh - 17.3, 3.4, null, { w: 1, solid: true }); L(hg, -3.5, sh - 18.4, 1.4, sh - 17.6, { w: 0.9, solid: true }); }
    if (o.norman) P(hg, `M-8 ${sh - 13} Q-9 ${sh - 20} -6 ${sh - 24}`, null, { w: 2.6, stroke: W.white, solid: true });
    if (o.sweat) for (let k = 0; k < 3; k++) P(g, `M${-12 - k * 4} ${sh - 24 + k * 6} q-2 4 0 6`, null, { w: 1.1, stroke: W.sky, solid: true });
    if (o.steam) for (let k = 0; k < 3; k++) P(g, `M${-6 + k * 8} ${sh - 32} q-4 -6 0 -12 q4 -6 0 -12`, null, { w: 1.3, stroke: W.grey, solid: true });
    if (o.hearts) for (let k = 0; k < 3; k++) P(g, `M${16 + k * 9} ${sh - 30 - k * 8} l-3 -3 a2 2 0 0 1 3 -3 a2 2 0 0 1 3 3 Z`, 'red', { w: 0.8, solid: true });
    if (o.crown) P(hg, `M-7 ${sh - 28} l2 -8 l3 5 l3 -7 l3 7 l3 -5 l1 8 Z`, 'ochre', { w: 1.4 });
    if (o.hat) P(hg, `M-9 ${sh - 25} Q1 ${sh - 40} 11 ${sh - 25} Z`, o.hat, { w: 1.4 });
    if (o.mitre) P(hg, `M-6 ${sh - 26} L-2 ${sh - 42} L2 ${sh - 33} L6 ${sh - 42} L9 ${sh - 26} Z`, o.mitre, { w: 1.4 });
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
    if (o.hold === 'fork') { L(g, hx, hy, hx + 2, hy - 16, { w: 1.4 }); P(g, `M${hx - 2} ${hy - 16} q4 -6 8 0`, 'ochre', { w: 1, solid: true }); }
    if (o.hold === 'gpu') { R(g, hx - 16, hy - 26, 32, 18, 'grey', { w: 1.3 }); C(g, hx - 7, hy - 17, 5, 'blue', { w: 1 }); C(g, hx + 7, hy - 17, 5, 'blue', { w: 1 }); }
    if (o.hold === 'box') { R(g, hx - 14, hy - 18, 28, 20, 'buff', { w: 1.3 }); P(g, `M${hx - 10} ${hy - 18} l4 -10 M${hx + 2} ${hy - 18} l6 -8`, null, { w: 1.2 }); }
    if (o.hold === 'laptop') { P(g, `M${hx - 14} ${hy} L${hx + 14} ${hy} L${hx + 18} ${hy - 18} L${hx - 10} ${hy - 18} Z`, 'grey', { w: 1.2 }); }
    if (o.hold === 'chalk') C(g, hx + 1, hy - 1, 1.6, 'white', { w: 0.9 });
    if (o.hold === 'lute') { P(g, `M${hx - 10} ${hy + 12} q-12 -6 -6 -18 q10 -6 16 4 Z`, 'ochre', { w: 1.2 }); L(g, hx, hy + 2, hx + 20, hy - 22, { w: 2 }); }
    if (o.hold === 'microphone') { L(g, hx, hy, hx + 4, hy - 10, { w: 2 }); C(g, hx + 5, hy - 13, 3.5, 'grey', { w: 1 }); }
    if (o.hold === 'sign') { L(g, hx, hy + 10, hx, hy - 40, { w: 2.2 }); R(g, hx - 26, hy - 62, 52, 24, 'white', { w: 1.3 }); if (o.sign) T(g, hx, hy - 46, o.sign, Math.min(9, 92 / o.sign.length), 'red', { ls: 0.4 }); }
    if (o.hold === 'paper') { R(g, hx - 3, hy - 22, 18, 24, 'white', { w: 1.2 }); for (let k = 0; k < 4; k++) L(g, hx, hy - 17 + k * 5, hx + 12, hy - 17 + k * 5, { w: 0.7 }); }
    if (o.hold === 'gavel') { L(g, hx, hy, hx + 8, hy - 14, { w: 2.2 }); R(g, hx + 2, hy - 22, 14, 7, 'rust', { w: 1.1 }); }
    if (o.hold === 'brush') { L(g, hx, hy, hx + 10, hy - 18, { w: 1.6 }); C(g, hx + 11, hy - 20, 2.2, 'red', { w: 0.8 }); }
    // the name stitched above the head, as the original names its people
    if (o.name) T(g.parentNode, 0, 0, o.name, o.nameSize || 10.5, o.nameColor || 'red', { ls: 1.2, halo: true, transformFrom: g, dy: sh - 40 - (o.crown ? 11 : 0) - (o.hstyle === 'buns' || o.hstyle === 'swept' || o.hstyle === 'curly' ? 4 : 0) - (o.hat || o.mitre || o.headwear ? (o.headwear === 'tophat' ? 22 : 12) : 0) });
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
    // a bowl of spaghetti, with strands everywhere
    spaghetti(p, x, y) { const g = grp(p, x, y || G - 46); P(g, 'M-30 -8 Q0 22 30 -8 Z', 'white', { w: 1.6 }); for (let i = 0; i < 7; i++) P(g, `M${-24 + i * 8} -8 q${4 - i} -16 ${8 - i * 2} -4 q4 10 8 -2`, null, { w: 1.3, stroke: W.ochre, solid: true }); for (let i = 0; i < 4; i++) C(g, -16 + i * 11, -12, 2.6, 'red', { w: 0.8 }); return g; },
    // a data centre: a long hall of server racks, with cooling towers steaming, and power lines coming in
    datacentre(p, x, o) {
      o = o || {}; const g = grp(p, x, G, o.s || 1);
      R(g, -110, -70, 220, 70, 'grey', { dir: 'h' }); P(g, 'M-116 -70 L116 -70 L106 -82 L-106 -82 Z', 'blue');
      for (let i = 0; i < 9; i++) { R(g, -100 + i * 22, -60, 16, 52, 'black', { w: 1.1 }); for (let k = 0; k < 5; k++) C(g, -92 + i * 22, -52 + k * 10, 1.4, k % 2 ? 'teal' : 'ochre', { w: 0.6, solid: true }); }
      if (o.label) T(g, 0, -88, o.label, 10, 'blue', { ls: 1 });
      for (const cx of [140, 186]) { P(g, `M${cx - 18} 0 Q${cx - 10} -50 ${cx - 14} -90 L${cx + 14} -90 Q${cx + 10} -50 ${cx + 18} 0 Z`, 'buff', { dir: 'v' }); for (let k = 0; k < 3; k++) P(g, `M${cx - 8 + k * 8} -94 q-8 -14 0 -26 q8 -12 0 -24`, null, { w: 2, stroke: W.white, solid: true }); }
      return g;
    },
    // a pylon carrying power
    pylon(p, x, o) { const g = grp(p, x, G, (o && o.s) || 1); P(g, 'M-16 0 L-3 -130 L3 -130 L16 0', null, { w: 2 }); for (let k = 0; k < 5; k++) L(g, -14 + k * 2.6, -k * 26, 14 - k * 2.6, -k * 26 - 26, { w: 1 }); L(g, -26, -110, 26, -110, { w: 2 }); L(g, -20, -90, 20, -90, { w: 2 }); for (const sx of [-26, 26]) P(g, `M${sx} -110 q${sx * 2} 30 ${sx * 4} 10`, null, { w: 1, stroke: W.thread, solid: true }); return g; },
    // a crane building something
    crane(p, x, o) { const g = grp(p, x, G, (o && o.s) || 1); L(g, 0, 0, 0, -170, { w: 3 }); L(g, -40, -170, 90, -170, { w: 3 }); P(g, 'M0 -170 L-30 -170 L-30 -156 L0 -156', 'ochre', { w: 1.2 }); L(g, 80, -170, 80, -110, { w: 1.2, solid: true }); R(g, 70, -110, 20, 14, 'grey', { w: 1.2 }); for (let k = 0; k < 8; k++) L(g, -4, -k * 21, 4, -k * 21 - 21, { w: 1 }); return g; },
    // a pizza, and a pot of glue
    pizza(p, x, y) { const g = grp(p, x, y || G - 46); P(g, 'M-34 0 Q0 -18 34 0 Q0 12 -34 0 Z', 'ochre'); for (const [cx, cy] of [[-16, -2], [0, -6], [14, -1], [-4, 3]]) C(g, cx, cy, 4, 'red', { w: 0.9 }); R(g, 42, -26, 16, 26, 'white', { w: 1.3 }); P(g, 'M44 -26 l6 -10 l6 10 Z', 'ochre', { w: 1 }); T(g, 50, -10, 'GLVTEN', 5.5, 'blue', { ls: 0.2 }); P(g, 'M52 -36 q-6 -10 -18 -14', null, { w: 1.2, stroke: W.white, solid: true }); return g; },
    // a judge's bench
    bench2(p, x, o) { const g = grp(p, x, G); R(g, -50, -80, 100, 80, 'rust', { dir: 'v' }); R(g, -56, -86, 112, 8, 'ochre'); if (o && o.label) T(g, 0, -44, o.label, 9, 'white', { ls: 0.6 }); return g; },
    // a chart on a board, going up or down
    chart(p, x, o) { o = o || {}; const g = grp(p, x, G, o.s || 1); R(g, -44, -120, 88, 74, 'white', { w: 1.4 }); L(g, -2, -46, -2, 0, { w: 2.4 }); L(g, -36, -54, -36, -112, { w: 1 }); L(g, -36, -54, 36, -54, { w: 1 }); const up = o.up !== false; P(g, up ? 'M-34 -60 L-18 -70 L-6 -66 L8 -84 L20 -80 L34 -108' : 'M-34 -106 L-18 -96 L-6 -100 L8 -78 L20 -82 L34 -58', null, { w: 2.4, stroke: up ? W.green : W.red, solid: true }); P(g, up ? 'M34 -108 l-9 1 l5 7 Z' : 'M34 -58 l-9 -1 l5 -7 Z', up ? 'green' : 'red', { w: 1 }); if (o.label) T(g, 0, -126, o.label, 8, 'blue', { ls: 0.5 }); return g; },
    // a blackboard of sums
    blackboard(p, x, o) { o = o || {}; const g = grp(p, x, G); R(g, -70, -150, 140, 90, 'green', { dir: 'h' }); R(g, -74, -154, 148, 98, null, { w: 3 }); L(g, -60, -56, -66, 0, { w: 2.4 }); L(g, 60, -56, 66, 0, { w: 2.4 }); (o.lines || ['a²+b²=c²', 'Σ 1/n² = π²/6', '∀ε ∃δ …']).forEach((s, k) => T(g, 0, -126 + k * 22, s, 12, 'white', { ls: 0.5, font: 'serif' })); return g; },
    // a stack of books and journals
    books(p, x, o) { const g = grp(p, x, G); const n = (o && o.n) || 5; for (let i = 0; i < n; i++) R(g, -26 + (i % 2) * 4, -12 - i * 12, 52, 12, ['blue', 'red', 'ochre', 'teal', 'sage'][i % 5], { w: 1.1 }); if (o && o.label) T(g, 0, -20 - n * 12, o.label, 8, 'red', { ls: 0.4 }); return g; },
    // a ring light and phone on a tripod, for the influencer
    ringlight(p, x) { const g = grp(p, x, G); L(g, 0, 0, 0, -110, { w: 2 }); L(g, 0, -20, -16, 0, { w: 1.6 }); L(g, 0, -20, 16, 0, { w: 1.6 }); C(g, 0, -128, 20, null, { w: 5, stroke: W.white, solid: true }); C(g, 0, -128, 20, null, { w: 1.2 }); R(g, -5, -136, 10, 16, 'blue', { w: 1 }); return g; },
    // a magazine cover with a model who is not there
    magazine(p, x, o) { const g = grp(p, x, G, (o && o.s) || 1); R(g, -34, -120, 68, 96, 'white', { w: 1.6 }); T(g, 0, -104, (o && o.title) || 'MODA', 13, 'red', { ls: 2 }); P(g, 'M-10 -30 Q-12 -56 0 -60 Q12 -56 10 -30 Z', 'pink'); C(g, 0, -72, 9, 'white', { w: 1.2 }); P(g, 'M-9 -74 Q-10 -88 0 -88 Q12 -88 10 -70 Q8 -80 -9 -74 Z', 'ochre', { w: 1.2 }); P(g, 'M-14 -86 l4 4 M14 -86 l-4 4', null, { w: 1, stroke: W.ochre, solid: true }); L(g, 0, -24, -6, 0, { w: 2 }); L(g, 0, -24, 6, 0, { w: 2 }); return g; },
    // music: notes flying from a spot
    notes(p, x, y, n) { const g = grp(p, x, y); for (let i = 0; i < (n || 4); i++) { const nx = i * 18, ny = -i * 10 + (i % 2) * 6; C(g, nx, ny, 3.4, W.thread, { w: 1, solid: true }); L(g, nx + 3, ny, nx + 3, ny - 16, { w: 1.3, solid: true }); if (i % 2) P(g, `M${nx + 3} ${ny - 16} q8 2 6 10`, null, { w: 1.2, solid: true }); } return g; },
    // a drum
    drum(p, x) { const g = grp(p, x, G); P(g, 'M-20 -40 L-20 -6 Q0 2 20 -6 L20 -40', 'red', { dir: 'v' }); P(g, 'M-20 -40 Q0 -48 20 -40 Q0 -32 -20 -40 Z', 'white', { w: 1.2 }); for (let i = 0; i < 4; i++) L(g, -18 + i * 12, -38, -12 + i * 12, -6, { w: 0.9 }); return g; },
    // a painter's easel and canvas, with a blue ribbon
    easel(p, x, o) { const g = grp(p, x, G); L(g, -30, 0, -6, -130, { w: 2.4 }); L(g, 30, 0, 6, -130, { w: 2.4 }); L(g, 0, 0, 0, -120, { w: 2 }); R(g, -42, -118, 84, 62, 'white', { w: 1.6 }); P(g, 'M-38 -60 Q-20 -104 0 -84 Q14 -112 38 -64 Z', 'teal', { w: 1 }); C(g, 18, -98, 8, 'ochre', { w: 1 }); P(g, 'M-6 -100 l2 -10 l4 0 l2 10 Z', 'rust', { w: 0.9 }); if (o && o.ribbon) { C(g, 40, -114, 9, 'blue', { w: 1.2 }); P(g, 'M36 -106 l-4 16 l6 -5 l4 6 l2 -16', 'blue', { w: 1 }); } return g; },
    // a door marked EXIT, half open
    door(p, x, o) { const g = grp(p, x, G); R(g, -26, -130, 52, 130, 'rust', { dir: 'v' }); P(g, 'M-26 -130 L4 -122 L4 6 L-26 0 Z', 'buff', { w: 1.4 }); C(g, 0, -60, 2.4, 'ochre', { w: 1 }); if (o && o.label) T(g, 0, -138, o.label, 9, 'red', { ls: 1 }); return g; },
    // a throne
    throne(p, x) { const g = grp(p, x, G); P(g, 'M-24 0 L-24 -120 Q0 -140 24 -120 L24 0 Z', 'ochre', { dir: 'v' }); R(g, -28, -50, 56, 10, 'red'); for (let i = 0; i < 3; i++) C(g, -12 + i * 12, -118, 3, 'red', { w: 1 }); return g; },
    // a rocket on its pad
    rocket(p, x, o) { const g = grp(p, x, G, (o && o.s) || 1); P(g, 'M-10 -20 L-10 -110 Q0 -136 10 -110 L10 -20 Z', 'white', { dir: 'v' }); P(g, 'M-10 -40 L-22 -14 L-10 -20 Z M10 -40 L22 -14 L10 -20 Z', 'red', { w: 1.2 }); for (let i = 0; i < 4; i++) P(g, `M${-8 + i * 5} -18 q-3 10 ${2 - i} 18`, null, { w: 2.2, stroke: [W.ochre, W.red, W.rust, W.ochre][i], solid: true }); return g; },
    // a laptop on a desk
    desk(p, x, o) { const g = grp(p, x, G); R(g, -40, -48, 80, 6, 'rust', { w: 1.3 }); L(g, -34, -42, -34, 0, { w: 2.2 }); L(g, 34, -42, 34, 0, { w: 2.2 }); P(g, 'M-20 -48 L20 -48 L24 -72 L-16 -72 Z', 'grey', { w: 1.2 }); if (o && o.text) T(g, 2, -58, o.text, 5.5, 'white', { ls: 0.2, font: "'IBM Plex Mono', monospace" }); return g; },
    // a nuclear power station's cooling tower
    tower(p, x, o) { const g = grp(p, x, G, (o && o.s) || 1); P(g, 'M-34 0 Q-18 -60 -24 -120 L24 -120 Q18 -60 34 0 Z', 'buff', { dir: 'v' }); for (let k = 0; k < 3; k++) P(g, `M${-12 + k * 12} -126 q-10 -14 0 -26 q10 -12 0 -26`, null, { w: 2.4, stroke: W.white, solid: true }); return g; },
  };


  // ---------------- scenery: a location behind each scene (hills, a town, a campus, a city, the valley, sea, snow,
  // fields), stitched paler and smaller so the figures stay in front, with people and animals in the distance
  const HZ = G - 64;   // the horizon, about chest height on the figures
  const mini = {
    tree(g, x, y, s, c) { const q = grp(g, x, y, s); P(q, 'M-2 0 L-1 -22 L1 -22 L2 0 Z', 'rust', { w: 0.9 }); P(q, 'M0 -18 Q-14 -22 -10 -34 Q-12 -46 0 -48 Q12 -46 10 -34 Q14 -22 0 -18 Z', c || 'sage', { w: 1 }); P(q, 'M-4 -30 q4 -4 8 0 M-3 -38 q3 -3 6 0', null, { w: 0.7, solid: true, stroke: W.green }); },
    pine(g, x, y, s) { const q = grp(g, x, y, s); P(q, 'M0 -50 L12 -16 L4 -16 L14 0 L-14 0 L-4 -16 L-12 -16 Z', 'green', { w: 1 }); },
    palm(g, x, y, s) { const q = grp(g, x, y, s); P(q, 'M-1 0 Q2 -24 -2 -46 L1 -46 Q6 -24 2 0 Z', 'rust', { w: 0.9 }); for (const d of [-1, 1]) { P(q, `M0 -46 Q${d * 12} -56 ${d * 22} -44 Q${d * 12} -50 0 -46 Z`, 'green', { w: 0.9 }); P(q, `M0 -46 Q${d * 8} -50 ${d * 16} -36 Q${d * 6} -44 0 -46 Z`, 'sage', { w: 0.9 }); } },
    house(g, x, y, s, c, roof) { const q = grp(g, x, y, s); R(q, -14, -22, 28, 22, c || 'buff', { w: 1, dir: 'h' }); P(q, 'M-18 -22 L0 -38 L18 -22 Z', roof || 'red', { w: 1, dir: 'v' }); P(q, 'M-4 0 v-10 a4 4 0 0 1 8 0 v10', 'blue', { w: 0.8 }); R(q, 6, -36, 4, 8, 'grey', { w: 0.7 }); },
    tower(g, x, y, s, c) { const q = grp(g, x, y, s); R(q, -9, -56, 18, 56, c || 'buff', { w: 1, dir: 'v' }); P(q, 'M-12 -56 L0 -74 L12 -56 Z', 'teal', { w: 1 }); for (let k = 0; k < 3; k++) P(q, `M-3 ${-46 + k * 14} v-6 a3 3 0 0 1 6 0 v6`, 'blue', { w: 0.7 }); },
    spire(g, x, y, s) { const q = grp(g, x, y, s); R(q, -7, -40, 14, 40, 'buff', { w: 1, dir: 'v' }); P(q, 'M-7 -40 L0 -78 L7 -40 Z', 'grey', { w: 1 }); L(q, 0, -78, 0, -86, { w: 0.8, solid: true }); },
    block(g, x, y, s, h, c) { const q = grp(g, x, y, s); R(q, -12, -h, 24, h, c || 'grey', { w: 1, dir: 'v' }); for (let r = 0; r < Math.floor(h / 10) - 1; r++) for (let k = 0; k < 3; k++) R(q, -9 + k * 7, -h + 5 + r * 10, 4, 5, (r + k) % 3 ? 'sky' : 'ochre', { w: 0.4, solid: true }); },
    glass(g, x, y, s) { const q = grp(g, x, y, s); P(q, 'M-26 0 L-26 -20 Q0 -30 26 -20 L26 0 Z', 'sky', { w: 1, dir: 'h' }); for (let k = -18; k <= 18; k += 9) L(q, k, -24, k, 0, { w: 0.6, solid: true }); },
    sheep(g, x, y, s, f) { const q = grp(g, x, y, s, f); P(q, 'M-10 -4 Q-12 -14 -2 -14 Q8 -16 10 -8 Q10 -2 -10 -4 Z', 'white', { w: 1 }); P(q, 'M9 -11 L14 -9 L12 -5 L8 -6 Z', 'black', { w: 0.8 }); for (const lx of [-6, 5]) L(q, lx, -3, lx, 3, { w: 1.4, solid: true }); },
    horse(g, x, y, s, f, c) { const q = grp(g, x, y, s, f); P(q, 'M-16 -14 Q-16 -24 -4 -24 L10 -24 Q14 -36 22 -34 L24 -28 L18 -26 Q18 -16 12 -14 Z', c || 'rust', { w: 1, dir: 'h' }); for (const lx of [-12, -6, 6, 12]) L(q, lx, -15, lx + (lx % 4), 0, { w: 1.6, solid: true }); P(q, 'M-16 -20 q-8 2 -8 12', null, { w: 1.4, solid: true }); },
    dog(g, x, y, s, f) { const q = grp(g, x, y, s, f); P(q, 'M-10 -6 Q-10 -12 0 -12 L8 -12 L10 -18 L14 -16 L14 -10 Q12 -6 8 -6 Z', 'ochre', { w: 1 }); for (const lx of [-8, -4, 4, 8]) L(q, lx, -7, lx, 0, { w: 1.3, solid: true }); P(q, 'M-10 -10 q-6 -2 -6 -8', null, { w: 1.2, solid: true }); },
    bird(g, x, y, s) { P(g, `M${x - 6 * s} ${y} q${3 * s} ${-4 * s} ${6 * s} 0 q${3 * s} ${-4 * s} ${6 * s} 0`, null, { w: 1.1, solid: true }); },
    boat(g, x, y, s, f) { const q = grp(g, x, y, s, f); P(q, 'M-20 -4 L20 -4 L14 4 L-14 4 Z', 'rust', { w: 1 }); L(q, 0, -4, 0, -30, { w: 1.2 }); P(q, 'M1 -28 Q16 -18 14 -6 L1 -6 Z', 'white', { w: 1 }); },
    cloud(g, x, y, s) { P(g, `M${x - 20 * s} ${y} q${4 * s} ${-10 * s} ${12 * s} ${-6 * s} q${6 * s} ${-10 * s} ${16 * s} ${-2 * s} q${10 * s} ${-2 * s} ${10 * s} ${8 * s} Z`, 'white', { w: 0.9, op: 0.8 }); },
    tuft(g, x, y, c) { P(g, `M${x - 3} ${y} l-2 -6 M${x} ${y} l0 -8 M${x + 3} ${y} l2 -6`, null, { w: 1, solid: true, stroke: W[c] || W.green }); },
    flower(g, x, y, c) { L(g, x, y, x, y - 7, { w: 0.9, solid: true, stroke: W.green }); C(g, x, y - 9, 2, c || 'red', { w: 0.6, solid: true }); },
  };
  function scenery(gd, s, idx) {
    const kind = s.bg; if (!kind || kind === 'none') return;
    const w = s.w, g = el('g', { class: 'scenery', opacity: kind === 'night' ? 0.85 : 0.72 }, gd);
    let rs = (idx + 1) * 9301; const rnd = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };
    // the occupied ground, so distant figures stand in the gaps
    const occ = (s.draw || []).filter(d => typeof d[1] === 'number' && d[0] !== 'text' && d[0] !== 'speech' && d[0] !== 'banner').map(d => d[1]);
    const free = []; for (let x = 30; x < w - 30; x += 10) if (occ.every(o => Math.abs(o - x) > 46)) free.push(x);
    const pick = n => { const out = []; let last = -999; for (const x of free) if (x - last > 70 && out.length < n) { out.push(x); last = x; } return out; };
    const hill = (y, amp, c, op) => { const n = Math.max(2, Math.round(w / 60)), st = w / n; let d = `M0 ${G} L0 ${y}`; for (let k = 0; k < n; k++) d += ` Q${k * st + st / 2} ${y - amp * (0.5 + rnd())} ${(k + 1) * st} ${y}`; d += ` L${w} ${G} Z`; P(g, d, c, { w: 1.1, op: op || 1, dir: 'h' }); };
    const sky = () => { for (let k = 0; k < 2; k++) mini.cloud(g, 60 + rnd() * (w - 120), HZ - 30 - rnd() * 24, 0.8 + rnd() * 0.4); for (let k = 0; k < 3; k++) mini.bird(g, 40 + rnd() * (w - 80), HZ - 22 - rnd() * 36, 0.9 + rnd() * 0.5); };
    const folk = (n, opts) => { pick(n).forEach((x, k) => { const r = (rnd() * 6) | 0; const kind2 = (opts && opts.animals) ? opts.animals[r % opts.animals.length] : null;
      if (kind2 && r % 2) mini[kind2](g, x, HZ + 2, 0.75, r % 3 ? 1 : -1);
      else person(g, x, { y: HZ + 2, s: 0.4, face: r % 2 ? 1 : -1, tunic: ['red', 'teal', 'ochre', 'sage', 'blue', 'rust'][r], legs: ['blue', 'rust', 'teal', 'ochre'][r % 4], hair: ['black', 'chestnut', 'ochre', 'grey'][r % 4], pose: ['walk', 'stand', 'point', 'carry', 'wave', 'walk'][r], hold: (opts && opts.hold) ? opts.hold[r % opts.hold.length] : null, garters: false }); }); };
    const ground = (c, extra) => { for (let x = 10; x < w; x += 22 + rnd() * 18) { if (extra === 'flowers' && rnd() < 0.35) mini.flower(g, x, G, ['red', 'ochre', 'white', 'blue'][(rnd() * 4) | 0]); else mini.tuft(g, x, G, c); } };
    if (kind === 'hills' || kind === 'night') {
      if (kind === 'night') { for (let k = 0; k < 14; k++) things.star(g, 20 + rnd() * (w - 40), HZ - 10 - rnd() * 60, 0.35 + rnd() * 0.25); P(g, `M${w - 70} ${HZ - 64} a12 12 0 1 0 8 22 a9 9 0 1 1 -8 -22 Z`, 'white', { w: 1 }); } else sky();
      hill(HZ - 6, 22, 'sage', 0.55); hill(HZ + 10, 14, 'green', 0.35);
      for (let k = 0; k < 4; k++) mini.tree(g, 30 + rnd() * (w - 60), HZ + 4, 0.8 + rnd() * 0.4, k % 2 ? 'green' : 'sage');
      folk(3, { animals: ['sheep', 'horse', 'sheep'] }); ground('green', 'flowers');
    } else if (kind === 'town') {
      sky(); hill(HZ + 4, 8, 'sage', 0.35);
      for (let x = 20; x < w; x += 46 + rnd() * 30) { const r = rnd(); if (r < 0.2) mini.tower(g, x, HZ + 4, 0.9 + rnd() * 0.3); else if (r < 0.32) mini.spire(g, x, HZ + 4, 1); else mini.house(g, x, HZ + 4, 0.8 + rnd() * 0.4, ['buff', 'white', 'ochre', 'buff'][(rnd() * 4) | 0], rnd() < 0.5 ? 'red' : 'rust'); }
      folk(3, { animals: ['dog', 'horse'] }); for (let x = 6; x < w; x += 14) P(g, `M${x} ${G - 1} q5 -4 10 0`, null, { w: 0.8, solid: true, stroke: W.grey });
    } else if (kind === 'campus') {
      sky(); hill(HZ + 4, 6, 'sage', 0.4);
      for (let x = 30; x < w; x += 90 + rnd() * 40) { mini.tower(g, x, HZ + 4, 1.1, 'buff'); mini.house(g, x + 34, HZ + 4, 1, 'buff', 'teal'); }
      for (let k = 0; k < 3; k++) mini.tree(g, 40 + rnd() * (w - 80), HZ + 4, 0.9);
      folk(3, { hold: ['book', 'scroll', null] }); ground('green');
    } else if (kind === 'city') {
      sky(); for (let x = 10; x < w; x += 26 + rnd() * 14) mini.block(g, x, HZ + 6, 1, 30 + rnd() * 50, ['grey', 'blue', 'buff', 'teal', 'grey'][(rnd() * 5) | 0]);
      folk(3, { hold: ['phone', 'laptop', null, 'cup'], animals: ['dog'] }); for (let x = 0; x < w; x += 30) L(g, x, G - 1, x + 16, G - 1, { w: 1, solid: true, stroke: W.ochre });
    } else if (kind === 'valley') {
      mini.cloud(g, w * 0.3, HZ - 40, 1.1); things.sun(g, w - 70, HZ - 44);
      hill(HZ - 10, 30, 'buff', 0.6); hill(HZ + 6, 12, 'sage', 0.4);
      for (let x = 40; x < w; x += 110 + rnd() * 60) { mini.glass(g, x, HZ + 6, 1); mini.palm(g, x + 44, HZ + 6, 0.9); }
      folk(3, { hold: ['phone', 'laptop', 'cup'], animals: ['dog'] }); ground('ochre');
    } else if (kind === 'sea') {
      sky(); hill(HZ - 4, 14, 'sage', 0.4);
      R(g, 0, HZ + 4, w, G - HZ - 22, 'sky', { w: 0, op: 0.45, stroke: 'none', dir: 'h' });
      for (let r = 0; r < 3; r++) for (let x = (r % 2) * 20; x < w; x += 40) P(g, `M${x} ${HZ + 12 + r * 12} q10 -6 20 0`, null, { w: 1, solid: true, stroke: W.teal });
      mini.boat(g, w * 0.2 + rnd() * 60, HZ + 18, 0.9); mini.boat(g, w * 0.75, HZ + 22, 0.7, -1); mini.house(g, 30, HZ + 2, 0.8, 'white', 'red');
      for (let x = 10; x < w; x += 40) P(g, `M${x} ${G - 1} q4 -3 8 0`, null, { w: 0.8, solid: true, stroke: W.ochre });
    } else if (kind === 'snow') {
      hill(HZ - 4, 26, 'white', 0.9); hill(HZ + 10, 14, 'white', 0.7);
      for (let k = 0; k < 5; k++) mini.pine(g, 30 + rnd() * (w - 60), HZ + 6, 0.8 + rnd() * 0.4);
      folk(2, {}); for (let k = 0; k < 10; k++) things.flake(g, 20 + rnd() * (w - 40), HZ - 66 + rnd() * 60, 0.35);
      for (let x = 10; x < w; x += 30) P(g, `M${x} ${G} q8 -6 16 0`, 'white', { w: 0.8, solid: true });
    } else if (kind === 'fields') {
      sky(); things.sun(g, 60, HZ - 44);
      for (let k = 0; k < 4; k++) { const x0 = k * w / 4; P(g, `M${Math.max(0, x0 - 10)} ${HZ + 6} L${Math.min(w, x0 + w / 4 + 10)} ${HZ + 6} L${Math.min(w, x0 + w / 4 + 20)} ${G - 16} L${Math.max(0, x0 - 20)} ${G - 16} Z`, ['ochre', 'sage', 'buff', 'green'][k], { w: 1, op: 0.45, dir: k % 2 ? 'v' : 'h' }); }
      mini.house(g, w * 0.15, HZ + 6, 0.8, 'rust', 'red'); things.pylon(g, w * 0.88, { s: 0.5 }); for (const tr of [0.4, 0.62]) mini.tree(g, w * tr, HZ + 6, 0.8);
      folk(2, { animals: ['horse', 'sheep'], hold: ['staff'] }); ground('green', 'flowers');
    } else if (kind === 'hall') {
      // indoors: an arcade of round arches, hangings and lamps
      for (let x = 20; x < w; x += 70) { P(g, `M${x} ${G} L${x} ${HZ - 50} a35 35 0 0 1 70 0 L${x + 70} ${G}`, null, { w: 1.8, stroke: W.rust }); R(g, x - 4, HZ - 50, 8, G - HZ + 50, 'buff', { w: 1, dir: 'v' }); }
      for (let x = 55; x < w; x += 140) { L(g, x, HZ - 84, x, HZ - 66, { w: 0.9, solid: true }); C(g, x, HZ - 62, 4, 'ochre', { w: 0.9 }); }
      for (let x = 0; x < w; x += 24) R(g, x, G - 3, 12, 3, (x / 24) % 2 ? 'rust' : 'buff', { w: 0.5, solid: true });
    }
  }

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
      scenery(gd, s, i);
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
