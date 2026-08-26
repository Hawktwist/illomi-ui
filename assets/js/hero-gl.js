/* ==========================================================================
   Illomi hero field
   Raw WebGL, no library. One fullscreen triangle running a fragment shader.

   What it communicates: the brand idea is a small business becoming findable,
   so the composition is a rigid grid (the layout we build) lit by a moving
   source (the attention it earns). The pointer is the light. That is the
   whole motivation for the animation existing.

   Degrades in this order:
     no WebGL / context lost  ->  the CSS gradient underneath shows through
     prefers-reduced-motion   ->  one static frame, no loop, no pointer
     hero scrolled off screen ->  loop parks itself
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-gl");
  if (!canvas) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* The whole premise of this field is that the pointer is the light. On a
     touch screen there is no pointer, so the loop would be animating a drift
     nobody is driving, at roughly a million shaded pixels a frame, on a
     battery. Touch gets one static frame at a lower buffer and no loop. */
  var coarse = window.matchMedia("(pointer: coarse)").matches
            || window.matchMedia("(max-width: 900px)").matches;
  function still() { return reduced.matches || coarse; }

  var VERT = [
    "attribute vec2 aPos;",
    "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform vec2 uPointer;",
    "uniform float uEnergy;",
    "uniform vec3 uBg;",
    "uniform vec3 uDot;",
    "uniform vec3 uAccent;",
    "uniform float uCalm;",   /* 1 on touch: wind instead of pointer */

    "float hash21(vec2 p){",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",

    "float vnoise(vec2 p){",
    "  vec2 i = floor(p); vec2 f = fract(p);",
    "  f = f * f * (3.0 - 2.0 * f);",
    "  float a = hash21(i);",
    "  float b = hash21(i + vec2(1.0, 0.0));",
    "  float c = hash21(i + vec2(0.0, 1.0));",
    "  float d = hash21(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
    "}",

    "float fbm(vec2 p){",
    "  float v = 0.0; float a = 0.5;",
    "  for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.02 + 17.3; a *= 0.5; }",
    "  return v;",
    "}",

    "void main(){",
    "  vec2 frag = gl_FragCoord.xy;",
    "  vec2 uv = frag / uRes;",
    "  float asp = uRes.x / uRes.y;",
    "  vec2 p = vec2(uv.x * asp, uv.y);",
    "  float t = uTime * 0.06;",

    "  vec2 pm = uPointer / uRes;",
    "  pm = vec2(pm.x * asp, pm.y);",
    "  float light;",
    "  float sway = 0.0;",

    "  if (uCalm > 0.5) {",
    /* Wind. A train of long waves crosses the field, each row of dots picking
       the wave up a beat later than the row above it, which is what makes it
       read as grass rather than as a sliding bar. No noise, three sines. */
    /* uv, not p: p.x only spans the aspect ratio, which on a portrait phone
       is about 0.6, so p.x * 1.15 gave under a quarter of a wave across the
       whole screen. The entire field then pulsed light and dark together
       instead of a crest travelling across it. uv.x always spans 0 to 1, so
       the crest count is the same whatever the screen shape. */
    "    float phase = uv.x * 8.0 - uTime * 0.55 + sin(uv.y * 5.5 + uTime * 0.28) * 0.9;",
    "    float gust = sin(phase) * 0.5 + 0.5;",
    "    light = 0.12 + pow(gust, 2.0) * 0.95;",
    "    sway = sin(phase - 0.6) * 0.5 + 0.5;",
    "  } else {",
    /* domain warped flow: the light source drifting under the grid */
    "    vec2 q = vec2(fbm(p * 1.6 + vec2(t, -t * 0.7)), fbm(p * 1.6 + vec2(4.2 - t * 0.5, 1.7)));",
    "    float flow = fbm(p * 2.2 + q * 1.5 + vec2(0.0, t * 1.2));",
    /* pointer light, brightened by how fast the pointer is moving */
    "    float d = length(p - pm);",
    "    float pointer = exp(-d * d * 7.0) * (0.5 + uEnergy * 0.9);",
    /* slow diagonal sweep so the field still breathes with no pointer at all */
    "    float sweep = smoothstep(0.6, 0.0, abs(sin(t * 1.7 + (p.x * 0.9 + p.y * 0.6) * 2.4)));",
    "    light = clamp(flow * 0.85 + pointer + sweep * 0.2 - 0.3, 0.0, 1.5);",
    "  }",

    /* the grid, sized in device pixels so density does not shift with viewport */
    "  float cell = 24.0;",
    "  vec2 g = mod(frag, cell) / cell - 0.5;",

    /* Desktop: cells lean toward the pointer. Touch: cells lean along the
       wind, which is the whole grass effect. */
    "  if (uCalm > 0.5) {",
    "    g.x -= (sway - 0.5) * 0.34;",
    "    g.y -= (sway - 0.5) * 0.08;",
    "  } else {",
    "    vec2 toLight = normalize(pm - p + vec2(1e-5));",
    "    g -= toLight * light * 0.17;",
    "  }",

    /* past 0.5 the cells overlap, so near the source the grid melts into a
       continuous field instead of staying a field of separate dots */
    "  float r = 0.05 + light * 0.62;",
    "  float aa = 1.4 / cell;",
    "  float mask = 1.0 - smoothstep(r - aa, r + aa, length(g));",

    "  vec3 dotCol = mix(uDot, uAccent, smoothstep(0.25, 0.95, light));",
    "  vec3 col = mix(uBg, dotCol, mask * (0.28 + light * 0.78));",

    /* bloom, written as a mix so it reads correctly in both appearances */
    "  col = mix(col, uAccent, pow(clamp(light, 0.0, 1.0), 3.0) * 0.10);",

    /* edges settle back into the page colour */
    "  vec2 vc = uv - 0.5;",
    "  col = mix(col, uBg, clamp(dot(vc, vc) * 0.95, 0.0, 1.0));",

    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var gl = null;
  try {
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" };
    gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  } catch (e) { gl = null; }
  if (!gl) return;                       /* CSS gradient underneath stands in */

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var U = {
    res: gl.getUniformLocation(prog, "uRes"),
    time: gl.getUniformLocation(prog, "uTime"),
    pointer: gl.getUniformLocation(prog, "uPointer"),
    energy: gl.getUniformLocation(prog, "uEnergy"),
    bg: gl.getUniformLocation(prog, "uBg"),
    dot: gl.getUniformLocation(prog, "uDot"),
    accent: gl.getUniformLocation(prog, "uAccent"),
    calm: gl.getUniformLocation(prog, "uCalm")
  };

  /* ---------- theme colours come from the same CSS tokens as the page ---------- */
  function readVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function toRGB(str) {
    if (!str) return [0, 0, 0];
    if (str.charAt(0) === "#") {
      var h = str.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255
      ];
    }
    var m = str.match(/-?\d+(\.\d+)?/g) || [0, 0, 0];
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  }
  function pushColors() {
    var bg = toRGB(readVar("--bg"));
    var dot = toRGB(readVar("--text-2"));
    var ac = toRGB(readVar("--accent"));
    gl.useProgram(prog);
    gl.uniform3f(U.bg, bg[0], bg[1], bg[2]);
    gl.uniform3f(U.dot, dot[0], dot[1], dot[2]);
    gl.uniform3f(U.accent, ac[0], ac[1], ac[2]);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.uniform1f(U.calm, coarse ? 1.0 : 0.0);
  }

  /* ---------- sizing ---------- */
  var W = 0, H = 0;
  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.75);
    if (rect.width * rect.height > 1600 * 1000) dpr = Math.min(dpr, 1.25);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.res, W, H);
    pointer.x = W * 0.62; pointer.y = H * 0.55;
    target.x = pointer.x; target.y = pointer.y;
  }

  /* ---------- pointer, lerped outside any framework state ---------- */
  var pointer = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var energy = 0;
  var hasPointer = false;

  function onMove(e) {
    var rect = canvas.getBoundingClientRect();
    var dpr = W / Math.max(1, rect.width);
    target.x = (e.clientX - rect.left) * dpr;
    target.y = (rect.height - (e.clientY - rect.top)) * dpr;   /* GL origin is bottom left */
    hasPointer = true;
  }

  /* ---------- loop ---------- */
  var running = false;
  var visible = true;
  var raf = 0;
  var start = performance.now();

  var lastPaint = 0;
  var minDelta = coarse ? 1000 / 30 : 0;   /* a slow wind does not need 60fps */

  function frame(now) {
    raf = 0;
    if (running && visible) raf = requestAnimationFrame(frame);
    if (minDelta && now - lastPaint < minDelta) return;
    lastPaint = now;

    var t = (now - start) / 1000;

    if (!hasPointer) {
      /* idle drift so the field has life before anyone touches it */
      target.x = W * (0.5 + 0.26 * Math.sin(t * 0.21));
      target.y = H * (0.5 + 0.2 * Math.cos(t * 0.17));
    }

    var dx = target.x - pointer.x;
    var dy = target.y - pointer.y;
    pointer.x += dx * 0.055;
    pointer.y += dy * 0.055;

    var speed = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (W * 0.25));
    energy += (speed - energy) * 0.08;

    gl.uniform1f(U.time, t);
    gl.uniform2f(U.pointer, pointer.x, pointer.y);
    gl.uniform1f(U.energy, energy);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function startLoop() {
    if (running || reduced.matches) return;
    running = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function drawOnce() {
    gl.uniform1f(U.time, 12.0);
    gl.uniform2f(U.pointer, W * 0.66, H * 0.58);
    gl.uniform1f(U.energy, 0.35);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- wiring ---------- */
  pushColors();
  resize();

  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      resize();
      if (still()) drawOnce();
    }).observe(canvas);
  } else {
    window.addEventListener("resize", function () { resize(); if (reduced.matches) drawOnce(); });
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { if (!raf && running) raf = requestAnimationFrame(frame); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 }).observe(canvas);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    else if (running && visible && !raf) { start = performance.now() - 1000; raf = requestAnimationFrame(frame); }
  });

  if (!coarse) window.addEventListener("pointermove", onMove, { passive: true });

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    stopLoop();
    canvas.classList.remove("is-live");   /* CSS gradient takes over again */
  });

  function applyMode() {
    if (reduced.matches) { stopLoop(); resize(); drawOnce(); }
    else { startLoop(); }
  }
  if (reduced.addEventListener) reduced.addEventListener("change", applyMode);

  applyMode();
  canvas.classList.add("is-live");

  /* the theme toggle calls this so the field repaints in the new tokens */
  window.IllomiHero = {
    refresh: function () {
      pushColors();
      if (still()) drawOnce();
    }
  };
})();
