/* Luno timeline toy

   A working model of the app's main screen, drawn on a canvas. Each
   <canvas data-luno-toy="…"> on the page gets one, in one of two modes:

     interactive  Dragging across it moves through time, as the timeline does
                  in the app. Tapping the graph or the arrow glides there.
     demo         Not interactive. It scrubs from one night, through the day,
                  to the next night and back, on a loop.

   The astronomy is a port of the app's AstronomyCalculator
   (lib/services/astronomy/astronomy_calculator.dart), the sky colours come
   from its skybox (lib/props/skybox.dart), and the layout follows the app's
   screenshots. Everything is drawn on a 360 × 800 grid, the app's screen in
   logical pixels, and scaled to fit. */

(() => {
  'use strict';

  // The context being drawn into; set by render() for each canvas in turn
  let ctx;

  const W = 360;
  const H = 800;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const LOCATION = { name: 'London, GB', lat: 51.5074, lon: 0, timeZone: 'Europe/London' };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const wrap360 = (a) => ((a % 360) + 360) % 360;
  const signed = (n, digits) => (n < 0 ? '−' : '') + Math.abs(n).toFixed(digits);

  // ---------------------------------------------------------------------------
  // Astronomy: a port of AstronomyCalculator
  // ---------------------------------------------------------------------------

  const RAD = Math.PI / 180;
  const DAY_MS = 86400000;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const E = RAD * 23.4397; // obliquity of the Earth
  const PHI = RAD * LOCATION.lat;
  const LW = RAD * -LOCATION.lon;

  const toDays = (ms) => ms / DAY_MS - 0.5 + J1970 - J2000;

  const rightAscension = (l, b) =>
    Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
  const declination = (l, b) =>
    Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
  const azimuth = (h, dec) =>
    Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(PHI) - Math.tan(dec) * Math.cos(PHI));
  const altitude = (h, dec) =>
    Math.asin(Math.sin(PHI) * Math.sin(dec) + Math.cos(PHI) * Math.cos(dec) * Math.cos(h));
  const siderealTime = (d) => RAD * (280.16 + 360.9856235 * d) - LW;

  // Formula 16.4 of "Astronomical Algorithms" by Jean Meeus (1998)
  const refraction = (h) => {
    if (h < 0) h = 0;
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
  };

  function sunCoords(d) {
    const m = RAD * (357.5291 + 0.98560028 * d);
    const c = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
    const l = m + c + RAD * 102.9372 + Math.PI;
    return { ra: rightAscension(l, 0), dec: declination(l, 0) };
  }

  function moonCoords(d) {
    const l = RAD * (218.316 + 13.176396 * d);
    const m = RAD * (134.963 + 13.064993 * d);
    const f = RAD * (93.272 + 13.229350 * d);
    const lon = l + RAD * 6.289 * Math.sin(m);
    const lat = RAD * 5.128 * Math.sin(f);
    return { ra: rightAscension(lon, lat), dec: declination(lon, lat), dist: 385001 - 20905 * Math.cos(m) };
  }

  function sunAltitude(ms) {
    const d = toDays(ms);
    const s = sunCoords(d);
    return altitude(siderealTime(d) - s.ra, s.dec) / RAD;
  }

  // In degrees, refraction included, as the app plots it
  function moonAltitude(ms) {
    const d = toDays(ms);
    const m = moonCoords(d);
    const alt = altitude(siderealTime(d) - m.ra, m.dec);
    return (alt + refraction(alt)) / RAD;
  }

  // Everything the scene needs for one moment
  function astronomy(ms) {
    const d = toDays(ms);
    const s = sunCoords(d);
    const m = moonCoords(d);
    const moonH = siderealTime(d) - m.ra;
    const moonAlt = altitude(moonH, m.dec);
    const pa = Math.atan2(Math.sin(moonH), Math.tan(PHI) * Math.cos(m.dec) - Math.sin(m.dec) * Math.cos(moonH));

    const sDist = 149598000;
    const psi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    const inc = Math.atan2(sDist * Math.sin(psi), m.dist - sDist * Math.cos(psi));
    const angle = Math.atan2(
      Math.cos(s.dec) * Math.sin(s.ra - m.ra),
      Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra),
    );
    const phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;

    return {
      sunAlt: altitude(siderealTime(d) - s.ra, s.dec) / RAD,
      moonAlt: (moonAlt + refraction(moonAlt)) / RAD,
      moonAz: wrap360(azimuth(moonH, m.dec) / RAD + 180),
      fraction: (1 + Math.cos(inc)) / 2,
      // −1 new, 0 full, +1 new again
      phase: phase * 2 - 1,
      // As in AstronomyApplier: the painter draws the lit side on the right
      // while waxing and on the left while waning, then turns the disc
      rotation: pa - angle + (angle < 0 ? -Math.PI / 2 : Math.PI / 2),
    };
  }

  // Same equal-width buckets as the app's moonPhaseName provider
  function phaseName(p) {
    if (p < -0.875 || p >= 0.875) return 'New Moon';
    if (p < -0.625) return 'Waxing Crescent';
    if (p < -0.375) return 'Waxing Half Moon';
    if (p < -0.125) return 'Waxing Gibbous';
    if (p < 0.125) return 'Full Moon';
    if (p < 0.375) return 'Waning Gibbous';
    if (p < 0.625) return 'Waning Half Moon';
    return 'Waning Crescent';
  }

  // ---------------------------------------------------------------------------
  // Sky colours: a port of _gradientForAltitude in the skybox
  // ---------------------------------------------------------------------------

  const SKY = {
    nightDeep: [5, 5, 16], nightIndigo: [13, 15, 39], nightPurple: [22, 12, 60],
    twilightTop: [26, 14, 60], twilightPurple: [44, 27, 110],
    horizonOrange: [232, 98, 42], horizonWarm: [255, 144, 64],
    dayDeep: [13, 71, 161], dayMid: [21, 101, 192], dayBright: [30, 136, 229],
    dayHorizon: [144, 202, 249], dayHigh: [8, 37, 99],
  };

  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  // Colours from the top of the screen to the bottom, mirrored about the middle
  function skyColours(altDeg) {
    const alt = clamp(altDeg, -90, 90);
    const k = SKY;
    if (alt < -18) return [k.nightDeep, k.nightIndigo, k.nightDeep];
    if (alt < -12) {
      const t = (alt + 18) / 6;
      return [mix(k.nightDeep, k.nightIndigo, t), mix(k.nightIndigo, k.nightPurple, t), mix(k.nightDeep, k.nightIndigo, t)];
    }
    if (alt < -6) {
      const t = (alt + 12) / 6;
      return [mix(k.nightIndigo, k.twilightTop, t), mix(k.nightPurple, k.twilightPurple, t), mix(k.nightIndigo, k.twilightTop, t)];
    }
    let top, upper, horizon;
    if (alt < 0) {
      const t = (alt + 6) / 6;
      [top, upper, horizon] = [k.twilightTop, k.twilightPurple, mix(k.twilightPurple, k.horizonOrange, t)];
    } else if (alt < 10) {
      const t = alt / 10;
      [top, upper, horizon] = [mix(k.twilightTop, k.dayMid, t), mix(k.twilightPurple, k.dayBright, t), mix(k.horizonOrange, k.horizonWarm, t)];
    } else if (alt < 30) {
      const t = (alt - 10) / 20;
      [top, upper, horizon] = [mix(k.dayMid, k.dayDeep, t), mix(k.dayBright, k.dayMid, t), mix(k.horizonWarm, k.dayHorizon, t)];
    } else {
      const t = clamp((alt - 30) / 30, 0, 1);
      [top, upper, horizon] = [mix(k.dayDeep, k.dayHigh, t), mix(k.dayMid, k.dayDeep, t), k.dayHorizon];
    }
    return [top, upper, horizon, upper, top];
  }

  // ---------------------------------------------------------------------------
  // Scene layout, measured from the app's screenshots
  // ---------------------------------------------------------------------------

  const FOV = 90;                // degrees across the screen
  const HORIZON_Y = 318;         // where the horizon sits when the moon is on it
  const HORIZON_PER_DEG = 2.9;   // the horizon drops this far as the moon climbs a degree
  const PX_PER_DEG = 3.47;       // altitude scale of the ruler and moon
  const MOON_R = 32;
  const COMPASS_Y = 607.5;

  const GRAPH = { left: 10, right: 349, base: 727, top: 698, bottom: 756, perDeg: 0.4 };
  GRAPH.mid = (GRAPH.left + GRAPH.right) / 2;
  const GRAPH_SPAN = DAY_MS;     // 24 hours across the graph

  const RESET = { x: 270, y: 657 };
  // Material Icons "undo", on its 24 × 24 grid
  const UNDO_ICON = new Path2D('M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z');

  // Small seeded generator, so the stars and hills are the same every time
  function mulberry32(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const starRng = mulberry32(0xc0de5);
  const stars = Array.from({ length: 200 }, () => ({ az: starRng() * 360, elevation: starRng() }));

  // Three layers of hills, each a 120-point profile round the full circle
  const LAYERS = [
    { seed: 11, offset: 0, amp: 10, alpha: 0.12 },
    { seed: 23, offset: 13, amp: 8, alpha: 0.26 },
    { seed: 37, offset: 26, amp: 6, alpha: 0.54 },
  ].map((layer) => {
    const rng = mulberry32(layer.seed);
    return { ...layer, profile: Array.from({ length: 120 }, () => rng()) };
  });

  function sampleProfile(profile, az) {
    const f = wrap360(az) / 3;
    const i = Math.floor(f);
    const t = (1 - Math.cos((f - i) * Math.PI)) / 2;
    const a = profile[i % 120];
    const b = profile[(i + 1) % 120];
    return a + (b - a) * t;
  }

  const xForAzimuth = (az, viewAz) => W / 2 + ((((az - viewAz) % 360) + 540) % 360 - 180) / FOV * W;

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  const white = (a) => `rgba(255, 255, 255, ${a})`;

  function text(str, x, y, { size = 10, weight = 400, align = 'left', alpha = 1, family = FONT } = {}) {
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = white(alpha);
    ctx.fillText(str, x, y);
  }

  function line(x1, y1, x2, y2, alpha, width = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = white(alpha);
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function triangle(x1, y1, x2, y2, x3, y3, alpha = 1) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = white(alpha);
    ctx.fill();
  }

  function drawSky(sunAlt) {
    const colours = skyColours(sunAlt);
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    colours.forEach((c, i) => gradient.addColorStop(i / (colours.length - 1), `rgb(${c})`));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  // Stars come out as the sky darkens; near the horizon they stay dimmer in twilight
  function drawStars(sunAlt, viewAz, horizonY) {
    const opacity = 1 - clamp((sunAlt + 6) / 12, 0, 1);
    if (opacity <= 0) return;
    const horizonDim = 1 - opacity;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, horizonY);
    ctx.clip();
    for (const star of stars) {
      const x = xForAzimuth(star.az, viewAz);
      if (x < -2 || x > W + 2) continue;
      const vertical = 1 - star.elevation;
      const alpha = opacity * (1 - horizonDim * vertical) * 0.5;
      if (alpha <= 0.01) continue;
      ctx.beginPath();
      ctx.arc(x, vertical * H, 0.9, 0, Math.PI * 2);
      ctx.fillStyle = white(alpha);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMoon(x, y, phase, rotation) {
    const r = MOON_R;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    const k = Math.abs(phase);
    if (k < 0.995) {
      ctx.beginPath();
      if (k < 0.005) {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      } else {
        // Half the disc, then back along the terminator, a half-ellipse
        const rx = r * Math.abs(Math.cos(Math.PI * k));
        const crescent = k > 0.5;
        if (phase < 0) {
          ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
          ctx.ellipse(0, 0, rx, r, 0, Math.PI / 2, -Math.PI / 2, crescent);
        } else {
          ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);
          ctx.ellipse(0, 0, rx, r, 0, Math.PI / 2, -Math.PI / 2, !crescent);
        }
      }
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }

  // Drawn over the moon, so a moon below the horizon is seen through the ground.
  // The front layer runs to the bottom of the screen, under the controls.
  function drawLandscape(viewAz, horizonY, sunAlt) {
    const darkness = 1 - clamp((sunAlt + 6) / 12, 0, 1);
    for (const layer of LAYERS) {
      const base = horizonY + layer.offset;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const az = viewAz + (x - W / 2) / W * FOV;
        const y = base - sampleProfile(layer.profile, az) * layer.amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      // At night a faint line picks out the ridge
      if (darkness > 0.01) {
        ctx.strokeStyle = white(darkness * layer.alpha);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = `rgba(0, 0, 0, ${layer.alpha})`;
      ctx.fill();
    }
  }

  function drawTopBar() {
    for (const y of [73, 78.5, 84]) line(23, y, 39, y, 1, 1.6);
    // The wordmark, spaced out letter by letter
    ctx.font = `300 23px Montserrat, ${FONT}`;
    const letters = ['l', 'u', 'n', 'o'];
    const gap = 8.5;
    const widths = letters.map((l) => ctx.measureText(l).width);
    let x = W / 2 - (widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1)) / 2;
    letters.forEach((l, i) => {
      text(l, x, 74, { size: 23, weight: 300, family: `Montserrat, ${FONT}` });
      x += widths[i] + gap;
    });
  }

  function drawRuler(moonY, alt) {
    const span = 26;
    for (let a = Math.ceil((alt - span) / 2) * 2; a <= alt + span; a += 2) {
      const fade = clamp((span - Math.abs(a - alt)) / 8, 0, 1);
      if (fade <= 0) continue;
      const y = moonY - (a - alt) * PX_PER_DEG;
      const major = a % 10 === 0;
      line(major ? 39 : 43, y, 48, y, 0.9 * fade, 1.2);
      if (major) text(`${signed(a, 0)}°`, 37, y, { size: 7.5, align: 'right', alpha: 0.75 * fade });
    }
    triangle(53, moonY, 59, moonY - 3.5, 59, moonY + 3.5);
    text(`${signed(alt, 2)}°`, 62, moonY, { size: 12 });
  }

  function drawPhaseLabel(moonY, phase, fraction) {
    text(phaseName(phase), 351, moonY - 6, { size: 12, align: 'right' });
    text(`${(fraction * 100).toFixed(1)}%`, 351, moonY + 10, { size: 9.5, align: 'right', alpha: 0.9 });
  }

  const COMPASS_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  function drawCompass(az) {
    text(`${Math.round(az) % 360}°`, W / 2, 549, { size: 16 });
    triangle(W / 2 - 5, 558, W / 2 + 5, 558, W / 2, 565);
    line(W / 2, 565, W / 2, COMPASS_Y, 0.6);
    line(0, COMPASS_Y, W, COMPASS_Y, 0.55);
    for (let a = Math.floor((az - FOV / 2 - 2) / 2) * 2; a <= az + FOV / 2 + 2; a += 2) {
      const x = W / 2 + (a - az) / FOV * W;
      const b = wrap360(a);
      const named = b % 45 === 0;
      line(x, COMPASS_Y, x, COMPASS_Y - (named ? 12 : b % 10 === 0 ? 9 : 5), 0.8);
      if (named) {
        const cardinal = b % 90 === 0;
        text(COMPASS_NAMES[b / 45], x, 588, { size: cardinal ? 10 : 7.5, weight: cardinal ? 600 : 400, align: 'center', alpha: 0.9 });
      }
    }
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: LOCATION.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: LOCATION.timeZone, day: '2-digit', month: '2-digit', year: '2-digit' });
  const longDateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: LOCATION.timeZone, day: 'numeric', month: 'long' });

  function drawControls(ms) {
    text(LOCATION.name, 13, 640, { size: 10 });
    text(`${LOCATION.lat.toFixed(3)}° N`, 13, 653, { size: 10 });
    text(`${LOCATION.lon.toFixed(3)}° E`, 13, 666, { size: 10 });

    roundedRect(125.5, 625.5, 110, 54, 5);
    ctx.strokeStyle = white(0.9);
    ctx.lineWidth = 1;
    ctx.stroke();
    text(timeFormat.format(ms), W / 2, 643, { size: 18, align: 'center' });
    text(dateFormat.format(ms).replace(/\//g, ' '), W / 2, 666, { size: 12, align: 'center' });

    // Back to now: the app's Material "undo" icon, centred on the button
    ctx.save();
    ctx.translate(RESET.x - 12 * 1.15, RESET.y - 11.75 * 1.15);
    ctx.scale(1.15, 1.15);
    ctx.fillStyle = white(0.85);
    ctx.fill(UNDO_ICON);
    ctx.restore();

    // Add an event (not part of the toy)
    line(307, 655, 330, 655, 0.85, 3);
    line(318.5, 643.5, 318.5, 666.5, 0.85, 3);
  }

  function drawCrescent(x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(x - r, y - r, r * 2, r * 2);
    ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.82, 0, Math.PI * 2);
    ctx.fillStyle = white(0.85);
    ctx.fill('evenodd');
    ctx.restore();
  }

  const xForTime = (ms, now) => GRAPH.mid + (ms - now) / GRAPH_SPAN * (GRAPH.right - GRAPH.left);
  const timeForX = (x, now) => now + (x - GRAPH.mid) / (GRAPH.right - GRAPH.left) * GRAPH_SPAN;

  function drawGraph(ms) {
    const g = GRAPH;
    const step = 10 * 60000;
    const start = timeForX(g.left, ms);
    const samples = [];
    for (let s = Math.floor(start / step) * step; s <= timeForX(g.right, ms) + step; s += step) {
      samples.push({ t: s, alt: moonAltitude(s) });
    }

    line(g.left, g.top, g.left, g.bottom, 0.45);
    line(g.right, g.top, g.right, g.bottom, 0.45);
    line(g.left, g.base, g.right, g.base, 0.45);

    ctx.save();
    ctx.beginPath();
    ctx.rect(g.left, g.top - 30, g.right - g.left, g.bottom - g.top + 30);
    ctx.clip();
    const curve = new Path2D();
    samples.forEach((s, i) => {
      const x = xForTime(s.t, ms);
      const y = g.base - s.alt * g.perDeg;
      if (i === 0) curve.moveTo(x, y); else curve.lineTo(x, y);
    });
    const area = new Path2D(curve);
    area.lineTo(xForTime(samples[samples.length - 1].t, ms), g.base);
    area.lineTo(xForTime(samples[0].t, ms), g.base);
    area.closePath();
    ctx.fillStyle = white(0.16);
    ctx.fill(area);
    ctx.strokeStyle = white(0.95);
    ctx.lineWidth = 1.3;
    ctx.stroke(curve);
    ctx.restore();

    // Rises and sets, where the altitude crosses 0.133° as in the app
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1].alt - 0.133;
      const b = samples[i].alt - 0.133;
      if ((a < 0) === (b < 0)) continue;
      const t = samples[i - 1].t + (samples[i].t - samples[i - 1].t) * (a / (a - b));
      const x = xForTime(t, ms);
      if (x < g.left + 3 || x > g.right - 3) continue;
      const rising = a < 0;
      line(x, g.base, x, g.base + 7, 0.75);
      drawCrescent(x, 746, 5.5);
      const ay = 759;
      if (rising) triangle(x - 2.5, ay + 2, x + 2.5, ay + 2, x, ay - 2.5, 0.8);
      else triangle(x - 2.5, ay - 2, x + 2.5, ay - 2, x, ay + 2.5, 0.8);
      text(timeFormat.format(t), clamp(x, 22, W - 22), 771, { size: 9, align: 'center', alpha: 0.8 });
    }

    // The moment on show
    ctx.beginPath();
    ctx.arc(g.mid, g.base, 6.5, 0, Math.PI * 2);
    ctx.strokeStyle = white(0.8);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(g.mid, g.base, 3, 0, Math.PI * 2);
    ctx.fillStyle = white(1);
    ctx.fill();
  }

  // A prompt to drag the dot: the dot pulses, with a label above it.
  // pulse runs from 0 to 1 over each beat.
  function drawHint(pulse) {
    const g = GRAPH;
    const grow = (1 - Math.cos(pulse * Math.PI * 2)) / 2;

    ctx.beginPath();
    ctx.arc(g.mid, g.base, 9 + grow * 9, 0, Math.PI * 2);
    ctx.strokeStyle = white(0.8 * (1 - grow * 0.7));
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(g.mid, g.base, 4.5 + grow * 3, 0, Math.PI * 2);
    ctx.fillStyle = white(1);
    ctx.fill();

    const label = '‹  Drag the dot  ›';
    ctx.font = `600 12.5px ${FONT}`;
    const w = ctx.measureText(label).width + 24;
    roundedRect(g.mid - w / 2, 681, w, 22, 11);
    ctx.fillStyle = white(0.95);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a0e3c';
    ctx.fillText(label, g.mid, 692.5);
  }

  function render(canvas, time, hint = null) {
    ctx = canvas.getContext('2d');
    const scale = canvas.width / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const a = astronomy(time);
    const horizonY = HORIZON_Y + HORIZON_PER_DEG * clamp(a.moonAlt, -45, 45);
    const moonY = horizonY - a.moonAlt * PX_PER_DEG;

    drawSky(a.sunAlt);
    drawStars(a.sunAlt, a.moonAz, horizonY);
    drawMoon(W / 2, moonY, a.phase, a.rotation);
    drawLandscape(a.moonAz, horizonY, a.sunAlt);
    drawTopBar();
    drawRuler(moonY, a.moonAlt);
    drawPhaseLabel(moonY, a.phase, a.fraction);
    drawCompass(a.moonAz);
    drawControls(time);
    drawGraph(time);
    if (hint !== null) drawHint(hint);
    roundedRect(133, 786, 94, 4, 2);
    ctx.fillStyle = white(0.9);
    ctx.fill();
  }

  // ---------------------------------------------------------------------------
  // Shared by both modes
  // ---------------------------------------------------------------------------

  const now = Date.now();
  const HOUR_MS = 3600000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // The sunset nearest to now
  function nearestSunset() {
    const step = 5 * 60000;
    let best = null;
    let prev = sunAltitude(now - DAY_MS);
    for (let t = now - DAY_MS + step; t <= now + DAY_MS; t += step) {
      const alt = sunAltitude(t);
      if (prev >= -0.833 && alt < -0.833 && (best === null || Math.abs(t - now) < Math.abs(best - now))) best = t;
      prev = alt;
    }
    return best ?? now;
  }

  // The darkest moment of the night nearest to now, when the sun is lowest
  function nearestMidnight() {
    const step = 10 * 60000;
    let best = now;
    let lowest = Infinity;
    for (let t = now - DAY_MS / 2; t <= now + DAY_MS / 2; t += step) {
      const alt = sunAltitude(t);
      if (alt < lowest) { lowest = alt; best = t; }
    }
    return best;
  }

  // Keep the canvas sharp at any size, and redraw once the wordmark's font arrives
  function keepSharp(canvas, draw) {
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.round(canvas.clientWidth * ratio);
      if (!width || width === canvas.width) return;
      canvas.width = width;
      canvas.height = Math.round(width * H / W);
      draw();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);
    resize();
    draw();
    if (document.fonts) document.fonts.load('300 23px Montserrat').then(draw, () => {});
  }

  // Runs onVisible(true/false) as the canvas comes into and goes out of view
  function watchVisibility(canvas, onVisible, threshold = 0.25) {
    if (!('IntersectionObserver' in window)) { onVisible(true); return; }
    new IntersectionObserver((entries) => onVisible(entries.some((e) => e.isIntersecting)), { threshold })
      .observe(canvas);
  }

  // ---------------------------------------------------------------------------
  // Interactive mode
  // ---------------------------------------------------------------------------

  function createInteractive(canvas) {
    const MIN_TIME = now - 3.5 * DAY_MS;
    const MAX_TIME = now + 3.5 * DAY_MS;

    // Start just before sunset, so the first thing to see is dusk
    const sunset = nearestSunset();
    const introFrom = sunset - 2 * HOUR_MS;
    const introTo = sunset + 1.75 * HOUR_MS;

    let time = reduceMotion ? sunset + 0.75 * HOUR_MS : introFrom;
    let frame = 0;
    let glide = null;
    let drag = null;

    // The prompt to drag the dot, shown until the reader first interacts
    const HINT_BEAT = 1600;
    let hinting = true;
    let hintPulse = 0;
    let hintLoop = 0; // bumped to stop the running loop

    const draw = () => render(canvas, time, hinting ? hintPulse : null);

    function startPulse() {
      const id = ++hintLoop;
      const beat = (stamp) => {
        if (!hinting || id !== hintLoop) return;
        hintPulse = (stamp % HINT_BEAT) / HINT_BEAT;
        draw();
        requestAnimationFrame(beat);
      };
      requestAnimationFrame(beat);
    }

    function dismissHint() {
      if (!hinting) return;
      hinting = false;
      draw();
    }

    function setTime(ms) {
      time = clamp(ms, MIN_TIME, MAX_TIME);
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
    }

    function glideTo(target, duration = 1800) {
      const from = time;
      const started = performance.now();
      const id = {};
      glide = id;
      const step = (stamp) => {
        if (glide !== id) return;
        const t = clamp((stamp - started) / duration, 0, 1);
        setTime(from + (target - from) * easeInOutCubic(t));
        if (t < 1) requestAnimationFrame(step); else { glide = null; announce(); }
      };
      requestAnimationFrame(step);
    }

    function announce() {
      const a = astronomy(time);
      const where = a.moonAlt >= 0 ? `${a.moonAlt.toFixed(1)}° above the horizon` : `${(-a.moonAlt).toFixed(1)}° below the horizon`;
      canvas.setAttribute('aria-valuenow', String(Math.round((time - now) / 60000)));
      canvas.setAttribute('aria-valuetext',
        `${timeFormat.format(time)} on ${longDateFormat.format(time)}: the moon is ${where}, ` +
        `bearing ${Math.round(a.moonAz) % 360}°, ${phaseName(a.phase).toLowerCase()}, ${(a.fraction * 100).toFixed(1)}% lit`);
    }

    const toLogical = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
    };

    canvas.addEventListener('pointerdown', (event) => {
      dismissHint();
      glide = null;
      canvas.setPointerCapture(event.pointerId);
      drag = { start: toLogical(event), startTime: time, moved: false };
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const p = toLogical(event);
      const dx = p.x - drag.start.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      // The graph follows your finger, so dragging right goes back in time
      if (drag.moved) setTime(drag.startTime - dx / (GRAPH.right - GRAPH.left) * GRAPH_SPAN);
    });

    function endDrag(event) {
      if (!drag) return;
      const { start, moved } = drag;
      drag = null;
      if (moved) { announce(); return; }
      if (event.type !== 'pointerup') return;
      if (Math.hypot(start.x - RESET.x, start.y - RESET.y) < 18) {
        glideTo(now);
      } else if (start.y > GRAPH.top - 10 && start.x > GRAPH.left && start.x < GRAPH.right) {
        glideTo(timeForX(start.x, time));
      }
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    canvas.addEventListener('keydown', (event) => {
      const steps = {
        ArrowRight: 15 * 60000, ArrowUp: 15 * 60000, ArrowLeft: -15 * 60000, ArrowDown: -15 * 60000,
        PageUp: 6 * HOUR_MS, PageDown: -6 * HOUR_MS,
      };
      if (event.key in steps) {
        glide = null;
        setTime(time + steps[event.key] * (event.shiftKey ? 4 : 1));
      } else if (event.key === 'Home') {
        glide = null;
        setTime(now);
      } else {
        return;
      }
      event.preventDefault();
      dismissHint();
      announce();
    });

    keepSharp(canvas, draw);
    announce();

    // Pulse the prompt while the toy can be seen; with reduced motion it stays still
    if (!reduceMotion) {
      watchVisibility(canvas, (visible) => {
        if (visible && hinting) startPulse();
        else hintLoop++;
      });
    }

    // Play through the evening once, the first time the toy comes into view
    if (!reduceMotion) {
      let played = false;
      watchVisibility(canvas, (visible) => {
        if (!visible || played) return;
        played = true;
        setTimeout(() => { if (!drag && glide === null && time === introFrom) glideTo(introTo, 7000); }, 600);
      }, 0.5);
    }
  }

  // ---------------------------------------------------------------------------
  // Demo mode: one night to the next and back, on a loop
  // ---------------------------------------------------------------------------

  function createDemo(canvas) {
    const from = nearestMidnight();
    const to = from + DAY_MS;
    const HOLD = 1500;   // pause at each night, in milliseconds
    const MOVE = 10000;  // to scrub from one night to the other
    const LEG = HOLD + MOVE;

    let time = from;
    let elapsed = 0;
    let last = null;
    let running = false;

    const draw = () => render(canvas, time);

    function timeAt(ms) {
      const p = ms % (LEG * 2);
      const forwards = p < LEG;
      const k = easeInOutCubic(clamp(((forwards ? p : p - LEG) - HOLD) / MOVE, 0, 1));
      return forwards ? from + (to - from) * k : to + (from - to) * k;
    }

    function tick(stamp) {
      if (!running) return;
      if (last !== null) elapsed += stamp - last;
      last = stamp;
      time = timeAt(elapsed);
      draw();
      requestAnimationFrame(tick);
    }

    keepSharp(canvas, draw);
    if (reduceMotion) return;

    // Only run while it can be seen
    watchVisibility(canvas, (visible) => {
      if (visible && !running) {
        running = true;
        last = null;
        requestAnimationFrame(tick);
      } else if (!visible) {
        running = false;
      }
    });
  }

  for (const canvas of document.querySelectorAll('canvas[data-luno-toy]')) {
    if (!canvas.getContext) continue;
    if (canvas.dataset.lunoToy === 'interactive') createInteractive(canvas);
    else createDemo(canvas);
  }
})();
