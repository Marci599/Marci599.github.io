(() => {
  const W = 421,
    H = 243,
    TOP = 5,
    BOT = 248;
  const $ = (id) => document.getElementById(id);
  // animation timings live in style.css (":root" block "Animation timings"); this reads one in ms
  const T = (name) =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--t-" + name)) * 1000;
  const FD = {
    n: { c: 8, sp: 7, off: {}, src: FONT_N },
    s: { c: 6, sp: 6, off: { 103: -2, 112: -2, 113: -2, 121: -1 }, src: FONT_S },
    t: { c: 5, sp: 3, off: {}, src: FONT_T },
  };
  let fReady = false;
  const FQ = [];
  (function () {
    let n = 0;
    for (const k in FD) {
      const f = FD[k];
      f.img = new Image();
      f.img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = f.c * 16;
        const g = cv.getContext("2d");
        g.drawImage(f.img, 0, 0);
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        f.g = [];
        for (let i = 0; i < 256; i++) {
          const cx = (i % 16) * f.c,
            cy = (i >> 4) * f.c;
          let l = 99,
            r = -1;
          for (let y = 0; y < f.c; y++)
            for (let x = 0; x < f.c; x++)
              if (d[((cy + y) * cv.width + cx + x) * 4 + 3] > 0) {
                if (x < l) l = x;
                if (x > r) r = x;
              }
          f.g[i] = r < 0 ? null : { l, w: r - l + 1 };
        }
        if (++n === 3) {
          FD.m = Object.assign({}, FD.n, { sp: 4 });
          fReady = true;
          FQ.forEach((q) => q());
        }
      };
      f.img.src = f.src;
    }
  })();
  function tint(s, col) {
    const c = document.createElement("canvas");
    c.width = s.width;
    c.height = s.height;
    const g = c.getContext("2d");
    g.drawImage(s, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = col;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  const RAWG = new Set([17, 21]);
  const INV = new Set([1, 2, 11, 12, 9, 13, 14, 15, 18, 160, 161, 162, 163, 164, 165, 166, 167, 176, 180]);
  function cc(ch) {
    const k = ch.charCodeAt(0);
    return ch === "©" ? 9 : ch === "\uE1FF" ? 95 : k >= 0xe000 && k < 0xe100 ? k - 0xe000 : k;
  }
  function tw(str, fk) {
    const f = FD[fk];
    let x = 0;
    for (const ch of String(str)) {
      const gl = f.g[cc(ch)];
      x += gl ? gl.w + 1 : f.sp + 1;
    }
    return Math.max(0, x - 1);
  }
  function wrapL(s, fk, maxW) {
    const out = [];
    let cur = "";
    for (const word of s.split(" ")) {
      const t = cur ? cur + " " + word : word;
      if (tw(t, fk) <= maxW) {
        cur = t;
        continue;
      }
      if (cur) out.push(cur);
      cur = "";
      if (tw(word, fk) > maxW) {
        let part = "";
        for (const ch of word) {
          if (tw(part + ch, fk) > maxW) {
            out.push(part);
            part = ch;
          } else part += ch;
        }
        cur = part;
      } else cur = word;
    }
    if (cur) out.push(cur);
    return out;
  }
  // bitmap text; k = whole-number zoom (1 = native)
  function bt(str, fk, col, sh, k, maxW) {
    const f = FD[fk];
    k = k || 1;
    const ex = fk === "s" ? 2 : 0;
    const lines = maxW ? wrapL(String(str), fk, maxW) : [String(str)];
    const lay = lines.map((l) => {
      let x = 0;
      const it = [];
      for (const ch of l) {
        const i = cc(ch),
          gl = f.g[i];
        if (!gl) {
          x += f.sp + 1;
          continue;
        }
        it.push([i, x, gl, ch.charCodeAt(0) >= 0xe000 && ch !== "\uE1FF", ch === "\uE1FF"]);
        x += gl.w + 1;
      }
      return { it, w: Math.max(1, x - 1) };
    });
    const lh = f.c + 1,
      w = Math.max(...lay.map((q) => q.w)) + (sh ? 1 : 0),
      h = f.c + ex + (lines.length - 1) * lh + (sh ? 1 : 0);
    const t = document.createElement("canvas");
    t.width = w;
    t.height = h;
    const tg = t.getContext("2d");
    lay.forEach((L, li) => {
      for (const [i, px, gl, emo, hid] of L.it)
        if (!hid)
          tg.drawImage(
            f.img,
            (i % 16) * f.c + gl.l,
            (i >> 4) * f.c,
            gl.w,
            f.c,
            px,
            li * lh - (f.off[i] || 0),
            gl.w,
            f.c,
          );
    });
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d");
    if (sh) g.drawImage(tint(t, sh), 1, 1);
    g.drawImage(col === "#fff" ? t : tint(t, col), 0, 0);
    if (fk === "s") {
      g.fillStyle = "#000";
      lay.forEach((L, li) => {
        for (const [i, px] of L.it) if (i === 127) g.fillRect(px + 2, li * lh + 3, 1, 1);
      });
    }
    if (fk === "n" || fk === "m")
      lay.forEach((L, li) => {
        for (const [i, px, gl, emo, hid] of L.it)
          if (!hid && (emo || RAWG.has(i))) {
            const y = li * lh - (f.off[i] || 0);
            g.drawImage(f.img, (i % 16) * f.c + gl.l, (i >> 4) * f.c, gl.w, f.c, px, y, gl.w, f.c);
            if (emo && col === "#000" && INV.has(i)) {
              const im = g.getImageData(px, y, gl.w, f.c),
                a = im.data;
              for (let k = 0; k < a.length; k += 4)
                if (a[k + 3] && a[k] === a[k + 1] && a[k + 1] === a[k + 2])
                  a[k] = a[k + 1] = a[k + 2] = 255 - a[k];
              g.putImageData(im, px, y);
            }
          }
      });
    cv.style.width = w * k + "px";
    cv.style.height = h * k + "px";
    cv.className = "bt";
    return cv;
  }
  function tx(el, str, fk, col, sh, k, maxW) {
    const run = () => {
      el.textContent = "";
      el.appendChild(bt(str, fk, col, sh, k, maxW));
    };
    if (fReady) run();
    else FQ.push(run);
  }
  // speech bubble with a hard drop shadow 3 game pixels right/down (baked in, so it scales pixel-perfect)
  const SH = 3;
  function bubble(lines, tailTop, tc, noSh) {
    const MAXR = 15,
      nc = Math.ceil(lines.length / MAXR),
      nr = Math.ceil(lines.length / nc),
      cw = [];
    for (let k = 0; k < nc; k++) {
      let w = 0;
      lines.slice(k * nr, k * nr + nr).forEach((l) => (w = Math.max(w, tw(l, "n"))));
      cw.push(w);
    }
    const bw = cw.reduce((a, b) => a + b, 0) + (nc - 1) * 10 + 8,
      bh = 8 + 6 + (nr - 1) * 10,
      H = bh + 3,
      y0 = tailTop ? 3 : 0;
    const c = document.createElement("canvas");
    c.width = bw + SH;
    c.height = H + SH;
    const g = c.getContext("2d");
    const shape = (ox, oy) => {
      for (let y = 0; y < bh; y++) {
        const cut = y === 0 || y === bh - 1 ? 2 : y === 1 || y === bh - 2 ? 1 : 0;
        g.fillRect(ox + cut, oy + y + y0, bw - 2 * cut, 1);
      }
      const cx = tc == null ? Math.floor(bw / 2) : tc;
      for (let i = 0; i < 3; i++) {
        const yy = tailTop ? 2 - i : bh + i;
        g.fillRect(ox + cx - (2 - i), oy + yy, (2 - i) * 2 + 1, 1);
      }
    };
    if (!noSh) {
      g.fillStyle = "rgba(0,0,0,.5)";
      shape(SH, SH);
    }
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "#000";
    shape(0, 0);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#fff";
    shape(0, 0);
    lines.forEach((l, i) => {
      const k = Math.floor(i / nr),
        r = i % nr;
      let x = 4;
      for (let j = 0; j < k; j++) x += cw[j] + 10;
      g.drawImage(bt(l, "n", "#000", null, 1), x, y0 + 3 + r * 10);
    });
    c.style.width = c.width + "px";
    c.style.height = c.height + "px";
    c.className = "bt";
    c.bw = bw;
    c.bh = H;
    c.tc0 = tc == null ? Math.floor(bw / 2) : tc;
    return c;
  }
  const stage = $("stage"),
    listp = $("listp"),
    card = $("card"),
    vw = $("vw"),
    ycard = $("ycard");
  // one player-card template, used by the user gallery (#card) and by Your profile (#ycard)
  const CARD_HTML =
    '<div class="cbg"></div><div class="ctb"><button class="ctab ct1 on"></button><button class="ctab ct2"></button><button class="ctab ct3"></button></div><div class="cpage"><canvas class="cav" width="16" height="16"></canvas><div class="nmrow"><span class="cname"></span><span class="flag"></span></div><div class="ca cbd"></div><div class="ca cjoin"></div><div class="ca clbl"></div><div class="ca cmsg"></div><div class="ca ccoin"><span class="coin"></span><span class="cct"></span></div><div class="ca cexp"></div><div class="ca clike"></div><div class="ca cmm"></div><div class="ca cstd"><div class="cstt"></div><span class="stdi"></span></div></div><div class="cstat"><div class="cgrid"></div></div><div class="cssb"><div class="csth"></div></div><div class="ccm"></div><div class="ccsb"><div class="ccth"></div></div>';
  card.innerHTML = CARD_HTML;
  ycard.innerHTML = CARD_HTML;
  const q = (r, k) => r.querySelector("." + k);
  // cut the 26x26 selection sprite into its four 9x9 corners

  // wheel: Firefox reports lines (and our text has no font size), so convert to pixels ourselves
  function wheelTo(view, e) {
    if (e.deltaMode === 0) return false;
    view.scrollBy({ top: e.deltaY * (e.deltaMode === 1 ? 6 : view.clientHeight), behavior: "smooth" });
    return true;
  }
  // fit: scale the 421x243 game-pixel stage to fill the window (any factor, not only whole numbers)
  let scale = 1,
    BK = 1;
  // CSS zoom (not transform) so layout, animation and positions resolve to real device pixels
  // press 1 to toggle true 1:1 (one game pixel = one screen pixel) and fit-to-window
  let native = false;
  function fit() {
    const d = devicePixelRatio || 1;
    scale = native ? 1 / d : Math.min(innerWidth / W, innerHeight / H);
    stage.style.zoom = scale;
    // ball canvas backing store at real device resolution
    const bc = $("balls");
    BK = scale * d;
    bc.width = Math.round(W * BK);
    bc.height = Math.round(253 * BK);
    BK = bc.width / W;
  }
  addEventListener("resize", fit);
  fit();
  addEventListener("keydown", (e) => {
    if (
      e.key !== "1" ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.repeat ||
      (e.target.closest && e.target.closest("input,textarea"))
    )
      return;
    native = !native;
    fit();
  });

  let seed = 7;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const pad = (n) => String(n).padStart(2, "0");
  const PALS = [
    ["#0b1d22", "#3d7a64", "#8fc27a", "#c8f5cf"],
    ["#000", "#fff", "#777", "#000"],
    ["#000", "#000", "#fff", "#fff"],
    ["#1a1a1a", "#f8b070", "#fff", "#000"],
    ["#000", "#ff3a10", "#fff", "#000"],
    ["#0b1d22", "#1d4a4a", "#c8f5cf", "#8fc27a"],
    ["#222", "#8a8a8a", "#fff", "#000"],
  ];
  const MSGS = [
    "Hello!",
    "Let-s-a go!",
    "Looking for co-op partners",
    "Speedrunning World 1-1",
    "Just here for the mushrooms",
    "Check out my levels!",
    "GG",
    "Mamma mia!",
  ];
  const NAMES = [
    "Marci599",
    "PixelFox",
    "NovaKnight",
    "Bluebell",
    "Quokka42",
    "Tofu_Tank",
    "MintyOwl",
    "ZigZagZed",
    "Pumpkin",
    "Rusty",
    "Waffles",
    "Glitchy",
    "Orbit",
    "Sparrow",
    "Doodle",
    "Mossy",
    "Biscuit",
    "Yeti_J",
    "Cobalt",
    "Nimbus",
    "Pogo",
    "Turbo_T",
    "Fizz",
    "Lumi",
    "Gadget",
    "Pebble",
    "Rocket_R",
    "Sunny",
    "Taco_Man",
    "Velvet",
    "Wobble",
    "Zephyr",
    "Ember",
    "Jelly",
    "Moonlit",
    "Banjo_B",
    "Cricket",
    "Dusty",
    "Echo7",
    "Finn_F",
  ];
  const SIZES = [15, 17, 20, 23, 25, 29, 33, 39, 43];
  const U = NAMES.map((name, i) => {
    const me = i === 0;
    const d = me ? 40 : pick(SIZES);
    return {
      i,
      name,
      me,
      d,
      R: d / 2,
      pal: pick(PALS),
      flag: me ? 74 : Math.floor(rnd() * 199), // index into the 8-column flag sheet (74 = Hungary)
      bd: me ? "07.22" : pad(ri(1, 12)) + "." + pad(ri(1, 28)),
      join: me ? "2020.06.26" : ri(2018, 2025) + "." + pad(ri(1, 12)) + "." + pad(ri(1, 28)),
      msg: me ? "GO AWAY" : pick(MSGS),
      exp: me ? 1411 : ri(40, 9800),
      likes: me ? 0 : ri(0, 60),
      com: me ? 0 : ri(0, 25),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      p: 0,
      wait: 0,
    };
  });
  // comments written on each player's profile (u.com of them)
  const PCMT = [
    "nice levels!",
    "GG",
    "hi :)",
    "your stages are so hard",
    "thanks for playing my level",
    "lol",
    "cool profile",
    "10/10",
    "when is the next stage coming?",
    "add me as a friend",
  ];
  U.forEach((u) => {
    u.cm = [];
    for (let k = 0; k < u.com; k++) {
      const h = (u.i * 131 + k * 17 + 7) % 997;
      let a = U[1 + (h % (U.length - 1))];
      if (a === u) a = U[0];
      u.cm.push({ u: a, unk: h % 9 === 0, t: PCMT[(h >> 2) % PCMT.length] });
    }
    u.liked = false;
    // who liked this profile (u.likes of them)
    u.likers = [];
    for (let k = 0, h = u.i * 53 + 11; u.likers.length < Math.min(u.likes, U.length - 2) && k < 400; k++) {
      h = (h * 31 + 17) % 1009;
      const a = U[1 + (h % (U.length - 1))];
      if (a !== u && !u.likers.includes(a)) u.likers.push(a);
    }
    u.likes = u.likers.length; // the count matches the list in the tooltip
  });
  U.forEach((u) => {
    u.id = u.me ? 29 : 100 + ((u.i * 37) % 900);
    u.coins = u.me ? 910 : (u.i * 7919) % 3000;
  });
  // 16x16 avatar art, no outline ring
  function makeAvatar(u) {
    const res = 16;
    const c = document.createElement("canvas");
    c.width = c.height = res;
    const g = c.getContext("2d"),
      m = (res - 1) / 2,
      P = u.pal;
    const noise = [];
    for (let y = 0; y < res; y++) {
      noise[y] = [];
      for (let x = 0; x <= res / 2; x++) noise[y][x] = rnd();
    }
    for (let y = 0; y < res; y++)
      for (let x = 0; x < res; x++) {
        const dist = Math.hypot(x - m, y - m);
        if (dist > res / 2) continue;
        let col;
        if (u.me) {
          const s = Math.abs(x + y - (res - 1)) / 1.41;
          col = s < res * 0.07 ? "#fff" : s < res * 0.17 ? "#c8f5cf" : "#3d7a64";
        } else {
          const n = noise[y][Math.min(x, res - 1 - x)];
          col = n < 0.3 ? P[2] : n < 0.5 ? P[3] : P[1];
          const ex = Math.round(m - res * 0.17),
            ey = Math.round(m - res * 0.08);
          if ((x === ex || x === res - 1 - ex) && (y === ey || y === ey + 1))
            col = P[3] === P[1] ? "#000" : "#fff";
        }
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    u.canvas = c;
  }
  // greyed copy of an avatar (for users filtered out by search)
  function grey(u) {
    if (u.gry) return u.gry;
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const g = c.getContext("2d");
    g.drawImage(u.canvas, 0, 0);
    const im = g.getImageData(0, 0, 16, 16),
      a = im.data;
    for (let i = 0; i < a.length; i += 4) {
      const v = (a[i] * 0.2126 + a[i + 1] * 0.7152 + a[i + 2] * 0.0722) * 0.7;
      a[i] = a[i + 1] = a[i + 2] = v;
    }
    g.putImageData(im, 0, 0);
    return (u.gry = c);
  }

  U.forEach((u) => {
    makeAvatar(u);
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = '<span class="slot"></span>';
    const nm = document.createElement("div");
    nm.className = "nm";
    {
      const sw = document.createElement("div"),
        sy = document.createElement("div");
      sw.className = "w";
      sy.className = "y";
      nm.appendChild(sw);
      nm.appendChild(sy);
      const t = u.name + (u.me ? " (me)" : "");
      tx(sw, t, "n", "#fff", null, 1, 72);
      tx(sy, t, "n", "#ffd23f", null, 1, 72);
    }
    listp.appendChild(nm);
    u.nm = nm;
    u.ns = 0;
    row.addEventListener("click", () => showCard(u.i));
    listp.appendChild(row);
    u.row = row;
    u.match = true;
    u.ly = null;
    u.os = 1;
  });

  const tip = $("tip"),
    asel = $("asel");
  const emptyEl = document.createElement("div");
  emptyEl.className = "empty";
  tx(emptyEl, "No user found.", "n", "#aaa");
  listp.appendChild(emptyEl);
  $("search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    let n = 0;
    U.forEach((u) => {
      const was = u.match;
      u.match = !q || u.name.toLowerCase().includes(q);
      if (was && !u.match && u.p >= 0.999 && mode === "l") u.frozen = true;
      if (u.match) {
        u.frozen = false;
        n++;
      }
      u.row.classList.toggle("hid", !u.match);
      clearTimeout(u.gt);
      if (u.match) u.nm.classList.remove("gone");
      else
        u.gt = setTimeout(() => {
          if (!u.match) u.nm.classList.add("gone");
        }, 400);
    });
    emptyEl.style.display = n ? "none" : "block";
    listp.scrollTop = 0;
    setTimeout(updL, 0);
  });
  U.forEach((u) => {
    for (let t = 0; t < 200; t++) {
      u.x = u.R + rnd() * (W - 2 * u.R);
      u.y = TOP + u.R + rnd() * (BOT - TOP - 2 * u.R);
      if (U.every((o) => o === u || o.x === 0 || Math.hypot(o.x - u.x, o.y - u.y) > o.R + u.R + 1)) break;
    }
    const a = rnd() * 6.283,
      s = 15 + rnd() * 25;
    u.vx = Math.cos(a) * s;
    u.vy = Math.sin(a) * s;
  });

  let busy = false;
  const cur = () =>
    stage.classList.contains("h")
      ? "home"
      : stage.classList.contains("s")
        ? "st"
        : stage.classList.contains("y")
          ? "yp"
          : stage.classList.contains("w")
            ? "wld"
            : stage.classList.contains("p")
              ? "stp"
              : stage.classList.contains("z")
                ? "pz"
                : stage.classList.contains("c")
                  ? "clr"
                  : "gal";
  function go(t, cb) {
    if (busy) return;
    busy = true;
    const was = cur();
    showBtip(null);
    $("fade").style.transitionTimingFunction = "var(--eo)";
    $("fade").style.opacity = 1;
    setTimeout(() => {
      stage.classList.add("inst");
      stage.classList.toggle("h", t === "home");
      stage.classList.toggle("s", t === "st");
      stage.classList.toggle("y", t === "yp");
      stage.classList.toggle("w", t === "wld");
      stage.classList.toggle("p", t === "stp");
      stage.classList.toggle("z", t === "pz");
      stage.classList.toggle("c", t === "clr");
      let pkChanged = false;
      if (pendingPK !== null) {
        pkChanged = pendingPK !== PK;
        setPK(pendingPK);
        pendingPK = null;
      }
      if ((t !== was || pkChanged) && t !== "home") resetMenu(t);
      void stage.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("inst")));
      if (cb) cb();
      else syncHash();
      $("fade").style.transitionTimingFunction = "var(--ei)";
      $("fade").style.opacity = 0;
      setTimeout(() => {
        busy = false;
      }, T("screen-fade"));
    }, T("screen-fade"));
  }
  $("hi1").addEventListener("click", () => go("gal"));
  $("back").addEventListener("click", () => {
    if (cmOn) {
      exitComment(false);
      return;
    }
    go("home");
  });
  $("hi0").addEventListener("click", () => go("st"));
  $("hchipb").addEventListener("click", () => go("yp"));
  $("yb").addEventListener("click", () => go("home"));
  $("edit").addEventListener("click", () => go("yp"));
  $("ctrl").addEventListener("click", () => {
    if (U[sel]) sfSearchCreator(U[sel].name);
    go("wld");
  });
  // Preview: open my own card in the user gallery's bubble view, set up instantly behind the fade
  $("yeye").addEventListener("click", () => go("gal", () => showCard(0)));
  // Your profile: local profile picker (orange mushroom = hover, dim mushroom = active profile)
  const LP = ["MARCI599", "TEST"];
  let lpAct = 0;
  function drawLP() {
    const box = $("lprows");
    box.innerHTML = "";
    const items = LP.map((n, i) => ({ n, i }));
    if (LP.length < 3) items.push({ n: "<Create new>", i: -1 });
    items.forEach((it, k) => {
      const d = document.createElement("div");
      d.className = "lpr" + (it.i === lpAct ? " act" : "");
      d.style.top = 25 + 14 * k + "px";
      d.innerHTML = '<div class="m"></div><div class="t"><div class="w"></div><div class="y"></div></div>';
      tx(q(d, "w"), it.n, "m", "#fff");
      tx(q(d, "y"), it.n, "m", "#ffd23f");
      d.addEventListener("click", () => {
        if (it.i < 0) {
          LP.push("PLAYER" + (LP.length + 1));
          lpAct = LP.length - 1;
        } else lpAct = it.i;
        drawLP();
      });
      box.appendChild(d);
    });
  }
  drawLP();

  // scrollbars
  function bar(view, thumb, track) {
    const upd = () => {
      const h = view.clientHeight,
        t = view.scrollHeight;
      if (t <= h + 1) {
        thumb.style.display = "none";
        return;
      }
      thumb.style.display = "block";
      const th = Math.max(16, Math.round((track * h) / t));
      thumb.style.height = th + "px";
      thumb.style.top = Math.round(((track - th) * view.scrollTop) / (t - h)) + "px";
    };
    view.addEventListener("scroll", upd);
    view.addEventListener(
      "wheel",
      (e) => {
        if (wheelTo(view, e)) e.preventDefault();
      },
      { passive: false },
    );
    thumb.addEventListener("pointerdown", (e) => {
      const y0 = e.clientY,
        s0 = view.scrollTop;
      thumb.setPointerCapture(e.pointerId);
      const mv = (ev) => {
        const tr = track - thumb.offsetHeight;
        view.scrollTop = s0 + ((ev.clientY - y0) / scale / tr) * (view.scrollHeight - view.clientHeight);
      };
      const up = () => {
        thumb.removeEventListener("pointermove", mv);
        thumb.removeEventListener("pointerup", up);
      };
      thumb.addEventListener("pointermove", mv);
      thumb.addEventListener("pointerup", up);
    });
    return upd;
  }
  // stages menu
  const sl = $("sl");
  const upd = bar(sl, $("sth"), 183);
  // Local play: the player's stages / stage packs, shown like the Stage World lists but compact (2 lines).
  // Clicking a row does nothing.
  function fillStages(tab) {
    if (!fReady) {
      FQ.push(() => fillStages(tab));
      return;
    }
    sl.innerHTML = "";
    const SMB = '<span class="thw"><span class="thm"></span><span class="mh"></span></span>';
    (tab === 0 ? WROWS : PROWS).forEach((w) => {
      const d = document.createElement("div");
      d.className = "lr";
      const mk = (k) => {
        const e = document.createElement("div");
        e.className = k;
        d.appendChild(e);
        return e;
      };
      const ts = textTags(w.tags)
        .map((t) => String.fromCharCode(127) + t)
        .join(" ");
      // right side, line 1: tags; line 2: (status + level count +) icons + SMB
      const lt = mk("lt");
      lt.innerHTML = '<div class="n"></div><div class="s"></div>';
      tx(q(lt, "n"), ts, "s", "#4b504a");
      tx(q(lt, "s"), ts, "s", "#adc1a8"); // lighter while selected / pressed, like Stage World rows
      const lb = mk("lb");
      if (w.pack) {
        if (w.status) {
          const st = document.createElement("span");
          lb.appendChild(st);
          tx(st, w.status, "s", "#a0a0a0");
        }
        const lv = document.createElement("span");
        lb.appendChild(lv);
        tx(lv, w.levels + (w.levels === 1 ? " level" : " levels"), "s", "#fff");
        lb.insertAdjacentHTML("beforeend", SMB);
      } else lb.innerHTML = '<span class="tics">' + tagIcons(w) + "</span>" + SMB;
      // left side: title (cut to the space left by the tags) and creator
      let ti = w.title;
      const avail = 401 - 8 - 6 - tw(ts, "s") - 10;
      if (tw(ti, "n") > avail) {
        while (ti.length && tw(ti + "...", "n") > avail) ti = ti.slice(0, -1);
        ti = ti.trimEnd() + "...";
      }
      tx(mk("ti"), ti, "n", "#fff");
      tx(mk("by"), "by " + w.u.name, "s", "#808080");
      d.addEventListener("click", () => {
        sl.querySelectorAll(".lr.sel").forEach((e) => e.classList.remove("sel"));
        d.classList.add("sel"); // selection only, it does not open anything
        placeLov();
      });
      sl.appendChild(d);
    });
    sl.scrollTop = 0;
    upd();
    lHov = null;
    placeLov();
  }
  // frames over the local list: hover (dim, opaque while pressed) and the selected row
  let lHov = null;
  function placeLov() {
    const sel = sl.querySelector(".lr.sel"),
      fr = (el, r) => {
        if (!r) return (el.style.display = "none");
        el.style.top = r.offsetTop - sl.scrollTop + "px";
        el.style.display = "block";
      };
    fr($("lsel"), sel);
    fr($("lhov"), lHov && lHov !== sel ? lHov : null);
  }
  sl.addEventListener("pointermove", (e) => {
    const r = e.pointerType === "mouse" ? e.target.closest(".lr") : null;
    if (r !== lHov) {
      lHov = r;
      placeLov();
    }
  });
  sl.addEventListener("pointerleave", () => {
    lHov = null;
    placeLov();
  });
  sl.addEventListener("pointerdown", (e) => {
    const r = e.target.closest(".lr");
    if (!r) return;
    lHov = r;
    placeLov();
    $("lhov").classList.add("act");
    const up = () => {
      $("lhov").classList.remove("act");
      removeEventListener("pointerup", up);
    };
    addEventListener("pointerup", up);
  });
  sl.addEventListener("scroll", placeLov);
  [$("t1"), $("t2")].forEach((b, i) =>
    b.addEventListener("click", () => {
      $("t1").classList.toggle("on", i === 0);
      $("t2").classList.toggle("on", i === 1);
      fillStages(i);
    }),
  );
  $("sb").addEventListener("click", () => go("home"));
  fillStages(0);
  // search field
  const si = $("search"),
    sq = $("sqc");
  let blink = true;
  function drawS() {
    const v = si.value,
      foc = document.activeElement === si;
    const t = bt(v || "Search...", "n", v ? "#fff" : "#888", null, 1);
    const pre = v.slice(0, si.selectionStart == null ? v.length : si.selectionStart);
    const cx = pre ? tw(pre, "n") + 1 : 0;
    const cw = Math.max(t.width, cx + 1) + 1;
    sq.width = cw;
    sq.height = 8;
    const g = sq.getContext("2d");
    g.clearRect(0, 0, cw, 8);
    g.drawImage(t, 0, 0);
    if (foc && blink) {
      g.fillStyle = "#fff";
      g.fillRect(cx, 0, 1, 8);
    }
    sq.style.width = cw + "px";
    sq.style.height = "8px";
  }
  ["input", "keyup", "keydown", "click", "focus", "blur", "select"].forEach((ev) =>
    si.addEventListener(ev, () => {
      blink = true;
      setTimeout(drawS, 0);
    }),
  );
  setInterval(() => {
    blink = !blink;
    if (fReady) drawS();
  }, 500);
  // main menu profile chip: same avatar as in the user menu
  function drawChip() {
    const c = $("hchip"),
      g = c.getContext("2d");
    g.clearRect(0, 0, 91, 18);
    g.fillStyle = "#101044";
    [6, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 4, 6].forEach((v, y) => g.fillRect(v, y, 91 - 2 * v, 1));
    g.drawImage(U[0].canvas, 1, 1);
    g.drawImage(bt("Marci599", "n", "#fff", "#07071e"), 23, CHIP_TY);
  }
  const CHIP_TY = 5;
  FQ.push(() => {
    tx($("title"), "User gallery", "n", "#fff", "#000");
    tx($("t1"), "Stages", "m", "#fff");
    tx($("t2"), "Stage packs", "m", "#fff");
    drawChip();
    tx($("hft"), "Made by neoarc. Original Game by ©1985 NINTENDO.", "n", "#fff", "#161760");
    [card, ycard].forEach((r) => {
      tx(q(r, "ct1"), "Profile", "m", "#fff");
      tx(q(r, "ct2"), "Statistics", "m", "#fff");
      tx(q(r, "clbl"), "Message", "n", "#233239");
      tx(q(r, "cmm"), "MARIO MULTIVERSE", "s", "#233239");
      tx(q(r, "cstt"), "Standee", "n", "#233239");
    });
    tx($("yttl"), "Your profile", "n", "#fff", "#000");
    tx(q($("lpp"), "lpt"), "Local profile", "n", "#fff");
    tx($("yid"), "ID: " + U[0].id, "n", "#fff", "#000");
    fillCard(ycard, U[0]);
    drawS();
  });
  const updL = bar(listp, $("lth"), 183);
  const lmush = $("lmush");
  let lmRow = null;
  function placeLM() {
    const r = lmRow;
    if (!r || !r.isConnected || !stage.classList.contains("l")) return (lmush.style.display = "none");
    const y = 33 + r.offsetTop - listp.scrollTop + 4;
    lmush.style.top = y + "px";
    lmush.style.display = y < 31 || y > 207 ? "none" : "block";
  }
  listp.addEventListener("pointermove", (e) => {
    const r = e.pointerType === "mouse" ? e.target.closest(".row") : null;
    if (r !== lmRow) {
      lmRow = r;
      placeLM();
    }
  });
  listp.addEventListener("pointerleave", () => {
    lmRow = null;
    placeLM();
  });
  listp.addEventListener("scroll", placeLM);
  FQ.push(() => setTimeout(updL, 0));

  // state
  let mode = "b",
    sel = 0,
    open = false,
    PUB = true;
  function fillCard(r, u) {
    tx(q(r, "cname"), u.name, "n", "#233239", null, 2);
    q(r, "flag").style.backgroundPosition = `${-(u.flag % 8) * 17}px ${-Math.floor(u.flag / 8) * 12}px`;
    tx(q(r, "cbd"), "Birthday: " + u.bd, "n", "#233239");
    tx(q(r, "cjoin"), "Joined: " + u.join, "n", "#233239");
    tx(q(r, "cmsg"), u.msg, "s", "#233239");
    tx(q(r, "cct"), "x" + u.coins, "n", "#233239");
    tx(q(r, "cexp"), "EXP " + u.exp, "n", "#233239");
    // both cards (user list + Your profile): only likes here, comments have their own tab
    tx(q(r, "clike"), "Like " + (u.likes + (u.liked ? 1 : 0)), "s", "#233239");
    q(r, "clike").dataset.tip = "likes"; // text comes from tipText
    tx(q(r, "ct3"), "Comments", "m", "#fff");
    renderProfCm(r, u);
    if (r === card) {
      $("ulike").classList.toggle("on", u.liked);
      $("chat").disabled = u.me; // no comments on your own profile
    }
    renderStats(r, u);
    const g = q(r, "cav").getContext("2d");
    g.clearRect(0, 0, 16, 16);
    g.drawImage(u.canvas, 0, 0);
  }
  function showCard(i) {
    if (!open) setCardTab(card, 0); // a freshly opened card starts on Profile
    sel = i;
    const u = U[i];
    open = true;
    fillCard(card, u);
    card.className =
      (mode === "l" ? "side" : "center") +
      " open ready" +
      (card.classList.contains("t2") ? " t2" : "") +
      (card.classList.contains("t3") ? " t3" : "");
    stage.classList.toggle("mine", u.me);
    U.forEach((o) => o.nm.classList.toggle("sel", o === u));
    stage.classList.add("co");
    syncHash();
    setTimeout(refreshBtip, 0);
  }
  function setCardTab(r, i) {
    $("cmush").style.display = "none";
    if (i === 1) setTimeout(r._updC, 0);
    if (i === 2) setTimeout(() => r._updPcm && r._updPcm(), 0);
    r.classList.toggle("t2", i === 1);
    r.classList.toggle("t3", i === 2);
    q(r, "ct1").classList.toggle("on", i === 0);
    q(r, "ct2").classList.toggle("on", i === 1);
    q(r, "ct3").classList.toggle("on", i === 2);
    if (r === card) {
      if (i !== 2 && cmOn && stage.classList.contains("cmg")) exitComment(false);
      stage.classList.toggle("ccm", i === 2); // the comment button only shows on the Comments tab
      setTimeout(refreshBtip, 0);
    }
  }
  // Comments tab of the user list card: same rows as on a stage's details page
  function renderProfCm(r, u) {
    const box = q(r, "ccm");
    box.innerHTML = "";
    if (!u.cm.length) {
      const e = document.createElement("div");
      e.className = "cmr";
      tx(e, "<There are only lonely plants that cannot speak>", "n", "#7a7a7a", null, 1, 250);
      box.appendChild(e);
    }
    u.cm.forEach((c) => {
      const row = document.createElement("div");
      row.className = "cmr";
      const cv = document.createElement("canvas");
      cv.width = cv.height = 16;
      cv.getContext("2d").drawImage(c.u.canvas, 0, 0);
      const t = document.createElement("div");
      t.className = "ct";
      row.append(cv, t);
      const nm = c.unk ? "(Unknown User)" : c.u.name;
      tx(t, nm + ": " + c.t, "n", c.unk ? "#7a7a7a" : "#233239", null, 1, 234);
      if (!c.unk) {
        const z = document.createElement("div");
        z.className = "nz";
        z.dataset.tip = "Open player card";
        z.setAttribute("data-tipup", "");
        const m = document.createElement("span");
        m.className = "m";
        row.append(z, m);
        const sw = () => (z.style.width = 24 + tw(nm, "n") + "px");
        if (fReady) sw();
        else FQ.push(sw);
        z.addEventListener("click", () => {
          if (r === card) {
            setCardTab(card, 0);
            showCard(c.u.i);
          } else
            go("gal", () => {
              setCardTab(card, 0);
              showCard(c.u.i);
            });
        });
      }
      box.appendChild(row);
    });
    box.scrollTop = 0;
    setTimeout(() => r._updPcm && r._updPcm(), 0);
  }
  // the hover mushroom of the card's comment rows lives outside the card, so the card edge cannot crop it
  const cmush = $("cmush");
  function placeCmush(row) {
    const pc = row && row.closest("[data-pc]");
    if (!row || !row.isConnected || !pc.classList.contains("t3")) return (cmush.style.display = "none");
    const vr = vw.getBoundingClientRect(),
      k = vr.width / W,
      r = row.querySelector("canvas").getBoundingClientRect(),
      cr = q(pc, "ccm").getBoundingClientRect(),
      y = (r.top - vr.top) / k + 3.5;
    if (r.top < cr.top - 2 || r.bottom > cr.bottom + 2) return (cmush.style.display = "none");
    cmush.style.left = Math.round((r.left - vr.left) / k - 10) + "px";
    cmush.style.top = Math.round(y) + "px";
    cmush.style.display = "block";
  }
  [card, ycard].forEach((pc) => {
    const box = q(pc, "ccm");
    let hr = null;
    box.addEventListener("pointerover", (e) => {
      const z = e.target.closest(".nz");
      hr = z ? z.closest(".cmr") : null;
      placeCmush(hr);
    });
    box.addEventListener("pointerleave", () => placeCmush((hr = null)));
    box.addEventListener("scroll", () => placeCmush(hr));
  });
  function noTr(fn) {
    card.style.transition = "none";
    fn();
    void card.offsetWidth;
    card.style.transition = "";
  }
  function offscreen() {
    return new DOMMatrix(getComputedStyle(card).transform).m41 > 363;
  }
  let parkT = 0;
  function park() {
    if (mode !== "b" || open) return;
    if (offscreen())
      noTr(() => {
        card.className = "center";
      });
    else parkT = setTimeout(park, 80);
  }
  function closeCard() {
    open = false;
    stage.classList.remove("co", "mine");
    $("cmush").style.display = "none";
    card.classList.remove("open"); // the tab stays while it slides away; it resets when a card opens again
    syncHash();
    setTimeout(refreshBtip, 0);
    U.forEach((o) => o.nm.classList.remove("sel"));
  }
  card.addEventListener("transitionend", (e) => {
    if (e.target === card && e.propertyName === "height" && card.classList.contains("open"))
      card.classList.add("ready");
  });
  [card, ycard].forEach((r) => {
    q(r, "ct1").addEventListener("click", () => setCardTab(r, 0));
    q(r, "ct2").addEventListener("click", () => setCardTab(r, 1));
    q(r, "ct3").addEventListener("click", () => setCardTab(r, 2));
  });
  [card, ycard].forEach((r) => {
    const u0 = bar(q(r, "ccm"), q(r, "ccth"), 159);
    r._updPcm = () => {
      u0();
      const v = q(r, "ccm");
      q(r, "ccsb").style.visibility = v.scrollHeight > v.clientHeight + 1 ? "visible" : "hidden";
    };
  });
  $("ulike").addEventListener("click", () => {
    const u = U[sel];
    if (!u || u.me) return;
    u.liked = !u.liked;
    $("ulike").classList.toggle("on", u.liked);
    tx(q(card, "clike"), "Like " + (u.likes + (u.liked ? 1 : 0)), "s", "#233239");
    setTimeout(refreshBtip, 0);
  });
  let quiet = false;
  const UI = "#card,.fab,#sbx,#listp,#lsb,#home,#st,#yp,#wld,#stp,#pz,#clrm,#cml";
  stage.addEventListener(
    "click",
    (e) => {
      if (
        mode === "b" &&
        open &&
        !e.target.closest(
          "#card,#whistle,#search,#back,#chat,#ulike,#prof,#edit,#ctrl,#home,#st,#yp,#wld,#stp,#pz,#clrm,#cml,#cin",
        )
      ) {
        closeCard();
        e.stopPropagation();
      }
    },
    true,
  );
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mode === "b" && !e.defaultPrevented && !cmOn) closeCard();
  });

  $("whistle").addEventListener("click", () => {
    const w = $("whistle");
    if (!quiet) {
      w.classList.remove("shake");
      void w.offsetWidth;
      w.classList.add("shake");
      // drop the class when done, so the shake does not replay when the button is shown again
      w.addEventListener("animationend", () => w.classList.remove("shake"), { once: true });
    }
    if (mode === "b") {
      mode = "l";
      stage.classList.add("l");
      {
        let k = 0;
        U.forEach((u) => {
          u.wait = u.match ? k++ * 0.03 : 0;
        });
      }
      clearTimeout(parkT);
      if (open || !offscreen()) {
        card.classList.remove("center");
        card.classList.add("side");
      } else
        noTr(() => {
          card.classList.remove("center");
          card.classList.add("side");
        });
      listp.scrollTop = Math.max(0, sel * 18 - 67);
      showCard(sel);
    } else {
      mode = "b";
      stage.classList.remove("l");
      {
        let k = 0;
        U.forEach((u) => {
          u.wait = u.match ? k++ * 0.02 : 0;
        });
      }
      closeCard();
      clearTimeout(parkT);
      parkT = setTimeout(park, 550);
    }
  });

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  // pointer in game pixels (vw coordinates)
  let mx = -1e4,
    my = -1e4,
    overUI = true,
    hov = null;
  // window point -> game pixels. Measured from the unzoomed #wrap (the stage is centred in it), because
  // some browsers (e.g. VS Code's preview) report getBoundingClientRect of zoomed elements differently.
  function toGame(cx, cy) {
    const r = $("wrap").getBoundingClientRect(),
      l = r.left + (r.width - W * scale) / 2,
      t = r.top + (r.height - H * scale) / 2;
    return [(cx - l) / scale, (cy - t) / scale + 5];
  }
  stage.addEventListener("pointermove", (e) => {
    [mx, my] = toGame(e.clientX, e.clientY);
    overUI = !!e.target.closest(UI);
  });
  stage.addEventListener("pointerleave", () => {
    mx = my = -1e4;
  });
  // hit-test at the click/tap point itself (a tap on a phone has no pointermove before it)
  let lastD = [];
  function ballAt(cx, cy) {
    const [x, y] = toGame(cx, cy);
    for (let k = lastD.length - 1; k >= 0; k--) {
      const q = lastD[k];
      if (q.hit && (x - q.px) ** 2 + (y - q.py) ** 2 <= q.r * q.r) return q.u;
    }
    return null;
  }
  vw.addEventListener("click", (e) => {
    if (e.target.closest(UI)) return;
    const u = ballAt(e.clientX, e.clientY);
    if (u) showCard(u.i);
  });

  const bc = $("balls"),
    bg = bc.getContext("2d");
  bg.imageSmoothingEnabled = false;
  let last = performance.now();
  function twn(o, k, target, now) {
    const s = o["_" + k] || (o["_" + k] = { from: o[k], to: target, t0: now });
    if (s.to !== target) {
      s.from = o[k];
      s.to = target;
      s.t0 = now;
    }
    const t = Math.min(1, (now - s.t0) / 300);
    const e = s.to < s.from ? t * t * t : 1 - Math.pow(1 - t, 3);
    return s.from + (s.to - s.from) * e;
  }
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    for (const u of U) {
      u.x += u.vx * dt;
      u.y += u.vy * dt;
      if (u.x < u.R) {
        u.x = u.R;
        u.vx = Math.abs(u.vx);
      }
      if (u.x > W - u.R) {
        u.x = W - u.R;
        u.vx = -Math.abs(u.vx);
      }
      if (u.y < TOP + u.R) {
        u.y = TOP + u.R;
        u.vy = Math.abs(u.vy);
      }
      if (u.y > BOT - u.R) {
        u.y = BOT - u.R;
        u.vy = -Math.abs(u.vy);
      }
    }
    for (let i = 0; i < U.length; i++)
      for (let j = i + 1; j < U.length; j++) {
        const a = U[i],
          b = U[j],
          dx = b.x - a.x,
          dy = b.y - a.y,
          min = a.R + b.R,
          d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2),
          nx = dx / d,
          ny = dy / d,
          ma = a.R * a.R,
          mb = b.R * b.R,
          ov = min - d;
        a.x -= (nx * ov * mb) / (ma + mb);
        a.y -= (ny * ov * mb) / (ma + mb);
        b.x += (nx * ov * ma) / (ma + mb);
        b.y += (ny * ov * ma) / (ma + mb);
        const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vn < 0) {
          const j2 = (-2 * vn) / (1 / ma + 1 / mb);
          a.vx -= (j2 * nx) / ma;
          a.vy -= (j2 * ny) / ma;
          b.vx += (j2 * nx) / mb;
          b.vy += (j2 * ny) / mb;
        }
      }
    const lt = 33,
      lb = 216,
      dir = mode === "l" ? 1 : -1;
    const D = [];
    for (const u of U) {
      if (u.wait > 0) u.wait -= dt;
      else u.p = clamp(u.p + (dir * dt) / 0.85, 0, 1);
      const e = ease(u.p);
      let px = u.x,
        py = u.y,
        r = u.R,
        op = 1,
        fo = 1,
        clip = null,
        hit = true;
      if (u.p > 0 && u.match) {
        const target = u.row.offsetTop + 9;
        if (u.ly === null) u.ly = target;
        else u.ly += (target - u.ly) * Math.min(1, dt * 12);
        const sy = 33 + u.ly - listp.scrollTop;
        u.nm.style.transform = `translateY(${u.ly - 9}px)`;
        px = lerp(u.x, 19, e);
        py = lerp(u.y, sy, e);
        r = lerp(u.R, 8, e);
        if (sy + 8 <= lt || sy - 8 >= lb) fo = 1 - e;
        const ex = (1 - e) * 400;
        clip = [lt - ex, lb + ex];
        if (fo < 0.5 && e > 0.2) hit = false;
      }
      if (u.p <= 0) u.ly = null;
      if (!u.match) {
        if (u.frozen && u.os > 0.02) {
          px = u.cx;
          py = u.cy;
          r = u.cr;
        } else u.frozen = false;
        op = mode === "l" ? 0 : 0.3;
        if (mode === "l") hit = false;
      } else {
        u.cx = px;
        u.cy = py;
        u.cr = r;
      }
      if (open && mode === "b") hit = false;
      u.os = twn(u, "os", op, now);
      const nt = u.p >= 0.999 && u.match ? 1 : 0;
      u.ns = twn(u, "ns", nt, now);
      u.nm.style.opacity = u.ns;
      D.push({ u, px, py, r, a: u.os * fo, clip, hit: hit && u.os * fo > 0.15 });
    }
    const selD = open && mode === "b" ? D.find((q) => q.u.i === sel) : null;
    if (selD) {
      D.splice(D.indexOf(selD), 1);
      D.push(selD);
    }
    lastD = D;
    bg.setTransform(1, 0, 0, 1, 0, 0);
    bg.clearRect(0, 0, bc.width, bc.height);
    bg.setTransform(BK, 0, 0, BK, 0, 0);
    bg.imageSmoothingEnabled = false;
    for (const q of D) {
      if (q.a <= 0.003) continue;
      bg.globalAlpha = q.a;
      if (q.clip) {
        bg.save();
        bg.beginPath();
        bg.rect(0, q.clip[0], W, q.clip[1] - q.clip[0]);
        bg.clip();
      }
      bg.drawImage(q.u.match ? q.u.canvas : grey(q.u), q.px - q.r, q.py - q.r, q.r * 2, q.r * 2);
      if (q.clip) bg.restore();
    }
    bg.globalAlpha = 1;
    if (selD) {
      const bs = Math.max(selD.r * 2, 20);
      asel.style.transform = `translate(${selD.px - bs / 2}px,${selD.py - bs / 2}px)`;
      asel.style.width = asel.style.height = bs + "px";
      asel.style.display = "block";
    } else asel.style.display = "none";
    hov = null;
    if (!overUI)
      for (let k = D.length - 1; k >= 0; k--) {
        const q = D[k];
        if (q.hit && (mx - q.px) ** 2 + (my - q.py) ** 2 <= q.r * q.r) {
          hov = q.u;
          break;
        }
      }
    stage.style.cursor = hov ? "pointer" : "";
    const hq = hov && hov.p < 0.4 ? D.find((q) => q.u === hov) : null;
    if (hq) {
      const t = hov.name + (hov.me ? " (me)" : "");
      placeTip(tip, [t], false, hq.px, Math.max(19, hq.py - hq.r - 2));
    } else tip.classList.remove("on");
    requestAnimationFrame(frame);
  }
  // ---- statistics tab
  const TILES = [
    [0, 20],
    [76, 20],
    [152, 20],
    [228, 0],
    [304, 0],
    [380, 0],
    [304, 66],
    [380, 60],
    [0, 121],
    [76, 121],
    [152, 121],
    [228, 121],
    [380, 120],
    [0, 212],
    [76, 238],
    [152, 222],
    [228, 222],
    [304, 222],
    [380, 222],
    [0, 323],
    [380, 315],
    [155, 413],
    [0, 424],
  ]; // 75x59 crop origins in the sheet
  const SG = [0, 8, 13, 19, 22, 3, 5, 7, 4, 12, 6];
  const SV = { 0: 613, 8: 206, 13: 295, 19: 150, 22: 10090, 3: 70, 5: 59, 7: 41, 4: 4, 12: 3, 6: 24 };
  function buildStats(r) {
    r._cnum = {};
    const gg = document.createElement("div");
    gg.className = "gg";
    SG.forEach((ix) => {
      const [x, y] = TILES[ix];
      const c = document.createElement("div");
      c.className = "sc";
      c.style.backgroundPosition = `${-x}px ${-y}px`;
      const n = document.createElement("div");
      n.className = "sn";
      c.appendChild(n);
      r._cnum[ix] = { c, n };
      gg.appendChild(c);
    });
    q(r, "cgrid").appendChild(gg);
    const cs = (r._cst = q(r, "cstat"));
    r._updC = bar(cs, q(r, "csth"), 159);
    r.addEventListener(
      "wheel",
      (e) => {
        if (r.classList.contains("t2") && !cs.contains(e.target)) {
          if (!wheelTo(cs, e)) cs.scrollTop += e.deltaY / scale;
          e.preventDefault();
        }
      },
      { passive: false },
    );
  }
  [card, ycard].forEach(buildStats);
  function statVal(u, ix) {
    if (u.me) return SV[ix] || 0;
    const r = ((((u.i + 1) * 7919 + (ix + 3) * 104729) * 2654435761) >>> 0) % 1000;
    if (r % 7 === 0) return 0;
    return (
      1 +
      Math.floor(
        Math.pow(r / 1000, 3) *
          (ix === 22 ? 20000 : ix === 0 || ix === 8 || ix === 13 || ix === 19 ? 900 : 120),
      )
    );
  }
  function renderStats(r, u) {
    const cn = r._cnum;
    const run = () => {
      for (const ix in cn) {
        const v = statVal(u, +ix);
        cn[ix].c.classList.toggle("z", v === 0);
        const sv = String(v);
        tx(cn[ix].n, sv, "n", "#fff", null, tw(sv, "n") * 2 > 69 ? 1 : 2);
      }
    };
    if (fReady) run();
    else FQ.push(run);
    setTimeout(r._updC, 0);
  }
  // ---- button tooltips
  const btip = $("btip");
  let btEl = null;
  function tipText(el) {
    if (el.classList.contains("crh")) return zoneText(el);
    if (el.classList.contains("clike") && el.closest("[data-pc]")) {
      const u = el.closest("#ycard") ? U[0] : U[sel],
        a = u.liked ? [U[0], ...u.likers] : u.likers;
      return a.length ? a.map((x) => x.name).join("\n") : "No likes yet.";
    }
    if (el.id === "whistle") return mode === "l" ? "Spread" : "Sort";
    if (el.id === "prof" || el.id === "yprof")
      return PUB ? "Your profile is public." : "Your profile is private.";
    return el.dataset.tip;
  }
  // place a bubble: tail stays centred on x (game px), the box slides to stay inside the screen
  function placeTip(box, lines, below, x, y) {
    const key = lines.join("\n") + below;
    if (box._key !== key) {
      box._key = key;
      box._bw = bubble(lines, below).bw;
    }
    const bw = box._bw;
    const left = clamp(x - bw / 2, 2, W - 2 - SH - bw);
    const tc = clamp(Math.floor(x - left), 4, bw - 5);
    let c = box.firstChild;
    if (box._k2 !== key + tc) {
      box._k2 = key + tc;
      c = bubble(lines, below, tc);
      box.textContent = "";
      box.appendChild(c);
    }
    box.style.left = x - 0.5 - tc + "px";
    box.style.top = (below ? y : Math.max(5, y - c.bh)) + "px";
    box.classList.add("on");
  }
  function showBtip(el) {
    btEl = el;
    if (!el) {
      btip.classList.remove("on");
      return;
    }
    const str = tipText(el);
    if (!str) {
      btip.classList.remove("on");
      return;
    }
    let ox = 0,
      oy = 0,
      e = el;
    if (el.closest("#wl, #sfd, #card")) {
      const vr = vw.getBoundingClientRect(),
        r = el.getBoundingClientRect(),
        k = vr.width / W;
      ox = (r.left - vr.left) / k;
      oy = (r.top - vr.top) / k;
    } else
      while (e && e !== vw) {
        ox += e.offsetLeft;
        oy += e.offsetTop;
        e = e.offsetParent;
      }
    const below = oy < 40 && !el.hasAttribute("data-tipup");
    placeTip(
      btip,
      str.split("\n").flatMap((l) => wrapL(l, "n", 200)),
      below,
      ox + el.offsetWidth / 2,
      below ? oy + el.offsetHeight + 2 : oy - 2,
    );
  }
  function refreshBtip() {
    if (!btEl) return;
    if (btEl.offsetParent === null) showBtip(null);
    else showBtip(btEl);
  }
  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest ? e.target.closest("[data-tip]") : null;
    if (el !== btEl) showBtip(el);
  });
  [$("prof"), $("yprof")].forEach((b) =>
    b.addEventListener("click", () => {
      PUB = !PUB;
      $("prof").classList.toggle("pub", PUB);
      $("yprof").classList.toggle("pub", PUB);
      setTimeout(refreshBtip, 0);
    }),
  );
  $("whistle").addEventListener("click", () => setTimeout(refreshBtip, 60));
  function resetMenu(t) {
    if (t === "yp") {
      setCardTab(ycard, 0);
      ycard._cst.scrollTop = 0;
    }
    if (t === "wld") resetWorld();
    if (t === "st") {
      $("t1").classList.add("on");
      $("t2").classList.remove("on");
      fillStages(0);
      sl.scrollTop = 0;
    }
    if (t === "gal") {
      si.value = "";
      si.dispatchEvent(new Event("input"));
      if (mode === "l") {
        mode = "b";
        stage.classList.remove("l");
        U.forEach((u) => {
          u.p = 0;
          u.wait = 0;
          u.ly = null;
        });
      }
      if (open) closeCard();
      sel = 0;
      noTr(() => {
        card.className = "center";
      });
      setCardTab(card, 0);
      card._cst.scrollTop = 0;
      listp.scrollTop = 0;
      clearTimeout(parkT);
      U.forEach((u) => {
        u.os = 1;
        u._os = null;
        u.ns = 0;
        u._ns = null;
        u.nm.style.opacity = 0;
        u.frozen = false;
      });
      tip.classList.remove("on");
      showBtip(null);
    }
  }
  // ---- Stage World
  const wl = $("wl"),
    updW = bar(wl, $("wth"), 193);
  let wAsc = false,
    selW = null;
  const WROWS = [];
  // difficulty comes from the clear rate (%): Easy 50-100, Normal 20-50, Hard 5-20, Expert 1-5, Hell 0.5-1, Hell+ 0-0.5
  const DIFF_MIN = [50, 20, 5, 1, 0.5, 0];
  const diffOf = (rate) => DIFF_MIN.findIndex((m) => rate >= m);
  const STAGE_TAGS = [];
  // tag rules
  const TAG_HIDDEN = ["Exclude from challenge", "CTL"]; // never displayed and not counted in the limit
  const TAG_MAX = 4; // most (counted) tags a stage can have
  const TAG_LOCKED = [
    "Official",
    "Contest No.1",
    "Contest No.2",
    "Contest No.3",
    "PixelArtX",
    "Custom enemy",
    "Custom life",
  ]; // greyed out in Edit tags
  const TAG_CONTEST = ["Contest No.1", "Contest No.2", "Contest No.3"]; // only on titles with a "#"
  // tags that are stage packs never have (and the Stage Pack World search does not offer)
  const PACK_NO_TAGS = [
    "PixelArtX",
    "Exclude from challenge",
    ...TAG_CONTEST,
    "CTL",
    "Custom life",
    "Custom enemy",
  ];
  const TAG_EXCL = [
    ["For beginners", "Extreme hell"],
    ["Automatic", "Speedrun"],
    ["Long", "Short"],
    ["Automatic", "Traditional", "Extreme hell"],
  ]; // tags in one group switch each other off
  const TAG_ICONS = [
    ["PixelArtX", "tag-pixelartx"],
    ["Custom life", "tag-custom-life"],
    ["Custom enemy", "tag-custom-enemy"],
  ]; // small icons left of the difficulty badge
  const tagClash = (a, b) => a !== b && TAG_EXCL.some((g) => g.includes(a) && g.includes(b));
  const visTags = (tags) => tags.filter((t) => !TAG_HIDDEN.includes(t));
  // tags shown as text in lists / details: PixelArtX, Custom life and Custom enemy show as icons instead
  const textTags = (tags) => visTags(tags).filter((t) => !TAG_ICONS.some(([x]) => x === t));
  function fixTags(tags, title) {
    const out = [];
    tags.forEach((t) => {
      if (TAG_CONTEST.includes(t) && !title.includes("#")) return;
      if (out.some((o) => tagClash(o, t))) return;
      if (!TAG_HIDDEN.includes(t) && visTags(out).length >= TAG_MAX) return;
      out.push(t);
    });
    // stages with a "#" in the title belong to a contest
    const m = /#(\d)/.exec(title);
    if (title.includes("#") && !out.some((t) => TAG_CONTEST.includes(t)) && visTags(out).length < TAG_MAX)
      out.push("Contest No." + (m && +m[1] >= 1 && +m[1] <= 3 ? m[1] : "1"));
    return out;
  }
  function tagIcons(w) {
    return TAG_ICONS.filter(([t]) => w.tags.includes(t))
      .map(([, f]) => '<span class="tic" style="background-image:url(assets/' + f + '.png)"></span>')
      .join("");
  }
  (function () {
    let sd = 4242;
    const r2 = () => {
      sd |= 0;
      sd = (sd + 0x6d2b79f5) | 0;
      let t = Math.imul(sd ^ (sd >>> 15), 1 | sd);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pk = (a) => a[Math.floor(r2() * a.length)];
    const TAGS = [
      "Traditional",
      "Puzzle",
      "Action",
      "Speedrun",
      "Automatic",
      "Adventure",
      "For beginners",
      "PixelArtX",
      "Tutorial",
      "Extreme hell",
      "Autoscroll",
      "Vertical",
      "Long",
      "Short",
      "Troll",
      "Remake",
      "Broken",
      "Buggy",
      "Official",
      "Exclude from challenge",
      "Technical",
      "Shell",
      "Precision",
      "Contest No.1",
      "Contest No.2",
      "Contest No.3",
      "CTL",
      "Custom life",
      "Music",
      "Custom enemy",
    ];
    STAGE_TAGS.push(...TAGS);
    const A = [
      "Mushroom",
      "Koopa",
      "Lava",
      "Sky",
      "Cloud",
      "Ghost",
      "Pipe",
      "Frozen",
      "Desert",
      "Castle",
      "Jungle",
      "Midnight",
      "Coin",
      "Star",
      "Bowser",
      "Toad",
      "Sunset",
      "Crystal",
      "Thwomp",
      "Bullet Bill",
    ];
    const B = [
      "Run",
      "Fortress",
      "Valley",
      "Gauntlet",
      "Express",
      "Ruins",
      "Tower",
      "Dash",
      "Caverns",
      "Highway",
      "Paradise",
      "Panic",
      "Chase",
      "Lagoon",
      "Factory",
      "Island",
    ];
    const L = [];
    while (L.length < 60) {
      const pre = r2() < 0.2 ? pk(["[Kaizo] ", "[Precision] ", "[Puzzle] ", "#Contest "]) : "";
      const suf = r2() < 0.15 ? pk([" 2", " DX", " - Remix", " #1", " #2", " #3"]) : "";
      const tg = [];
      const nt = 1 + Math.floor(r2() * 3);
      while (tg.length < nt) {
        const x = pk(TAGS);
        if (!tg.includes(x)) tg.push(x);
      }
      const d = Math.floor(Math.pow(r2(), 1.3) * 4);
      L.push([
        pre + pk(A) + " " + pk(B) + suf,
        tg,
        1 + Math.floor(r2() * 39),
        Math.pow(r2(), 2) * 90 + (d < 2 ? 8 : 0),
        Math.floor(r2() * 30),
        r2() < 0.1 ? "?" : (1 + r2() * 6).toFixed(1),
        d,
      ]);
    }
    const DESC = [
      "yesn't",
      "Have fun!",
      "Hard but fair.",
      "My first stage, be nice :)",
      "Speedrun this!",
      "Collect all the coins.",
      "Inspired by World 8-4.",
      "Short and sweet.",
      "No checkpoints. Good luck.",
    ];
    const CMT = [
      "lol",
      "fear",
      "GG",
      "too hard",
      "nice level!",
      "cool idea",
      "i got stuck",
      "10/10",
      "why",
      "love the music",
    ];
    L.forEach((x, i) => {
      const u = r2() < 0.08 ? U[0] : U[1 + Math.floor(r2() * (U.length - 1))];
      const T = 3 * (5 + Math.floor(r2() * 95)),
        Wn = i % 11 === 5 ? 0 : Math.round((T * x[3]) / 100); // a few stages nobody has cleared yet
      const cm = [];
      const nc = Math.floor(r2() * 5);
      for (let k = 0; k < nc; k++) {
        const unk = r2() < 0.15;
        cm.push({ u: U[1 + Math.floor(r2() * (U.length - 1))], unk, t: pk(CMT) });
      }
      const clr = [];
      if (Wn > 0) {
        const n = Math.min(Wn, 1 + Math.floor(r2() * Math.min(Wn, 12)));
        while (clr.length < n) {
          const cu = U[Math.floor(r2() * U.length)];
          if (!clr.includes(cu)) clr.push(cu);
        }
      }
      const sample = (n, pool) => {
        const o = [];
        n = Math.min(n, pool.length);
        while (o.length < n) {
          const c = pool[Math.floor(r2() * pool.length)];
          if (!o.includes(c)) o.push(c);
        }
        return o;
      };
      const others = U.slice(1),
        MODS = ["Cobalt", "Nimbus", "Orbit", "Echo7", "Zephyr"].map((n) => U.find((u) => u.name === n));
      const dlers = sample(x[2], U),
        likers = sample(x[4], others),
        raters = x[5] === "?" ? [] : sample(1 + Math.floor(r2() * 5), MODS),
        scores = raters.map(() => 1 + Math.floor(r2() * 7));
      const times = clr.map(() => 10 + r2() * 80).sort((a, b) => a - b);
      const CF = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 18, 19, 20];
      const cards = [];
      const ncd = 1 + Math.floor(r2() * 3);
      while (cards.length < ncd) {
        const c = pk(CF);
        if (!cards.includes(c)) cards.push(c);
      }
      for (let k = 0, h = i * 31 + 7, extra = [0, 0, 1, 2, 3][(i * 7) % 5]; k < 40 && extra > 0; k++) {
        h = (h * 17 + 5) % 97;
        const c = CF[h % CF.length];
        if (!cards.includes(c)) {
          cards.push(c);
          extra--;
        }
      }
      WROWS.push({
        dlers,
        likers,
        raters,
        times,
        cards,
        clr,
        i,
        title: x[0],
        tags: fixTags(x[1], x[0]),
        up: 1795000000000 - i * 31 * 3600000, // upload time
        // update time: the upload time, or later for stages their creator updated
        upd: 1795000000000 - i * 31 * 3600000 + (i % 4 === 1 ? ((i * 37) % 40) + 1 : 0) * 86400000,
        dl: x[2],
        pct: Math.round((Wn / T) * 100),
        win: Wn,
        lose: T - Wn,
        likes: x[4],
        rate: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "?",
        scores,
        d: diffOf((Wn / T) * 100),
        u,
        desc: pk(DESC),
        cm,
        liked: false,
        cleared: false,
        myBest: null,
      });
    });
  })();
  // ---- Stage Pack World data (shares the Stage World screen; PK = pack mode)
  let PK = false,
    pendingPK = null;
  const PROWS = [];
  (function () {
    let sd = 777;
    const r = () => {
      sd |= 0;
      sd = (sd + 0x6d2b79f5) | 0;
      let t = Math.imul(sd ^ (sd >>> 15), 1 | sd);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = (a) => a[Math.floor(r() * a.length)];
    const NAMES = [
      "AlphaBet",
      "Super Mario Bros 3: The Next Act",
      "SMB1 but short",
      "Koopa Kingdom",
      "World 9 Remix",
      "Coin Rush Collection",
      "Bowser's Big Gauntlet",
      "Toad's Treasure Trip",
      "Kaizo Cup #1",
      "Cloudy Climb Pack",
      "Pipe Dream Saga",
      "Retro Remix #2",
    ];
    const DESC = [
      "...",
      "Play them in order!",
      "A short adventure in 3 acts.",
      "All levels from my series.",
      "Hard but fair.",
      "My first pack, be nice :)",
    ];
    const CMT = ["lol", "GG", "nice pack!", "too hard", "10/10", "loved the ending", "why"];
    const STATUS = ["Completed", "In progress", ""];
    NAMES.forEach((title, i) => {
      const u = i % 5 === 3 ? U[0] : U[1 + Math.floor(r() * (U.length - 1))];
      const tags = [];
      const nt = 1 + Math.floor(r() * 3);
      while (tags.length < nt) {
        const t = pick(STAGE_TAGS);
        if (!tags.includes(t)) tags.push(t);
      }
      const cm = [];
      const nc = Math.floor(r() * 4);
      for (let k = 0; k < nc; k++)
        cm.push({ u: U[1 + Math.floor(r() * (U.length - 1))], unk: r() < 0.15, t: pick(CMT) });
      const status = pick(STATUS);
      PROWS.push({
        pack: true,
        i,
        title,
        u,
        tags,
        levels: 2 + Math.floor(r() * 9),
        status,
        cleared: status !== "", // like and comment unlock once the pack is started (In progress / Completed)
        desc: pick(DESC),
        cm,
        liked: false,
        clr: [],
        el: null,
        stEl: null,
        up: 1795000000000 - i * 53 * 3600000, // upload time
        upd: 1795000000000 - i * 53 * 3600000 + (i % 3 === 1 ? ((i * 29) % 30) + 1 : 0) * 86400000, // update time
      });
      const P = PROWS[PROWS.length - 1],
        sample = (n, pool) => {
          const o = [];
          n = Math.min(n, pool.length);
          while (o.length < n) {
            const c = pick(pool);
            if (!o.includes(c)) o.push(c);
          }
          return o;
        },
        MODS = ["Cobalt", "Nimbus", "Orbit", "Echo7", "Zephyr"].map((n) => U.find((x) => x.name === n));
      P.tags = fixTags(P.tags, title).filter((t) => !PACK_NO_TAGS.includes(t));
      // the stages inside the pack: their own likes, comments, ratings and leaderboard
      P.done = status === "Completed" ? P.levels : status ? 1 + Math.floor(r() * (P.levels - 1)) : 0;
      P.stages = [];
      for (let k = 0; k < P.levels; k++) {
        const T = 3 * (5 + Math.floor(r() * 60)),
          Wn = Math.max(1, Math.round(T * (0.05 + r() * 0.6))),
          clr = sample(1 + Math.floor(r() * 6), U.slice(1)),
          raters = r() < 0.6 ? sample(1 + Math.floor(r() * 4), MODS) : [],
          scores = raters.map(() => 1 + Math.floor(r() * 7)),
          cards = [];
        while (cards.length < 1 + Math.floor(r() * 3)) {
          const c = pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 18, 19, 20]);
          if (!cards.includes(c)) cards.push(c);
        }
        const scm = [];
        for (let j = Math.floor(r() * 3); j > 0; j--)
          scm.push({ u: U[1 + Math.floor(r() * (U.length - 1))], unk: r() < 0.15, t: pick(CMT) });
        P.stages.push({
          inPack: P,
          k,
          i: -1,
          title: title + " (" + (k + 1) + "/" + P.levels + ")",
          u,
          tags: [],
          cards,
          clr,
          times: clr.map(() => 10 + r() * 80).sort((a, b) => a - b),
          win: Wn,
          lose: T - Wn,
          pct: Math.round((Wn / T) * 100),
          dl: 1 + Math.floor(r() * 30),
          dlers: [],
          likes: Math.floor(r() * 10),
          likers: [],
          raters,
          scores,
          rate: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "?",
          cm: scm,
          liked: false,
          cleared: k < P.done,
          myBest: null,
        });
      }
      P.dl = 1 + Math.floor(r() * 39);
      P.dlers = sample(P.dl, U);
      P.likes = Math.floor(r() * 25);
      P.likers = sample(P.likes, U.slice(1));
      P.raters = r() < 0.5 ? sample(1 + Math.floor(r() * 5), MODS) : [];
      P.scores = P.raters.map(() => 1 + Math.floor(r() * 7));
      P.rate = P.scores.length ? (P.scores.reduce((a, b) => a + b, 0) / P.scores.length).toFixed(1) : "?";
    });
  })();
  function setPK(v) {
    PK = v;
    stage.classList.toggle("k", v);
    updWorldBtns();
  }
  function mkPackRow(p) {
    const d = (p.el = document.createElement("div"));
    d.className = "wr";
    const c = document.createElement("canvas");
    c.className = "wa";
    c.width = c.height = 16;
    c.getContext("2d").drawImage(p.u.canvas, 0, 0);
    d.appendChild(c);
    const mk = (k) => {
      const e = document.createElement("div");
      e.className = k;
      d.appendChild(e);
      return e;
    };
    const lv = p.levels + (p.levels === 1 ? " level" : " levels");
    let ti = p.title;
    const avail = 397 - 6 - tw(rowStats(p), "n") - 8 - 20;
    if (tw(ti, "n") > avail) {
      while (ti.length && tw(ti + "...", "n") > avail) ti = ti.slice(0, -1);
      ti = ti.trimEnd() + "...";
    }
    tx(mk("ti"), ti, "n", "#fff");
    const by = mk("by"),
      tg = mk("tg"),
      ts = visTags(p.tags)
        .map((t) => String.fromCharCode(127) + t)
        .join(" ");
    by.innerHTML = tg.innerHTML = '<div class="n"></div><div class="s"></div>';
    tx(q(by, "n"), "by " + p.u.name, "s", "#808080");
    tx(q(by, "s"), "by " + p.u.name, "s", "#808080");
    tx(q(tg, "n"), ts, "s", "#4b504a");
    tx(q(tg, "s"), ts, "s", "#adc1a8");
    p.stEl = mk("st");
    statsInto(p.stEl, p);
    const bd = mk("bd"),
      lvEl = document.createElement("span");
    bd.appendChild(lvEl);
    tx(lvEl, lv, "s", "#fff");
    bd.insertAdjacentHTML(
      "beforeend",
      '<span class="thw"><span class="thm"></span><span class="mh"></span></span>',
    );
    if (p.status) tx(mk("pst"), p.status, "s", "#a0a0a0");
    d.addEventListener("click", () => openStage(p));
  }
  function pkMatch(p) {
    const s = SFS.p,
      lc = (x) => x.toLowerCase();
    if (s.title && !lc(p.title).includes(lc(s.title))) return false;
    if (s.creator && !lc(p.u.name).includes(lc(s.creator))) return false;
    if (s.tags.length && !s.tags.some((t) => p.tags.includes(t))) return false;
    if (s.hideTheme && !s.themes.smb) return false; // every pack uses the SMB theme
    if (p.rate !== "?" && +p.rate < s.minRate) return false;
    if (s.hideCleared && p.status === "Completed") return false;
    if (s.hideBroken && p.tags.includes("Broken")) return false;
    if (s.hideUnrated && p.rate === "?") return false;
    if (s.hideRatedAny && p.raters.length) return false;
    if (s.hideRatedMe && p.ratedByMe) return false;
    return true;
  }
  function refreshRow(w) {
    if (!w.el) return;
    const old = w.el;
    w.el = null;
    (w.pack ? mkPackRow : mkRow)(w);
    w.el.classList.toggle("sel", w === selW);
    if (old.isConnected) old.replaceWith(w.el);
  }
  function mkRow(w) {
    const d = (w.el = document.createElement("div"));
    d.className = "wr";
    const c = document.createElement("canvas");
    c.className = "wa";
    c.width = c.height = 16;
    c.getContext("2d").drawImage(w.u.canvas, 0, 0);
    d.appendChild(c);
    const mk = (k) => {
      const e = document.createElement("div");
      e.className = k;
      d.appendChild(e);
      return e;
    };
    const st =
      String.fromCharCode(19) +
      w.dl +
      " " +
      String.fromCharCode(17) +
      w.pct +
      "% " +
      String.fromCharCode(18) +
      w.likes +
      " " +
      String.fromCharCode(21) +
      w.rate;
    w.stEl = null;
    let ti = w.title;
    const avail = 397 - 6 - tw(C(16) + " " + st, "n") - 8 - 20;
    if (tw(ti, "n") > avail) {
      while (ti.length && tw(ti + "...", "n") > avail) ti = ti.slice(0, -1);
      ti = ti.trimEnd() + "...";
    }
    tx(mk("ti"), ti, "n", "#fff");
    {
      const by = mk("by"),
        tg = mk("tg"),
        ts = textTags(w.tags)
          .map((t) => String.fromCharCode(127) + t)
          .join(" ");
      by.innerHTML = tg.innerHTML = '<div class="n"></div><div class="s"></div>';
      tx(q(by, "n"), "by " + w.u.name, "s", "#808080");
      tx(q(by, "s"), "by " + w.u.name, "s", "#808080");
      tx(q(tg, "n"), ts, "s", "#4b504a");
      tx(q(tg, "s"), ts, "s", "#adc1a8");
    }
    w.stEl = mk("st");
    statsInto(w.stEl, w);
    d.addEventListener("click", () => openStage(w));
    const bd = mk("bd");
    bd.innerHTML =
      '<span class="tics">' +
      tagIcons(w) +
      '</span><span class="bdg d' +
      w.d +
      '"></span><span class="thw"><span class="thm"></span><span class="mh"></span></span>';
  }
  function buildWorld() {
    wl.innerHTML = "";
    let rows;
    if (PK) {
      rows = sortRows(PROWS).filter((p) => pkMatch(p) && (!fMyP || p.u === U[0]));
      tx($("wttl"), "Stage Pack World (" + rows.length + ")", "n", "#fff");
    } else {
      rows = sortRows(WROWS).filter(
        (w) => sfMatch(w) && (!fMy || w.u === U[0]) && (!fHash || w.title.includes("#")),
      );
      tx($("wttl"), "Stage World (" + rows.length + ")", "n", "#fff");
    }
    rows.forEach((w) => {
      if (!w.el) (w.pack ? mkPackRow : mkRow)(w);
      w.el.classList.toggle("sel", w === selW);
      wl.appendChild(w.el);
    });
    wl.scrollTop = 0;
    setTimeout(updW, 0);
    placeSel();
  }
  // row hover frame lives outside the list panel, so the panel's rounded clip does not cut it
  const whov = $("whov");
  let hovRow = null,
    wpx = -1,
    wpy = -1;
  function placeHov() {
    if (!hovRow || !hovRow.isConnected || (selW && hovRow === selW.el)) {
      whov.style.display = "none";
    } else {
      whov.style.top = hovRow.offsetTop - wl.scrollTop + "px";
      whov.style.display = "block";
    }
    placeSel();
  }
  function placeSel() {
    const ws = $("wsel"),
      r = selW && selW.el;
    if (!r || !r.isConnected) {
      ws.style.display = "none";
      return;
    }
    ws.style.top = r.offsetTop - wl.scrollTop + "px";
    ws.style.display = "block";
  }
  wl.addEventListener("pointermove", (e) => {
    wpx = e.clientX;
    wpy = e.clientY;
    const r = e.target.closest(".wr");
    if (r !== hovRow) {
      hovRow = r;
      placeHov();
    }
  });
  wl.addEventListener("pointerleave", () => {
    hovRow = null;
    wpx = -1;
    placeHov();
  });
  wl.addEventListener("pointerdown", (e) => {
    const r = e.target.closest(".wr");
    if (!r) return;
    if (selW && selW.el !== r) {
      selW.el.classList.remove("sel");
      selW = null;
      placeSel();
    }
    hovRow = r;
    placeHov();
    r.classList.add("press");
    whov.classList.add("act");
    const up = () => {
      r.classList.remove("press");
      whov.classList.remove("act");
      removeEventListener("pointerup", up);
      removeEventListener("pointercancel", up);
    };
    addEventListener("pointerup", up);
    addEventListener("pointercancel", up);
  });
  wl.addEventListener("scroll", () => {
    if (btEl && btEl.closest && btEl.closest("#wl")) showBtip(null);
    if (wpx >= 0) {
      const el = document.elementFromPoint(wpx, wpy);
      hovRow = el && el.closest ? el.closest(".wr") : null;
    }
    placeHov();
  });
  // ---- Stage World sorting: the arrow flips the direction, "Upload time" opens the sort popup
  const SORTS = [
    ["Upload time", (w) => w.up],
    ["Update time", (w) => w.upd],
    ["Likes", (w) => w.likes + (w.liked ? 1 : 0)],
    ["Clear rate", (w) => w.win / (w.win + w.lose)],
    ["Download count", (w) => w.dl],
    ["Developer's rating", (w) => (w.rate === "?" ? -1 : +w.rate)],
  ];
  // stage packs have no clear rate
  const PSORTS = SORTS.filter(([n]) => n !== "Clear rate");
  const sorts = () => (PK ? PSORTS : SORTS);
  let wSort = 0;
  function sortRows(list) {
    const key = sorts()[wSort][1];
    const out = [...list].sort((a, b) => key(b) - key(a) || a.i - b.i); // highest first, arrow down
    return wAsc ? out.reverse() : out;
  }
  function setSort(k) {
    wSort = k;
    tx($("wst"), sorts()[k][0], "n", "#fff");
    buildWorld();
  }
  function resetWorld() {
    selW = null;
    hovRow = null;
    placeHov();
    wAsc = false;
    $("warr").classList.remove("up");
    wSort = 0;
    tx($("wst"), sorts()[0][0], "n", "#fff");
    buildWorld();
  }
  FQ.push(() => {
    tx($("warr"), String.fromCharCode(166), "n", "#fff");
    tx($("wst"), sorts()[wSort][0], "n", "#fff");
    buildWorld();
  });
  $("warr").addEventListener("click", () => {
    wAsc = !wAsc;
    $("warr").classList.toggle("up", wAsc);
    buildWorld();
  });

  // ---- Stage World: "my" and "#" toggles (applied on top of the search)
  let fMy = false,
    fMyP = false, // "my" in the Stage Pack World
    fHash = false;
  function updWorldBtns() {
    $("wmy").classList.toggle("on", PK ? fMyP : fMy);
    $("whash").classList.toggle("on", fHash);
    $("wsrch").classList.toggle("on", !sfSame(SFS[PK ? "p" : "s"], sfDefault()));
    $("wmy").dataset.tip = PK ? "Filter to my stage packs" : "Filter to my stages";
  }
  $("wmy").addEventListener("click", () => {
    if (PK) fMyP = !fMyP;
    else fMy = !fMy;
    updWorldBtns();
    buildWorld();
  });
  $("whash").addEventListener("click", () => {
    fHash = !fHash;
    $("whash").classList.toggle("on", fHash);
    buildWorld();
  });
  // ---- Stage World: search & filters dialog
  // Layout values (game pixels, same coordinates as the screenshots / 3).
  const SFL = {
    left: 4, // dialog position and size; the space below it holds the round buttons
    top: 9,
    width: 404,
    height: 205,
    barLeft: 410, // scrollbar, outside the dialog; dialog + scrollbar are centred with 4px on both sides
    padX: 16, // left edge of the rows, labels, tags and hide options (the mushroom sits 12px left of an item)
    indent: 24, // left edge of the theme icons row
    listTop: 3, // scrollable part, inside the white border
    listBottom: 3,
    line: 16, // row height
    tagGap: 16, // horizontal gap between tags
    badgeGap: 6, // horizontal gap between difficulty badges
    labelGap: 6, // gap after a row label
    checkGap: 1, // gap between a check mark and its label
  };
  const SF_BG = "#003256", // dialog background
    SF_OFF = "#00223b"; // colour of an unticked check mark
  const DIFFS = ["Easy", "Normal", "Hard", "Expert", "Hell", "Hell+"];
  const THEMES = [{ k: "smb", cls: "sfsmb", tip: "Super Mario Bros." }];
  const sfDefault = () => ({
    title: "",
    creator: "",
    diff: DIFFS.map(() => true),
    themes: { smb: true },
    minRate: 1,
    hideTheme: false,
    hideCleared: false,
    hideBroken: false,
    hideUnrated: false,
    hideRatedAny: false,
    hideRatedMe: false,
    tags: [],
  });
  const SFS = { s: sfDefault(), p: sfDefault() }; // applied search: Stage World / Stage Pack World
  let sfDummy = 0,
    sfDraft = null; // being edited in the dialog
  const sfSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function sfMatch(w) {
    const s = SFS.s,
      lc = (x) => x.toLowerCase();
    if (s.title && !lc(w.title).includes(lc(s.title))) return false;
    if (s.creator && !lc(w.u.name).includes(lc(s.creator))) return false;
    if (!s.diff[w.d]) return false;
    if (s.hideTheme && !s.themes.smb) return false; // every stage uses the SMB theme
    if (w.rate !== "?" && +w.rate < s.minRate) return false;
    if (s.hideCleared && (w.cleared || w.clr.includes(U[0]))) return false;
    if (s.hideBroken && w.tags.includes("Broken")) return false;
    if (s.hideUnrated && w.rate === "?") return false;
    if (s.hideRatedAny && w.raters.length) return false;
    if (s.hideRatedMe && w.ratedByMe) return false; // rating was removed, so nothing is rated by you
    if (s.tags.length && !s.tags.some((t) => w.tags.includes(t))) return false;
    return true;
  }
  const sfd = $("sfd"),
    sfc = $("sfc"),
    sfb = $("sfb"),
    sfs = $("sfs"),
    sfl = $("sfl"),
    sfin = $("sfin");
  let sfItems = [],
    sfEdit = null, // "title" | "creator" while typing
    sfBlink = true,
    sfAnim = 0,
    sfOpen = false;
  const updSf0 = bar(sfs, $("sfth"), SFL.height);
  function updSf() {
    updSf0();
    $("sfsb").style.display = sfs.scrollHeight > sfs.clientHeight + 1 ? "block" : "none";
  }
  // pixel border: white 3px frame with rounded corners, filled with the dialog colour
  function sfFrame(h) {
    drawFrame(sfc, SFL.width, h, SFL.top, SFL.height);
    // the scrollbar grows and shrinks together with the popup
    h = Math.max(1, Math.round(h));
    const sb = $("sfsb");
    sb.style.top = Math.round(SFL.top + (SFL.height - h) / 2) + "px";
    sb.style.height = h + "px";
  }
  // draws a popup frame of height h, centred on the full height H of a popup whose top is at top
  function drawFrame(cv, w, h, top, H) {
    h = Math.max(1, Math.round(h));
    cv.width = w;
    cv.height = h;
    cv.style.top = Math.round(top + (H - h) / 2) + "px";
    const g = cv.getContext("2d"),
      O = [5, 3, 2, 1, 1],
      I = [6, 5, 4];
    for (let y = 0; y < h; y++) {
      const e = Math.min(y, h - 1 - y);
      const o = e < O.length ? O[e] : 0;
      g.fillStyle = "#fff";
      g.fillRect(o, y, w - 2 * o, 1);
      if (e >= 3) {
        const i = e - 3 < I.length ? I[e - 3] : 3;
        g.fillStyle = SF_BG;
        g.fillRect(i, y, w - 2 * i, 1);
      }
    }
  }
  function sfText(el, str, col) {
    el.textContent = "";
    el.appendChild(bt(str, "n", col || "#fff"));
  }
  // one hoverable / clickable entry, a full row tall so it is easy to hit
  function sfItem(par, x, y, build, click, tip, ctx) {
    const d = document.createElement("div");
    d.className = "sfi" + (click ? " act" : "");
    d.style.left = x + "px";
    d.style.top = y + "px";
    d.style.height = SFL.line + "px";
    if (tip) d.dataset.tip = tip;
    const body = document.createElement("div");
    body.className = "sfv";
    d.appendChild(body);
    if (click) {
      const m = document.createElement("span");
      m.className = "m";
      d.appendChild(m);
      // act on release (a first tap on touch screens only sets :hover, and click could need a second one)
      let pd = false;
      d.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pd = true;
      });
      d.addEventListener("pointerleave", () => (pd = false));
      d.addEventListener("pointerup", (e) => {
        if (!pd) return;
        pd = false;
        click();
        if (ctx) ctx.refresh();
        else sfRefresh();
      });
    }
    par.appendChild(d);
    const it = { d, upd: () => build(body) };
    (ctx ? ctx.items : sfItems).push(it);
    it.upd();
    return d;
  }
  const sfCheckW = () => tw(C(16), "n") + SFL.checkGap;
  function sfCheck(body, on, label, col) {
    body.textContent = "";
    body.style.gap = SFL.checkGap + "px";
    body.appendChild(bt(C(16), "n", on ? "#fff" : SF_OFF));
    if (typeof label === "string") body.appendChild(bt(label, "n", col || "#fff"));
    else body.appendChild(label());
  }
  function sfLabel(par, str, x, y) {
    const e = document.createElement("div");
    e.className = "sfl";
    e.style.left = x + "px";
    e.style.top = y + "px";
    e.style.height = SFL.line + "px";
    par.appendChild(e);
    sfText(e, str);
    return tw(str, "n") + SFL.labelGap;
  }
  function sfField(key) {
    const v = sfDraft[key];
    if (sfEdit === key) return v + (sfBlink ? "_" : "");
    return v || "<All>";
  }
  const sfSpan = (cls) => () => {
    const e = document.createElement("span");
    e.className = cls;
    return e;
  };
  function sfBuild() {
    sfl.textContent = "";
    sfItems = [];
    const P = SFL.padX,
      IN = SFL.indent,
      L = SFL.line,
      right = SFL.width - 10,
      what = PK ? "Pack" : "Stage";
    let y = 2,
      x;
    // text fields
    [
      ["title", what + " title:"],
      ["creator", what + " creator:"],
    ].forEach(([k, lab]) => {
      sfItem(
        sfl,
        P,
        y,
        (b) => sfText(b, lab + " " + sfField(k)),
        () => sfStartEdit(k),
      );
      y += L;
    });
    // difficulty (stages only)
    if (!PK) {
      x = P + sfLabel(sfl, "Difficulty:", P, y);
      DIFFS.forEach((n, k) => {
        sfItem(
          sfl,
          x,
          y,
          (b) => sfCheck(b, sfDraft.diff[k], sfSpan("bdg d" + k)),
          () => (sfDraft.diff[k] = !sfDraft.diff[k]),
          "Clear rate " + DIFF_MIN[k] + "-" + (k ? DIFF_MIN[k - 1] : 100) + "%",
        );
        x += sfCheckW() + (k === 3 ? 34 : 33) + SFL.badgeGap;
      });
      y += L;
    }
    // tags, flowing in rows
    sfLabel(sfl, what + " tag:", P, y);
    y += L;
    x = P;
    (PK ? STAGE_TAGS.filter((t) => !PACK_NO_TAGS.includes(t)) : STAGE_TAGS).forEach((tg) => {
      const wdt = sfCheckW() + tw(tg, "n");
      if (x > P && x + wdt > right) {
        x = P;
        y += L;
      }
      sfItem(
        sfl,
        x,
        y,
        (b) => sfCheck(b, sfDraft.tags.includes(tg), tg),
        () => {
          const a = sfDraft.tags;
          if (a.includes(tg)) a.splice(a.indexOf(tg), 1);
          else a.push(tg);
        },
      );
      x += wdt + SFL.tagGap;
    });
    y += L;
    {
      // themes
      x = P + sfLabel(sfl, "Theme:", P, y);
      sfItem(
        sfl,
        x,
        y,
        (b) => sfText(b, "Toggle All"),
        () => {
          const all = THEMES.every((t) => sfDraft.themes[t.k]);
          THEMES.forEach((t) => (sfDraft.themes[t.k] = !all));
        },
      );
      y += L;
      x = IN;
      THEMES.forEach((th) => {
        sfItem(
          sfl,
          x,
          y,
          (b) => sfCheck(b, sfDraft.themes[th.k], sfSpan(th.cls)),
          () => (sfDraft.themes[th.k] = !sfDraft.themes[th.k]),
          th.tip,
        );
        x += sfCheckW() + 26 + SFL.tagGap;
      });
      y += L;
      // minimum rating
      sfItem(
        sfl,
        P,
        y,
        (b) => sfText(b, "Minimum dev-rating:   " + String(sfDraft.minRate).padStart(2, "0")),
        () => (sfDraft.minRate = (sfDraft.minRate % 7) + 1),
      );
      y += L;
      // hide options
      [
        ["hideTheme", "Hide # using undesired game themes"],
        ["hideCleared", "Hide already cleared #"],
        ["hideBroken", "Hide broken #"],
        ["hideUnrated", "Hide unrated #"],
        ["hideRatedAny", "Hide already rated # (by anyone)"],
        ["hideRatedMe", "Hide already rated # (by you)"],
      ].forEach(([k, l]) => {
        l = l.replace("#", PK ? "stage packs" : "stages");
        sfItem(
          sfl,
          P,
          y,
          (b) => sfCheck(b, sfDraft[k], l),
          () => (sfDraft[k] = !sfDraft[k]),
        );
        y += L;
      });
    }
    sfl.style.height = y + 2 + "px";
    sfs.scrollTop = 0;
    setTimeout(updSf, 0);
  }
  function sfRefresh() {
    if (sfOpen) sfItems.forEach((it) => it.upd());
  }
  function sfStartEdit(k) {
    sfEdit = k;
    sfin.value = sfDraft[k];
    sfBlink = true;
    sfin.focus();
    sfin.setSelectionRange(sfin.value.length, sfin.value.length);
  }
  function sfEndEdit() {
    if (!sfEdit) return;
    sfEdit = null;
    sfin.blur();
    sfRefresh();
  }
  sfin.addEventListener("input", () => {
    if (!sfEdit) return;
    let v = [...sfin.value].filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126).join("");
    const lab = sfEdit === "title" ? "Stage title: " : "Stage creator: ";
    while (v && tw(lab + v + "_", "n") > SFL.width - SFL.padX - 20) v = v.slice(0, -1);
    if (v !== sfin.value) sfin.value = v;
    sfDraft[sfEdit] = v;
    sfBlink = true;
    sfRefresh();
  });
  sfin.addEventListener("blur", () => {
    if (sfEdit) {
      sfEdit = null;
      sfRefresh();
    }
  });
  sfin.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      sfEndEdit();
    }
  });
  setInterval(() => {
    if (sfEdit) {
      sfBlink = !sfBlink;
      sfRefresh();
    }
  }, T("cursor-blink"));
  function sfAnimate(from, to, ms, ease, done) {
    cancelAnimationFrame(sfAnim);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      sfFrame(from + (to - from) * ease(k));
      if (k < 1) sfAnim = requestAnimationFrame(step);
      else if (done) done();
    };
    sfAnim = requestAnimationFrame(step);
  }
  function sfShow() {
    if (sfOpen || !fReady) return;
    sfOpen = true;
    showBtip(null);
    sfDraft = JSON.parse(JSON.stringify(SFS[PK ? "p" : "s"]));
    sfd.classList.remove("closing");
    sfd.classList.add("on");
    $("wld").classList.add("sfo");
    sfb.classList.remove("on");
    sfBuild();
    sfFrame(4);
    sfAnimate(
      4,
      SFL.height,
      T("popup-open"),
      (k) => 1 - Math.pow(1 - k, 3),
      () => {
        sfb.classList.add("on");
        updSf();
      },
    );
  }
  function sfClose() {
    if (!sfOpen) return;
    sfEndEdit();
    sfOpen = false;
    showBtip(null);
    sfb.classList.remove("on");
    sfd.classList.add("closing");
    sfAnimate(
      SFL.height,
      4,
      T("popup-close"),
      (k) => k * k * k,
      () => {
        sfd.classList.remove("on", "closing");
        $("wld").classList.remove("sfo");
      },
    );
  }
  function sfApply() {
    SFS[PK ? "p" : "s"] = JSON.parse(JSON.stringify(sfDraft));
    updWorldBtns();
    sfClose();
    buildWorld();
  }
  function sfSearchCreator(name) {
    SFS.s = Object.assign(sfDefault(), { creator: name });
    pendingPK = false;
    updWorldBtns();
  }
  function sfCancel() {
    sfClose();
  }
  sfc.style.left = sfb.style.left = SFL.left + "px";
  sfb.style.top = SFL.top + "px";
  sfb.style.width = SFL.width + "px";
  sfb.style.height = SFL.height + "px";
  const sfw = $("sfw");
  sfw.style.left = SFL.left + "px";
  sfw.style.top = SFL.top + "px";
  sfw.style.width = SFL.width + "px";
  sfw.style.height = SFL.height + "px";
  sfs.style.top = SFL.listTop + "px";
  sfs.style.bottom = SFL.listBottom + "px";
  $("sfsb").style.left = SFL.barLeft + "px";
  $("sfsb").style.top = SFL.top + "px";
  $("sfsb").style.height = SFL.height + "px";
  $("sfcan").addEventListener("click", sfCancel);
  $("sfrst").addEventListener("click", () => {
    sfDraft = sfDefault();
    sfRefresh();
  });
  $("sfgo").addEventListener("click", sfApply);
  $("wsrch").addEventListener("click", sfShow);
  // ---- sort popup ("Choose sort option" from the game, without title; Back is a round button below)
  const SOL = {
    left: 102, // popup position and width as in the game (the height fits the options)
    width: 218,
    padTop: 8, // space above the first option
    padX: 16, // left edge of the options (the mushroom sits 12px left)
    line: 16, // row height
  };
  const sod = $("sod"),
    soc = $("soc"),
    sob = $("sob");
  const SOX = { items: [], refresh: () => SOX.items.forEach((it) => it.upd()) };
  let soOpen = false,
    soAnim = 0,
    soH = 0,
    soTop = 0;
  function soBuild() {
    sob.textContent = "";
    SOX.items = [];
    sorts().forEach(([label], k) => {
      const d = sfItem(
        sob,
        SOL.padX,
        SOL.padTop + k * SOL.line,
        (b) => sfText(b, label),
        () => {
          setSort(k);
          soClose();
        },
        null,
        SOX,
      );
      d.classList.toggle("cur", k === wSort); // current option: dim mushroom
    });
    soH = SOL.padTop * 2 + sorts().length * SOL.line;
    soTop = Math.round(9 + (205 - soH) / 2);
    sob.style.left = soc.style.left = SOL.left + "px";
    sob.style.top = soTop + "px";
    sob.style.width = SOL.width + "px";
    sob.style.height = soH + "px";
  }
  function soAnimate(from, to, ms, ease, done) {
    cancelAnimationFrame(soAnim);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      drawFrame(soc, SOL.width, from + (to - from) * ease(k), soTop, soH);
      if (k < 1) soAnim = requestAnimationFrame(step);
      else if (done) done();
    };
    soAnim = requestAnimationFrame(step);
  }
  function soShow() {
    if (soOpen || sfOpen || !fReady) return;
    soOpen = true;
    showBtip(null);
    soBuild();
    sod.classList.remove("closing");
    sod.classList.add("on");
    sob.classList.remove("on");
    drawFrame(soc, SOL.width, 4, soTop, soH);
    soAnimate(
      4,
      soH,
      T("popup-open"),
      (k) => 1 - Math.pow(1 - k, 3),
      () => sob.classList.add("on"),
    );
  }
  function soClose() {
    if (!soOpen) return;
    soOpen = false;
    showBtip(null);
    sob.classList.remove("on");
    sod.classList.add("closing");
    soAnimate(
      soH,
      4,
      T("popup-close"),
      (k) => k * k * k,
      () => sod.classList.remove("on", "closing"),
    );
  }
  $("wst").addEventListener("click", soShow);
  $("socan").addEventListener("click", soClose);
  addEventListener("keydown", (e) => {
    if (soOpen && e.key === "Escape") soClose();
  });
  addEventListener("keydown", (e) => {
    if (sfOpen && e.key === "Escape" && !sfEdit) sfCancel();
  });
  // ---- stage page (opened instantly from a Stage World row)
  const C = String.fromCharCode;
  function stStats(w) {
    return rowStats(w);
  }
  function zoneText(el) {
    const w = (el.dataset.pk ? PROWS : WROWS)[+el.dataset.w],
      k = el.dataset.tip,
      L = (a) => a.map((u) => u.name).join("\n");
    if (k === "dl") return w.dlers.length ? L(w.dlers) : "Nobody has downloaded it yet.";
    if (k === "lk") {
      const a = w.liked ? [U[0], ...w.likers] : w.likers;
      return a.length ? L(a) : "No likes yet.";
    }
    if (k === "rt")
      return w.raters.length
        ? w.raters.map((u, j) => u.name + ": " + w.scores[j]).join("\n")
        : "Not rated yet.";
    return crText(w);
  }
  function crText(w) {
    return "W" + w.win + "/L" + w.lose + (w.clr.length ? "\n" + w.clr.map((u) => u.name).join("\n") : "");
  }
  // stat pieces: downloads, clear rate (stages only), likes, rating
  function statSegs(w) {
    const lk = C(18) + (w.likes + (w.liked ? 1 : 0));
    return w.pack
      ? [
          [C(19) + w.dl, "dl"],
          [lk, "lk"],
          [C(21) + w.rate, "rt"],
        ]
      : [
          [C(19) + w.dl, "dl"],
          [C(17) + w.pct + "%", "cr"],
          [lk, "lk"],
          [C(21) + w.rate, "rt"],
        ];
  }
  function statsInto(el, w, sh, zones) {
    tx(el, rowStats(w), "n", "#fff", sh);
    if (!zones) return;
    const run = () => {
      const seg = statSegs(w).map((x) => x[0]),
        kind = statSegs(w).map((x) => x[1]);
      let pre = !w.pack && w.cleared ? C(16) + " " : "";
      seg.forEach((sg, k) => {
        const d = document.createElement("div");
        d.className = "crh";
        d.dataset.tip = kind[k];
        d.dataset.w = w.i;
        if (w.pack) d.dataset.pk = "1";
        d.style.left = (pre ? tw(pre, "n") + 1 : 0) + "px";
        d.style.width = tw(sg, "n") + "px";
        el.appendChild(d);
        pre += sg + " ";
      });
    };
    if (fReady) run();
    else FQ.push(run);
  }
  function rowStats(w) {
    return (
      (!w.pack && w.cleared ? C(16) + " " : "") +
      statSegs(w)
        .map((x) => x[0])
        .join(" ")
    );
  }
  function lockBtns(w) {
    ["splike", "spcom", "pzlike", "pzcom"].forEach((id) => ($(id).disabled = !w.cleared));
    if (!w.cleared) showBtip(btEl && btEl.disabled ? null : btEl);
  }
  // shown in place of comments when a stage has none
  const NO_CM = [
    "<Someone just downloaded the level and didn't comment on it>",
    "<There are only lonely plants that cannot speak>",
    "<Creator is frustrated because no one has commented on this level>",
    '<It would have been nice if someone had said "Nice">',
  ];
  function renderCm(w) {
    const box = $("cml2");
    box.innerHTML = "";
    if (!w.cm.length) {
      const e = document.createElement("div");
      e.className = "cmr";
      const note = NO_CM[w.i % NO_CM.length];
      tx(e, w.pack ? note.replace("level", "stage pack") : note, "n", "#a0a0a0", null, 1, 370);
      box.appendChild(e);
    }
    w.cm.forEach((c) => {
      const r = document.createElement("div");
      r.className = "cmr";
      const cv = document.createElement("canvas");
      cv.width = cv.height = 16;
      cv.getContext("2d").drawImage(c.u.canvas, 0, 0);
      const t = document.createElement("div");
      t.className = "ct";
      r.append(cv, t);
      const nm = c.unk ? "(Unknown User)" : c.u.name;
      tx(t, nm + ": " + c.t, "n", c.unk ? "#888" : "#fff", null, 1, 340);
      if (!c.unk) {
        const z = document.createElement("div");
        z.className = "nz";
        z.dataset.tip = "Open player card";
        z.setAttribute("data-tipup", "");
        const m = document.createElement("span");
        m.className = "m";
        r.append(z, m);
        const sw = () => {
          z.style.width = 24 + tw(nm, "n") + "px";
        };
        if (fReady) sw();
        else FQ.push(sw);
        z.addEventListener("click", () => go("gal", () => showCard(c.u.i)));
      }
      box.appendChild(r);
    });
    box.scrollTop = 0;
    setTimeout(updCm, 0);
  }
  function fillStage(w) {
    $("stp").classList.toggle("mine", w.u.me);
    lockBtns(w);
    tx($("spttl"), w.title, "n", "#fff");
    const by = $("spby");
    tx(q(by, "a"), "by", "n", "#a0a0a0");
    tx(q(by, "b"), w.u.name, "n", "#c0c0c0");
    const g = q(by, "sav").getContext("2d");
    g.clearRect(0, 0, 16, 16);
    g.drawImage(w.u.canvas, 0, 0);
    tx($("spver"), "Version 1", "n", w.pack ? "#fff" : "#a0a0a0");
    if (w.pack) tx($("splv"), w.levels + (w.levels === 1 ? " level" : " levels"), "n", "#fff");
    $("spplay").dataset.tip = w.pack ? (w.status ? "Continue" : "Start") : "Play";
    $("stp").classList.toggle("pstarted", !!(w.pack && w.status));
    tx(q($("spdesc"), "t"), w.desc, "n", "#fff", null, 1, 267);
    const tg = $("sptags");
    tg.innerHTML = "";
    textTags(w.tags).forEach((t) => {
      const d = document.createElement("div");
      tx(d, C(127) + t, "n", "#e0e0e0", null, 1, 421 - 304 - 8); // wraps at the screen edge
      tg.appendChild(d);
    });
    const e = document.createElement("div");
    e.className = "tge";
    tx(e, C(129) + "Edit tags", "n", "#a0a0a0");
    e.addEventListener("click", () => tgShow(w));
    if (!w.pack) tg.appendChild(e); // packs have no Edit tags
    renderCm(w);
    const smb = '<span class="thw"><span class="thm"></span><span class="mh"></span></span>';
    if (w.pack) {
      $("spbd").innerHTML = '<span class="pstat"></span>' + smb;
      if (w.status) tx(q($("spbd"), "pstat"), w.status, "n", "#a0a0a0", "rgba(0,0,0,.55)");
    } else
      $("spbd").innerHTML =
        '<span class="tics">' + tagIcons(w) + '</span><span class="bdg d' + w.d + '"></span>' + smb;
    statsInto($("spst"), w, "rgba(0,0,0,.55)", true);
    $("splike").classList.toggle("on", w.liked);
  }
  function openStage(w) {
    selW = w;
    (w.pack ? PROWS : WROWS).forEach((x) => x.el && x.el.classList.toggle("sel", x === w));
    fillStage(w);
    showBtip(null);
    stage.classList.remove("w");
    stage.classList.add("p");
    hovRow = null;
    placeHov();
    syncHash();
  }
  $("spb").addEventListener("click", () => {
    if (cmOn) {
      exitComment(false);
      return;
    }
    leaveStagePage();
  });
  // stage / pack details -> back to the list, instantly
  function leaveStagePage() {
    showBtip(null);
    stage.classList.remove("p");
    stage.classList.add("w");
    setTimeout(() => {
      updW();
      placeSel();
    }, 0);
    syncHash();
  }
  $("splike").addEventListener("click", () => {
    const w = selW;
    if (!w) return;
    w.liked = !w.liked;
    $("splike").classList.toggle("on", w.liked);
    statsInto($("spst"), w, "rgba(0,0,0,.55)", true);
    if (w.stEl) statsInto(w.stEl, w);
  });
  FQ.push(() => tx($("spch"), "Comments", "n", "#fff"));
  // ---- Edit tags popup (stage and pack details). Layout values in game pixels:
  const TGL = {
    left: 8, // popup position and size; the round Submit / Cancel buttons sit below it
    top: 9,
    width: 405,
    height: 205,
    cols: [16, 140, 263], // x of the three tag columns inside the popup
    rowTop: 14, // y of the first row inside the popup
    line: 16, // row height
  };
  const TG_LOCKED = TAG_LOCKED;
  const tgd = $("tgd"),
    tgc = $("tgc"),
    tgb = $("tgb");
  const TGX = { items: [], refresh: () => TGX.items.forEach((it) => it.upd()) };
  let tgDraft = null,
    tgOpen = false,
    tgW = null,
    tgAnim = 0;
  tgc.style.left = tgb.style.left = TGL.left + "px";
  tgb.style.top = TGL.top + "px";
  tgb.style.width = TGL.width + "px";
  tgb.style.height = TGL.height + "px";
  function tgBuild() {
    tgb.textContent = "";
    TGX.items = [];
    let slot = 0;
    STAGE_TAGS.forEach((t) => {
      let col = slot % 3;
      const x = TGL.cols[col],
        y = TGL.rowTop + Math.floor(slot / 3) * TGL.line,
        wdt = sfCheckW() + tw(t, "n");
      // a long tag takes the next column's place too (like "Exclude from challenge")
      let n = 1;
      while (col + n < 3 && x + wdt > TGL.cols[col + n] - 8) n++;
      slot += n;
      const lock = TG_LOCKED.includes(t),
        full = () => !TAG_HIDDEN.includes(t) && !tgDraft.includes(t) && visTags(tgDraft).length >= TAG_MAX;
      sfItem(
        tgb,
        x,
        y,
        (b) => sfCheck(b, tgDraft.includes(t), t, lock || full() ? "#707070" : "#fff"),
        lock
          ? null
          : () => {
              if (tgDraft.includes(t)) tgDraft.splice(tgDraft.indexOf(t), 1);
              else if (!full()) {
                tgDraft = tgDraft.filter((o) => !tagClash(o, t)); // switch off tags it cannot be used with
                tgDraft.push(t);
              }
            },
        null,
        TGX,
      );
    });
  }
  function tgFrame(h) {
    drawFrame(tgc, TGL.width, h, TGL.top, TGL.height);
  }
  function tgAnimate(from, to, ms, ease, done) {
    cancelAnimationFrame(tgAnim);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      tgFrame(from + (to - from) * ease(k));
      if (k < 1) tgAnim = requestAnimationFrame(step);
      else if (done) done();
    };
    tgAnim = requestAnimationFrame(step);
  }
  function tgShow(w) {
    if (tgOpen || !fReady) return;
    tgOpen = true;
    tgW = w;
    showBtip(null);
    tgDraft = [...w.tags];
    tgd.classList.remove("closing");
    tgd.classList.add("on");
    tgb.classList.remove("on");
    tgBuild();
    tgFrame(4);
    tgAnimate(
      4,
      TGL.height,
      T("popup-open"),
      (k) => 1 - Math.pow(1 - k, 3),
      () => tgb.classList.add("on"),
    );
  }
  function tgClose() {
    if (!tgOpen) return;
    tgOpen = false;
    showBtip(null);
    tgb.classList.remove("on");
    tgd.classList.add("closing");
    tgAnimate(
      TGL.height,
      4,
      T("popup-close"),
      (k) => k * k * k,
      () => tgd.classList.remove("on", "closing"),
    );
  }
  $("tgcan").addEventListener("click", tgClose);
  $("tgok").addEventListener("click", () => {
    const w = tgW;
    w.tags = STAGE_TAGS.filter((t) => tgDraft.includes(t));
    tgClose();
    fillStage(w);
    refreshRow(w);
  });
  addEventListener("keydown", (e) => {
    if (tgOpen && e.key === "Escape") tgClose();
  });

  const updCm0 = bar($("cml2"), $("cmth"), 113);
  function updCm() {
    updCm0();
    const v = $("cml2");
    $("cmsb").style.visibility = v.scrollHeight > v.clientHeight + 1 ? "visible" : "hidden";
  }
  q($("spby"), "nz").addEventListener("click", () => {
    if (selW) go("gal", () => showCard(selW.u.i));
  });
  // ---- pause menu: Play closes a circle on the screen centre, then fades in; Back reverses it
  function fillPause(w) {
    lockBtns(w);
    tx($("pzttl"), w.title, "n", "#fff", "rgba(0,0,0,.55)", 2);
    tx($("pzby"), "by " + w.u.name, "n", "#fff", "rgba(0,0,0,.55)");
    $("pzcards").innerHTML = w.cards
      .map((c) => '<span class="acard" style="background-position:' + -c * 34 + 'px 0"></span>')
      .join("");
    $("pzlike").classList.toggle("on", w.liked);
  }
  function irisClose(after) {
    showBtip(null);
    irisR(RMAX);
    iris.style.display = "block";
    anim(
      T("iris"),
      (p) => irisR(RMAX * Math.pow(1 - p, 3)),
      () => {
        const f = $("fade");
        f.style.transition = "none";
        f.style.opacity = 1;
        void f.offsetWidth;
        f.style.transition = "";
        stage.classList.add("inst");
        after();
        void stage.offsetWidth;
        requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("inst")));
        iris.style.display = "none";
        syncHash();
        f.style.transitionTimingFunction = "var(--ei)";
        f.style.opacity = 0;
        setTimeout(() => {
          busy = false;
        }, T("screen-fade"));
      },
    );
  }
  function irisOpen(after) {
    showBtip(null);
    const f = $("fade");
    f.style.transitionTimingFunction = "var(--eo)";
    f.style.opacity = 1;
    setTimeout(() => {
      after();
      irisR(0);
      iris.style.display = "block";
      f.style.transition = "none";
      f.style.opacity = 0;
      void f.offsetWidth;
      f.style.transition = "";
      syncHash();
      anim(
        T("iris"),
        (p) => irisR(RMAX * p * p * p),
        () => {
          iris.style.display = "none";
          busy = false;
        },
      );
    }, T("screen-fade"));
  }
  // the stage being played: the selected stage, or the next stage of the selected stage pack
  let playW = null;
  // Continue picks up where the pack was left off (a completed pack stays on its last stage)
  function packNext(p) {
    return p.stages[Math.min(p.done, p.levels - 1)];
  }
  // New game: progress back to stage 1. Stages beaten before, and the pack itself, can still be liked / commented on
  $("sprst").addEventListener("click", () => {
    const p = selW;
    if (busy || !p || !p.pack) return;
    p.done = 0;
    p.status = ""; // back to not started until the first stage is beaten again
    // p.cleared stays as it was: like / comment only unlock once a stage of the pack has been beaten
    refreshRow(p);
    fillStage(p);
    busy = true;
    setIC([W / 2, 131.5]);
    playW = p.stages[0];
    fillPause(playW);
    irisClose(() => {
      stage.classList.remove("p");
      stage.classList.add("z");
    });
  });
  $("spplay").addEventListener("click", () => {
    if (busy || !selW) return;
    busy = true;
    setIC([W / 2, 131.5]);
    playW = selW.pack ? packNext(selW) : selW;
    fillPause(playW);
    irisClose(() => {
      stage.classList.remove("p");
      stage.classList.add("z");
    });
  });
  $("pzb").addEventListener("click", () => {
    if (cmOn) {
      exitComment(false);
      return;
    }
    leavePlay();
  });
  // pause / clear screen -> back to the stage (or pack) details with the circle opening
  function leavePlay() {
    if (busy) return;
    stopCycle();
    busy = true;
    setIC([W / 2, 131.5]);
    irisOpen(() => {
      fillStage(selW);
      stage.classList.remove("z", "c");
      stage.classList.add("p");
    });
  }
  $("pzlike").addEventListener("click", () => {
    const w = playW;
    if (!w) return;
    w.liked = !w.liked;
    $("pzlike").classList.toggle("on", w.liked);
    if (w.inPack) return; // a stage inside a pack has its own likes, separate from the pack
    $("splike").classList.toggle("on", w.liked);
    statsInto($("spst"), w, "rgba(0,0,0,.55)", true);
    if (w.stEl) statsInto(w.stEl, w);
  });
  // touch: tapping a mushroom item shows its hover state until the next tap elsewhere
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType !== "mouse") {
        document.querySelectorAll(".thov").forEach((x) => x.classList.remove("thov"));
        const it = e.target.closest && e.target.closest(".lpr,.nz,.ec");
        if (it) it.classList.add("thov");
      }
    },
    true,
  );
  document.addEventListener("touchstart", () => {}, { passive: true });
  // ---- stage clear menu (instant): top-3 fastest clearers
  function fmtT(t) {
    return t.toFixed(3) + "s";
  }
  function clearStage(w) {
    const cur = 15 + Math.random() * 45;
    w.cur = cur;
    if (!w.cleared) {
      w.cleared = true;
      w.win++;
      w.pct = Math.round((w.win / (w.win + w.lose)) * 100);
    } else {
      w.win++;
      w.pct = Math.round((w.win / (w.win + w.lose)) * 100);
    }
    if (w.myBest == null || cur < w.myBest) w.myBest = cur;
    if (!w.clr.includes(U[0])) {
      w.clr.push(U[0]);
      w.times.push(w.myBest);
    } else w.times[w.clr.indexOf(U[0])] = w.myBest;
    const pairs = w.clr.map((u, k) => ({ u, t: w.times[k] })).sort((a, b) => a.t - b.t);
    w.clr = pairs.map((p) => p.u);
    w.times = pairs.map((p) => p.t);
    lockBtns(w);
    if (w.stEl) statsInto(w.stEl, w);
    statsInto($("spst"), w, "rgba(0,0,0,.55)", true);
  }
  function ordn(n) {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function fillClear(w) {
    if (cmOn) {
      cmOn = false;
      stage.classList.remove("cm");
    }
    tx($("clttl"), w.title, "n", "#fff", "rgba(0,0,0,.55)", 2);
    tx($("clby"), "by " + w.u.name, "n", "#fff", "rgba(0,0,0,.55)");
    const lb = $("cllb");
    lb.innerHTML = "";
    // top 3 + my best (white) + this run (yellow, tooltip), in time order
    const rows = w.clr
      .map((u, k) => ({ u, t: w.times[k], rank: k + 1 }))
      .filter((r) => r.rank <= 3 || r.u.me);
    if (w.cur != null && !(w.myBest === w.cur && rows.some((r) => r.u.me))) {
      rows.push({ u: U[0], t: w.cur, rank: w.times.filter((t) => t < w.cur).length + 1, cur: true });
    } else {
      const me = rows.find((r) => r.u.me);
      if (me && w.cur === w.myBest) me.cur = true;
    }
    rows
      .sort((a, b) => a.t - b.t || (a.cur ? 1 : -1))
      .forEach((e, k) => {
        const r = document.createElement("div");
        r.className = "lbr";
        r.style.top = 49 + 12 * k + "px";
        r.innerHTML = '<div class="o"></div><div class="nm2"></div><div class="tm"></div>';
        const col = e.cur ? "#ffd23f" : "#fff",
          SHD = "rgba(0,0,0,.55)";
        tx(q(r, "o"), ordn(e.rank), "n", col, SHD);
        tx(q(r, "nm2"), e.u.name, "n", col, SHD);
        tx(q(r, "tm"), fmtT(e.t), "n", col, SHD);
        if (e.cur) r.dataset.tip = "Current time";
        lb.appendChild(r);
      });
    startCycle(w);
    $("cllike").classList.toggle("on", w.liked);
    // in a stage pack: "Next stage" while there is one
    $("clrm").classList.toggle("nx", !!(w.inPack && w.k < w.inPack.levels - 1));
  }
  $("pzcont").addEventListener("click", () => {
    if (busy || !playW) return;
    showBtip(null);
    clearStage(playW);
    const p = playW.inPack;
    if (p) {
      // clearing a stage of a pack moves the pack on
      p.done = Math.max(p.done, playW.k + 1);
      p.status = p.done >= p.levels ? "Completed" : "In progress";
      p.cleared = true;
      refreshRow(p);
    }
    fillClear(playW);
    stage.classList.remove("z");
    stage.classList.add("c");
    syncHash();
  });
  $("clb").addEventListener("click", () => {
    if (cmOn) {
      exitComment(false);
      return;
    }
    if (busy || !selW) return;
    leavePlay();
  });
  $("clre").addEventListener("click", () => {
    if (busy || !playW) return;
    stopCycle();
    showBtip(null);
    fillPause(playW);
    stage.classList.remove("c");
    stage.classList.add("z");
    syncHash();
  });
  // Stage pack: "Next stage" goes straight to the pause menu of the following stage
  $("clnext").addEventListener("click", () => {
    if (busy || !playW || !playW.inPack) return;
    const p = playW.inPack;
    stopCycle();
    showBtip(null);
    playW = p.stages[Math.min(playW.k + 1, p.levels - 1)];
    fillPause(playW);
    stage.classList.remove("c");
    stage.classList.add("z");
    syncHash();
  });
  $("cllike").addEventListener("click", () => {
    const w = playW;
    if (!w) return;
    w.liked = !w.liked;
    ["cllike", "pzlike"]
      .concat(w.inPack ? [] : ["splike"])
      .forEach((id) => $(id).classList.toggle("on", w.liked));
    if (w.inPack) return;
    statsInto($("spst"), w, "rgba(0,0,0,.55)", true);
    if (w.stEl) statsInto(w.stEl, w);
  });
  // ---- clear screen: comments said by the blue-shirt guy, ratings held up by the yellow-shirt guy, cycling like the game
  let cyT = [];
  const BUBW = 150;
  function setBub(text) {
    const b = q($("cyb"), "bub"),
      run = () => {
        const lines = text ? wrapL(text, "n", BUBW) : [""];
        const c = bubble(lines, false, null, true);
        b.textContent = "";
        b.appendChild(c);
        b.style.left = 86 - c.tc0 + "px";
        b.style.top = 134 - c.bh + "px";
      };
    if (fReady) run();
    else FQ.push(run);
  }
  function startCycle(w) {
    cyT.forEach(clearInterval);
    cyT.forEach(clearTimeout);
    cyT = [];
    const cm = w.cm,
      rt = w.raters,
      bl = $("cyb"),
      yl = $("cyy");
    bl.style.display = cm.length ? "block" : "none";
    yl.style.display = rt.length ? "block" : "none";
    let ci = 0,
      ri = 0;
    {
      const g = q(bl, "gy");
      let n = 0;
      cyT.push(setInterval(() => g.classList.toggle("talk", n++ % 2 === 0), T("talk")));
    }
    const showC = () => {
      const c = cm[ci];
      setBub(c.t);
      bl.classList.remove("bump");
      void bl.offsetWidth;
      bl.classList.add("bump");
      tx(
        q(bl, "lab"),
        "(" + (ci + 1) + "/" + cm.length + ") " + (c.unk ? "(Unknown User)" : c.u.name),
        "n",
        "#fff",
        "rgba(0,0,0,.55)",
      );
      ci = (ci + 1) % cm.length;
    };
    const showR = () => {
      const sc = w.scores[ri];
      tx(q(yl, "dg"), String(sc), "n", "#000", null, 4);
      q(yl, "gy").classList.toggle("happy", sc >= 7);
      tx(q(yl, "lab"), rt[ri].name, "n", "#fff", "rgba(0,0,0,.55)");
      yl.classList.remove("bump");
      void yl.offsetWidth;
      yl.classList.add("bump");
      ri = (ri + 1) % rt.length;
    };
    if (cm.length) {
      showC();
      if (cm.length > 1) cyT.push(setInterval(showC, T("comment-cycle")));
    }
    if (rt.length) {
      showR();
      if (rt.length > 1) cyT.push(setInterval(showR, T("rating-cycle")));
    }
  }
  // ---- comment mode (Comment button on the clear screen)
  const EMO = [
    1, 2, 11, 12, 9, 13, 14, 15, 16, 17, 18, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31, 233, 234, 235, 236, 237,
    238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 131, 134, 135, 136, 137,
    140, 160, 161, 162, 163, 164, 165, 166, 167, 176, 180, 3, 5, 194, 195, 196, 197, 198, 199, 200, 201, 202,
    203, 204, 205, 206, 207,
  ];
  const cin = $("cin");
  let cmOn = false;
  (function () {
    const g = $("emg");
    EMO.forEach((code) => {
      const d = document.createElement("div");
      d.className = "ec";
      d.innerHTML = '<span class="m"></span>';
      const run = () => {
        d.appendChild(bt(String.fromCharCode(0xe000 + code), "n", "#fff"));
      };
      if (fReady) run();
      else FQ.push(run);
      let pd = false;
      d.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pd = true;
      });
      d.addEventListener("pointerleave", () => (pd = false));
      d.addEventListener("pointerup", (e) => {
        if (!pd) return;
        pd = false;
        e.preventDefault();
        const a = cin.selectionStart ?? cin.value.length,
          b = cin.selectionEnd ?? a;
        cin.value = cin.value.slice(0, a) + String.fromCharCode(0xe000 + code) + cin.value.slice(b);
        cin.setSelectionRange(a + 1, a + 1);
        if (wrapL(cin.value + "_", "n", BUBW).length > 8) cin.value = cPrev;
        cPrev = cin.value;
        cin.focus();
        setBub(bubTxt());
      });
      g.appendChild(d);
    });
  })();
  FQ.push(() => {
    tx(q($("emo"), "et"), "Emoji list", "n", "#fff", "rgba(0,0,0,.55)");
    tx($("cmtip"), "Comment and press enter to send.", "n", "#fff", "rgba(0,0,0,.55)");
  });
  function jumpC() {
    const bl = $("cyb");
    bl.classList.remove("bump");
    void bl.offsetWidth;
    bl.classList.add("bump");
  }
  function stopCycle() {
    cyT.forEach(clearInterval);
    cyT.forEach(clearTimeout);
    cyT = [];
  }
  function myCm(w) {
    return w.cm.find((c) => c.u === U[0] && !c.unk);
  }
  let cmT = null; // what is being commented on: a stage, a stage pack or a player (profile comments)
  function enterComment(target) {
    if (!target || cmOn) return;
    cmT = target;
    cmOn = true;
    clearTimeout(cmxT);
    stage.classList.remove("cmx");
    stage.classList.toggle("cmg", !!target.canvas); // player profile, from the user gallery card
    if (target.canvas) tx(q($("emo"), "et"), "Emoji list", "n", "#000", "rgba(0,0,0,.55)");
    else tx(q($("emo"), "et"), "Emoji list", "n", "#fff", "rgba(0,0,0,.55)");
    showBtip(null);
    stopCycle();
    const onClear = stage.classList.contains("c");
    const bl = $("cyb");
    bl.style.display = "block";
    bl.classList.remove("sink", "rise");
    {
      const g = q(bl, "gy");
      let n = 0;
      cyT.push(setInterval(() => g.classList.toggle("talk", n++ % 2 === 0), T("talk")));
    }
    const mine = myCm(target);
    cin.value = mine ? mine.t : "";
    cPrev = cin.value;
    setBub(cin.value);
    tx(q(bl, "lab"), "You", "n", "#fff", "rgba(0,0,0,.55)");
    jumpC();
    stage.classList.add("cm");
    setTimeout(() => {
      cin.focus();
      cin.setSelectionRange(cin.value.length, cin.value.length);
    }, 0);
  }
  let cmxT = 0;
  function exitComment(send) {
    if (!cmOn) return;
    cmOn = false;
    const w = cmT;
    cin.blur();
    showBtip(null);
    if (send) {
      const t = cin.value.trim(),
        mine = myCm(w);
      if (mine) {
        if (t) mine.t = t;
        else w.cm.splice(w.cm.indexOf(mine), 1);
      } else if (t) w.cm.unshift({ u: U[0], unk: false, t });
      if (mine && t) {
        w.cm.splice(w.cm.indexOf(mine), 1);
        w.cm.unshift(mine);
      }
    }
    if (stage.classList.contains("c")) {
      stage.classList.remove("cm");
      startCycle(w);
      return;
    }
    stopCycle();
    const bl = $("cyb");
    bl.style.display = "none";
    stage.classList.remove("cm");
    // keep the comment layer shown while the emoji list fades out (crossfading with the comments)
    stage.classList.add("cmx");
    clearTimeout(cmxT);
    cmxT = setTimeout(() => stage.classList.remove("cmx", "cmg"), T("ui-fade"));
    if (stage.classList.contains("p")) renderCm(w);
    if (stage.classList.contains("cmg")) {
      w.com = w.cm.length;
      renderProfCm(card, w);
    }
  }
  ["clcom", "pzcom"].forEach((id) => $(id).addEventListener("click", () => enterComment(playW)));
  $("spcom").addEventListener("click", () => enterComment(selW));
  $("chat").addEventListener("click", () => {
    if (open && U[sel] && !U[sel].me) enterComment(U[sel]);
  });
  q($("cyb"), "sel").addEventListener("click", () => cin.focus());
  let cPrev = "",
    cBlink = true;
  const bubTxt = () => cin.value + (document.activeElement === cin && cBlink ? "_" : "\uE1FF");
  cin.addEventListener("input", () => {
    const okc = (c) => {
      const k = c.charCodeAt(0);
      return (k >= 32 && k <= 126) || (k >= 0xe000 && k < 0xe100);
    };
    if (![...cin.value].every(okc)) {
      const pos = cin.selectionStart,
        bad = [...cin.value.slice(0, pos)].filter((c) => !okc(c)).length;
      cin.value = [...cin.value].filter(okc).join("");
      cin.setSelectionRange(pos - bad, pos - bad);
    }
    if (wrapL(cin.value + "_", "n", BUBW).length > 8) {
      cin.value = cPrev;
    }
    cPrev = cin.value;
    setBub(bubTxt());
  });
  setInterval(() => {
    cBlink = !cBlink;
    if (cmOn) setBub(bubTxt());
  }, T("cursor-blink"));
  cin.addEventListener("focus", () => {
    cBlink = true;
    setBub(bubTxt());
  });
  cin.addEventListener("blur", () => setBub(bubTxt()));
  cin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      exitComment(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      exitComment(false);
    }
  });
  // iris transition: the screen closes in a circle onto the Stage World button, then fades in the new menu (reverse on Back)
  const iris = $("iris");
  let IC = [209.5, 174],
    RMAX = 0;
  function setIC(c) {
    IC = c;
    RMAX =
      Math.max(
        ...[
          [0, 0],
          [W, 0],
          [0, 253],
          [W, 253],
        ].map(([x, y]) => Math.hypot(x - IC[0], y - IC[1])),
      ) + 2;
  }
  setIC(IC);
  function irisR(r) {
    const m = `radial-gradient(circle at ${IC[0]}px ${IC[1]}px, transparent ${r}px, #000 ${r + 0.5}px)`;
    iris.style.webkitMaskImage = m;
    iris.style.maskImage = m;
  }
  function anim(d, fn, done) {
    const t0 = performance.now();
    const st = (n) => {
      const p = Math.min(1, Math.max(0, (n - t0) / d));
      fn(p);
      if (p < 1) requestAnimationFrame(st);
      else if (done) done();
    };
    requestAnimationFrame(st);
  }
  function goWorld(pk) {
    setIC(pk ? [99, 174] : [209.5, 174]);
    if (busy) return;
    busy = true;
    showBtip(null);
    irisR(RMAX);
    iris.style.display = "block";
    anim(
      T("iris"),
      (p) => irisR(RMAX * Math.pow(1 - p, 3)),
      () => {
        const f = $("fade");
        f.style.transition = "none";
        f.style.opacity = 1;
        void f.offsetWidth;
        f.style.transition = "";
        stage.classList.add("inst");
        stage.classList.remove("h", "s", "y");
        stage.classList.add("w");
        setPK(pk);
        resetMenu("wld");
        void stage.offsetWidth;
        requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove("inst")));
        iris.style.display = "none";
        syncHash();
        f.style.transitionTimingFunction = "var(--ei)";
        f.style.opacity = 0;
        setTimeout(() => {
          busy = false;
        }, T("screen-fade"));
      },
    );
  }
  function backWorld() {
    setIC(PK ? [99, 174] : [209.5, 174]);
    if (busy) return;
    busy = true;
    showBtip(null);
    const f = $("fade");
    f.style.transitionTimingFunction = "var(--eo)";
    f.style.opacity = 1;
    setTimeout(() => {
      stage.classList.remove("w");
      stage.classList.add("h");
      irisR(0);
      iris.style.display = "block";
      f.style.transition = "none";
      f.style.opacity = 0;
      void f.offsetWidth;
      f.style.transition = "";
      syncHash();
      anim(
        T("iris"),
        (p) => irisR(RMAX * p * p * p),
        () => {
          iris.style.display = "none";
          busy = false;
        },
      );
    }, T("screen-fade"));
  }
  $("hworld").addEventListener("click", () => goWorld(false));
  $("hpack").addEventListener("click", () => goWorld(true));
  $("wb").addEventListener("click", backWorld);
  // ---- URL hash routing: #main  #users  #users-list  #profile-<id>  #list-<id>  #stages  #stage-packs
  const slugOf = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  U.forEach((u) => (u.slug = slugOf(u.name)));
  let applying = false;
  function viewName() {
    if (stage.classList.contains("h")) return "main";
    if (stage.classList.contains("y")) return "your-profile";
    if (stage.classList.contains("w")) return PK ? "stage-pack-world" : "stage-world";
    if (stage.classList.contains("p")) return (PK ? "pack-" : "world-stage-") + (selW ? selW.i : 0);
    if (PK && (stage.classList.contains("z") || stage.classList.contains("c")))
      return "pack-" + (selW ? selW.i : 0) + (stage.classList.contains("z") ? "-play" : "-clear");
    if (stage.classList.contains("z")) return "play-stage-" + (selW ? selW.i : 0);
    if (stage.classList.contains("c")) return "clear-stage-" + (selW ? selW.i : 0);
    if (stage.classList.contains("s")) return $("t2").classList.contains("on") ? "stage-packs" : "stages";
    if (mode === "l") return "list-" + U[sel].slug;
    return open ? "profile-" + U[sel].slug : "users";
  }
  function syncHash() {
    const v = viewName();
    if (location.hash.slice(1) !== v) {
      applying = true;
      location.hash = v;
    }
  }
  function applyView(v, instant) {
    let m,
      target = "home",
      st = 0,
      listOn = false,
      idx = -1,
      prof = false;
    let wantPK = false;
    if (v === "your-profile") target = "yp";
    else if (v === "stage-world") target = "wld";
    else if (v === "stage-pack-world") {
      target = "wld";
      wantPK = true;
    } else if ((m = /^world-stage-(\d+)$/.exec(v)) && WROWS[+m[1]]) {
      target = "stp";
      idx = +m[1];
    } else if ((m = /^pack-(\d+)-(play|clear)$/.exec(v)) && PROWS[+m[1]]) {
      target = m[2] === "play" ? "pz" : "clr";
      idx = +m[1];
      wantPK = true;
    } else if ((m = /^pack-(\d+)$/.exec(v)) && PROWS[+m[1]]) {
      target = "stp";
      idx = +m[1];
      wantPK = true;
    } else if ((m = /^play-stage-(\d+)$/.exec(v)) && WROWS[+m[1]]) {
      target = "pz";
      idx = +m[1];
    } else if ((m = /^clear-stage-(\d+)$/.exec(v)) && WROWS[+m[1]]) {
      target = "clr";
      idx = +m[1];
    } else if (v === "stages" || v === "stage-packs") {
      target = "st";
      st = v === "stage-packs" ? 1 : 0;
    } else if (v === "users" || v === "users-list" || (m = /^(profile|list)-(.+)$/.exec(v))) {
      target = "gal";
      if (v === "users-list") listOn = true;
      if (m) {
        idx = U.findIndex((u) => u.slug === m[2]);
        if (idx >= 0) {
          listOn = m[1] === "list";
          prof = m[1] === "profile";
        }
      }
    }
    const fin = () => {
      if (target === "clr" || target === "pz") {
        const L = PK ? PROWS : WROWS;
        selW = L[idx];
        L.forEach((x) => x.el && x.el.classList.toggle("sel", x === selW));
        if (!playW || (PK ? playW.inPack !== selW : playW !== selW)) playW = PK ? packNext(selW) : selW;
        if (target === "clr") fillClear(playW);
        else fillPause(playW);
      }
      if (target === "stp") {
        const L = PK ? PROWS : WROWS;
        selW = L[idx];
        L.forEach((x) => x.el && x.el.classList.toggle("sel", x === selW));
        fillStage(selW);
      }
      if (target === "st") {
        $("t1").classList.toggle("on", !st);
        $("t2").classList.toggle("on", !!st);
        fillStages(st);
      }
      if (target === "gal") {
        if (idx >= 0) sel = idx;
        if (listOn !== (mode === "l")) {
          quiet = true;
          $("whistle").click();
          quiet = false;
        }
        if (listOn && instant)
          U.forEach((u) => {
            u.p = 1;
            u.wait = 0;
          });
        if (!listOn) {
          if (prof) showCard(idx);
          else if (open) closeCard();
        }
      }
      syncHash();
    };
    if (target === "wld" || target === "stp" || target === "pz" || target === "clr") {
      if (instant || cur() === target) {
        const ch = wantPK !== PK;
        setPK(wantPK);
        if (ch && target === "wld" && !instant) resetWorld();
      } else pendingPK = wantPK;
    }
    if (instant) {
      stage.classList.add("inst");
      stage.classList.toggle("h", target === "home");
      stage.classList.toggle("s", target === "st");
      stage.classList.toggle("y", target === "yp");
      stage.classList.toggle("w", target === "wld");
      stage.classList.toggle("p", target === "stp");
      stage.classList.toggle("z", target === "pz");
      stage.classList.toggle("c", target === "clr");
      fin();
      setTimeout(() => stage.classList.remove("inst"), 150);
    } else if (cur() === target) fin();
    else go(target, fin);
  }
  // tabs (player cards, Local play): mushroom left of the hovered tab's title, drawn over everything
  {
    const tm = $("tmush");
    let tabEl = null;
    const place = () => {
      if (!tabEl || !tabEl.offsetParent) return (tm.style.display = "none");
      const vr = vw.getBoundingClientRect(),
        k = vr.width / W,
        r = tabEl.getBoundingClientRect(),
        pt = parseFloat(getComputedStyle(tabEl).paddingTop) || 0;
      tm.style.left = Math.round((r.left - vr.left) / k + 8 - 10) + "px";
      tm.style.top = Math.round((r.top - vr.top) / k + pt - 1) + "px";
      tm.style.display = "block";
    };
    document.addEventListener("pointerover", (e) => {
      const t = e.pointerType === "mouse" && e.target.closest ? e.target.closest(".ctab, .tb") : null;
      if (t !== tabEl) {
        tabEl = t;
        place();
      }
    });
    document.addEventListener("click", () => setTimeout(place, 0));
  }
  addEventListener("hashchange", () => {
    if (applying) {
      applying = false;
      return;
    }
    if (cmOn) exitComment(false);
    if (sfOpen) sfClose();
    if (tgOpen) tgClose();
    if (soOpen) soClose();
    applyView(location.hash.slice(1), false);
  });
  $("whistle").addEventListener("click", () => setTimeout(syncHash, 0));
  [$("t1"), $("t2")].forEach((b) => b.addEventListener("click", () => setTimeout(syncHash, 0)));
  applyView(location.hash.slice(1), true);
  requestAnimationFrame(frame);
})();
