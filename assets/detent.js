/* Detent site: the live phones, the step-by-step scrolling and the feature demos. */
(function () {
  const PAGE = document.body.dataset.page;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (el, s) => (s === undefined ? document.querySelector(el) : el.querySelector(s));
  const $$ = (el, s) => [...(s === undefined ? document.querySelectorAll(el) : el.querySelectorAll(s))];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const cascade = (p, i) => clamp((p - i * 0.1) / 0.7);
  const pad = n => String(n).padStart(2, "0");
  const P = {
    install: '<path d="M12 4v10M8 10l4 4 4-4M5 19h14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    wave: '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    open: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.7"/>',
    glass: '<path d="M7 3h10M7 21h10"/><path d="M8 3c0 4 8 5 8 9s-8 5-8 9"/><path d="M16 3c0 4-8 5-8 9s8 5 8 9"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>', dblR: '<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>', dblL: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>'
  };
  const icon = (s, body, cls = "") => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${body}</svg>`;
  const row = (ic, label, value, kind = "", tag = "div") => `<${tag} class="ms-row ${kind}"${tag === "button" ? ' type="button" data-keep' : ""}>${icon(18, P[ic], "i")}<span class="l">${label}</span><span class="v">${value}</span>${icon(14, P.chevR, "c")}</${tag}>`;
  const LOCKS = [["install", "App Store"], ["globe", "Adult sites"], ["clock", "Clock"], ["apps", "Social apps"]];
  const SLIPS = [5, 12, 20];

  /* ---------- a live main screen ---------- */
  function mountDevice(wrap, hint, opts = {}) {
    wrap.appendChild($("#dev-tpl").content.firstElementChild.cloneNode(true));
    const ms = $(wrap, ".ms"), q = s => $(ms, s);
    const sw = q(".ms-switch"), fill = q(".ms-fill"), lab = q(".ms-lab"), knob = q(".ms-knob");
    q("[data-bolts]").innerHTML = LOCKS.map(([ic, n]) => `<div class="ob-bolt"><span class="nm">${icon(18, P[ic])}<span>${n}</span></span><span class="rail"><i class="bar"></i><b class="catch"></b></span></div>`).join("");
    q("[data-hours]").innerHTML = Array.from({ length: 24 }, (_, k) => `<i style="--k:${k}"></i>`).join("");
    const rows = $$(ms, ".ob-bolt");
    let fillFade = 0;
    let state = "off", urges = 14, busy = false, frames = [], timers = [], ticker = 0, dueAt = 0;
    const later = (ms_, fn) => { const id = setTimeout(fn, reduce ? 0 : ms_); timers.push(id); };
    let sayTimer = 0;
    const say = t => {
      if (!hint || hint.dataset.say === t) return;
      hint.dataset.say = t; clearTimeout(sayTimer);
      if (reduce) { hint.textContent = t; return; }
      hint.style.transition = "opacity .25s ease"; hint.style.opacity = 0;
      sayTimer = setTimeout(() => { hint.textContent = t; hint.style.transition = "opacity .5s ease"; hint.style.opacity = 1; }, 260);
    };
    const tween = (dur, fn, done) => {
      if (reduce) { fn(1); if (done) done(); return; }
      const t0 = performance.now();
      const step = now => { const k = clamp((now - t0) / dur); fn(k); if (k < 1) frames.push(requestAnimationFrame(step)); else if (done) done(); };
      frames.push(requestAnimationFrame(step));
    };
    const travel = r => $(r, ".rail").clientWidth - $(r, ".bar").offsetWidth - 6;
    function bolt(r, pos, o = {}) {
      const bar = $(r, ".bar");
      bar.style.transition = o.anim && !reduce ? (pos >= 1 ? `transform .46s cubic-bezier(.3,1.32,.55,1) ${o.delay || 0}s, background .2s ease` : `transform .5s cubic-bezier(.4,0,.22,1) ${o.delay || 0}s, background .2s ease`) : "background .2s ease";
      bar.style.transform = `translateX(${ease(clamp(pos)) * travel(r)}px)`;
      const seat = () => {
        const was = r.classList.contains("seated");
        r.classList.toggle("seated", pos >= 1);
        if (pos >= 1 && !was && o.knock !== false && !reduce) { const c = $(r, ".catch"); c.classList.remove("knock"); void c.offsetWidth; c.classList.add("knock"); }
      };
      if (o.anim && pos >= 1) later(((o.delay || 0) + 0.36) * 1000, seat); else seat();
    }
    function swapText(el, text, delay = 0) {
      if (reduce) { el.innerHTML = text; return; }
      later(delay, () => { el.style.opacity = 0; });
      later(delay + 140, () => {
        el.innerHTML = text; el.style.transition = "none"; el.style.transform = "translateY(8px)"; void el.offsetWidth;
        el.style.transition = "opacity .3s ease, transform .42s cubic-bezier(.3,1.3,.5,1)"; el.style.opacity = 1; el.style.transform = "none";
      });
    }
    function setSwitch(s, label, glideHome, labelDelay) {
      sw.classList.toggle("on", s === "on"); sw.classList.toggle("cd", s === "cd");
      const id = ++fillFade;
      if (fill.style.opacity === "1" && s !== "off" && !reduce) {
        // the track takes on the fill's colour underneath it first, then the fill steps aside
        later(560, () => {
          if (id !== fillFade || drag) return;
          fill.style.transition = "opacity .2s ease"; fill.style.opacity = 0;
          later(230, () => { if (id === fillFade && !drag) { fill.classList.remove("o"); fill.style.transition = ""; } });
        });
      } else { fill.style.opacity = 0; fill.classList.toggle("o", false); }
      knob.style.transition = glideHome && !reduce ? "left 1.1s cubic-bezier(.22, 1, .36, 1)" : "none";
      knob.style.left = (s === "off" ? 6 : 260) + "px";
      const soft = (glideHome || labelDelay !== undefined) && !reduce;
      lab.style.transition = "none"; lab.style.opacity = soft ? 0 : 1;
      if (soft) { void lab.offsetWidth; lab.style.transition = `opacity .45s ease ${glideHome ? .75 : labelDelay}s`; lab.style.opacity = 1; }
      lab.className = "ms-lab " + (s === "off" ? "r" : "l");
      lab.innerHTML = s === "off" ? `<span>${label}</span>${icon(16, P.dblR, "ink")}`
        : s === "cd" ? `${icon(16, P.dblL, "softo")}<span>${label}</span>`
        : `${icon(16, P.dblL, "soft")}<span>${label}</span><span class="mono">24 H</span>`;
      knob.innerHTML = icon(26, s === "off" ? P.open : s === "cd" ? P.glass : P.lock, s === "off" ? "k-off" : s === "cd" ? "k-cd" : "k-on");
      knob.classList.remove("pop"); if (soft) { void knob.offsetWidth; knob.classList.add("pop"); }
      knob.setAttribute("aria-label", s === "off" ? "Slide right to lock" : s === "cd" ? "Counting down. Tap Keep protection to cancel" : "Slide left to start turning off");
      ms.classList.remove("nudge", "nudge-l");
    }
    /* the screen changes over: what leaves fades up and out, what arrives rises in */
    const fadeOut = (els, dur) => { if (reduce) return; els.forEach(el => { el.style.transition = `opacity ${dur}ms ease, transform ${dur}ms ease`; el.style.opacity = 0; el.style.transform = "translateY(-6px)"; }); };
    const fadeIn = (el, delay, dur) => {
      if (reduce) { el.style.opacity = 1; el.style.transform = ""; return; }
      el.style.transition = "none"; el.style.opacity = 0; el.style.transform = "translateY(10px)"; void el.offsetWidth;
      el.style.transition = `opacity ${dur}ms ease ${delay}ms, transform ${dur + 120}ms cubic-bezier(.3, 1.2, .5, 1) ${delay}ms`;
      el.style.opacity = 1; el.style.transform = "none";
    };
    function squares() {
      q("[data-sq]").innerHTML = Array.from({ length: 30 }, (_, i) => `<i class="${SLIPS.includes(i) ? "slip" : ""}${i === 29 ? " today" : ""}"></i>`).join("");
      q("[data-counts]").innerHTML = `<b>27 of 30</b> days clean · <b>${urges}</b> urges ridden out`;
    }
    function toOff() {
      state = "off"; frames.forEach(cancelAnimationFrame); frames = [];
      q("[data-h]").textContent = "Unlocked."; q("[data-s]").textContent = "App Store and every site are open.";
      q("[data-head]").hidden = false; q("[data-timer]").hidden = true; Object.assign(q("[data-lbl]").style, { display: "", opacity: 1, maxHeight: "", marginTop: "", marginBottom: "", transition: "" });
      q("[data-bolts]").classList.remove("orange"); rows.forEach(r => { r.classList.remove("seated"); bolt(r, 0); });
      q("[data-rest]").style.opacity = 0; q("[data-cap]").style.opacity = 1;
      setSwitch("off", "Slide to lock"); say("Slide the switch to the right");
      later(700, () => { if (state === "off") ms.classList.add("nudge"); });
    }
    function toOn(fromCountdown) {
      state = "on"; clearInterval(ticker);
      setSwitch("on", "Slide to turn off", false, fromCountdown ? .2 : .35);
      if (fromCountdown) {
        const head = q("[data-head]"), timer = q("[data-timer]"), rest = q("[data-rest]");
        const back = () => {
          timer.hidden = true; head.hidden = false;
          q("[data-h]").textContent = "Locked."; q("[data-s]").textContent = "App Store and adult sites are blocked. The clock can't be changed.";
          q("[data-lbl]").style.display = "none";
          squares(); q("[data-sqwrap]").hidden = false;
          q("[data-rows]").innerHTML = row("wave", "I have an urge", "ride it out", "main") + row("install", "Install window", "15 + 15 min");
        };
        q("[data-cap]").style.opacity = 0;
        if (reduce) { back(); q("[data-bolts]").classList.remove("orange"); }
        else {
          fadeOut([timer, rest], 180);
          later(120, () => q("[data-bolts]").classList.remove("orange"));
          later(200, () => { back(); fadeIn(head, 0, 440); fadeIn(rest, 140, 440); });
        }
        say("Changed your mind: that counts as an urge ridden out");
        later(2600, () => { if (state === "on" && !opts.scene && opts.scene !== 0) ms.classList.add("nudge-l"); });
        return;
      }
      const h = q("[data-h]"), sub = q("[data-s]"), lbl = q("[data-lbl]"), rest = q("[data-rest]");
      q("[data-timer]").hidden = true; q("[data-head]").hidden = false;
      q("[data-cap]").style.opacity = 0;
      q("[data-bolts]").classList.remove("orange"); rows.forEach(r => bolt(r, 1, { knock: false }));
      squares(); q("[data-sqwrap]").hidden = false;
      q("[data-rows]").innerHTML = row("wave", "I have an urge", "ride it out", "main") + row("install", "Install window", "15 + 15 min");
      const locked = () => { h.textContent = "Locked."; sub.textContent = "App Store and adult sites are blocked. The clock can't be changed."; };
      if (reduce) { locked(); lbl.style.display = "none"; rest.style.opacity = 1; }
      else {
        fadeOut([h, sub], 220);
        lbl.style.transition = "none"; lbl.style.overflow = "hidden"; lbl.style.maxHeight = lbl.offsetHeight + "px"; void lbl.offsetWidth;
        lbl.style.transition = "opacity .2s ease, max-height .6s cubic-bezier(.4, 0, .2, 1) .12s, margin .6s cubic-bezier(.4, 0, .2, 1) .12s";
        lbl.style.opacity = 0; lbl.style.maxHeight = "0px"; lbl.style.marginTop = "0px"; lbl.style.marginBottom = "0px";
        later(240, () => { locked(); fadeIn(h, 0, 520); fadeIn(sub, 90, 520); });
        fadeIn(rest, 520, 560);
      }
      say("Locked. Now slide it back to the left");
      later(2200, () => { if (state === "on" && opts.scene === undefined) ms.classList.add("nudge-l"); });
    }
    function toCountdown() {
      state = "cd"; dueAt = Date.now() + 24 * 3600e3;
      const due = new Date(dueAt), hm = due.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      setSwitch("cd", `Off tomorrow, ${hm}`, true);
      const head = q("[data-head]"), timer = q("[data-timer]"), rest = q("[data-rest]"), hours = q("[data-hours]");
      q("[data-line]").textContent = `Everything stays blocked until tomorrow, ${hm}. Changing your mind counts as an urge ridden out.`;
      rows.forEach((r, i) => { $(r, ".bar").style.transition = `background .45s ease ${i * .08}s`; $(r, ".catch").style.transition = `border-color .45s ease ${i * .08}s`; });
      const swap = () => {
        head.hidden = true; timer.hidden = false;
        $$(hours, "i").forEach((i, k) => i.classList.toggle("past", k === 0));
        if (!reduce) { hours.classList.remove("pop"); void hours.offsetWidth; hours.classList.add("pop"); }
        q("[data-sqwrap]").hidden = true;
        q("[data-rows]").innerHTML = row("lock", "Keep protection", "cancel", "main", "button") + row("wave", "I have an urge", "ride it out");
        q("[data-keep]").addEventListener("click", keep);
      };
      if (reduce) { swap(); q("[data-bolts]").classList.add("orange"); }
      else {
        fadeOut([head, rest], 200);
        later(160, () => q("[data-bolts]").classList.add("orange"));
        later(230, () => { swap(); fadeIn(timer, 0, 500); fadeIn(rest, 180, 480); });
      }
      const t = q("[data-t]");
      const show = () => { const s = Math.max(0, Math.round((dueAt - Date.now()) / 1000)); t.textContent = `${pad(s / 3600 | 0)}:${pad((s % 3600) / 60 | 0)}:${pad(s % 60)}`; };
      show(); clearInterval(ticker); ticker = setInterval(show, 1000);
      say("24 hours to go. Tap Keep protection to change your mind");
    }
    function keep() { urges += 1; toOn(true); }

    /* drag: off → right locks; on → left starts the countdown; countdown → right keeps protection */
    const follow = p => {
      knob.style.transition = "none"; fill.style.transition = "none";
      if (state === "off") {
        const left = 6 + p * 254; knob.style.left = left + "px"; fill.style.width = (left + 82) + "px"; fill.style.opacity = p > 0 ? 1 : 0; lab.style.opacity = clamp(1 - p * 2.4);
        rows.forEach((r, i) => bolt(r, cascade(p, i), { knock: false }));
        q("[data-h]").textContent = p > .04 ? "Locking…" : "Unlocked."; q("[data-s]").textContent = p > .04 ? "Let go early and nothing turns on." : "App Store and every site are open.";
      } else if (state === "on") {
        const left = 260 - p * 254; knob.style.left = left + "px"; lab.style.opacity = clamp(1 - p * 2.4);
        fill.classList.add("o"); fill.style.left = "auto"; fill.style.right = 0; fill.style.width = (390 - 48 - left + 6) + "px"; fill.style.opacity = p > 0 ? 1 : 0;
      } else if (state === "cd") {
        const left = 6 + p * 254; knob.style.left = left + "px"; lab.style.opacity = clamp(1 - p * 2.4);
        fill.classList.remove("o"); fill.style.right = "auto"; fill.style.left = 0; fill.style.width = (left + 82) + "px"; fill.style.opacity = p > 0 ? 1 : 0;
      }
    };
    const resetFill = () => { fill.style.left = 0; fill.style.right = "auto"; };
    let drag = null;
    knob.addEventListener("pointerdown", e => { if (busy || state === "cd" || opts.scene !== undefined) return; knob.setPointerCapture(e.pointerId); fillFade++; ms.classList.remove("nudge", "nudge-l"); drag = { x: e.clientX, k: ms.getBoundingClientRect().width / 390, p: 0 }; });
    knob.addEventListener("pointermove", e => { if (!drag) return; const dir = state === "on" ? -1 : 1; drag.p = clamp(((e.clientX - drag.x) * dir) / (254 * drag.k)); follow(drag.p); });
    const release = e => {
      if (!drag) return;
      if (e && e.type === "pointerup") { const dir = state === "on" ? -1 : 1; drag.p = clamp(((e.clientX - drag.x) * dir) / (254 * drag.k)); }
      const p = drag.p; drag = null;
      if (p > 0.6) {
        busy = true;
        tween(200 * (1 - p) + 120, k => follow(p + (1 - p) * ease(k)), () => {
          busy = false; resetFill();
          if (state === "off") { toOn(false); }
          else if (state === "on") toCountdown();
          else keep();
        });
      } else {
        tween(260, k => follow(p * (1 - k)), () => { resetFill(); if (state === "off") { q("[data-h]").textContent = "Unlocked."; q("[data-s]").textContent = "App Store and every site are open."; } fill.style.opacity = 0; lab.style.opacity = 1; });
      }
    };
    knob.addEventListener("pointerup", release); knob.addEventListener("pointercancel", release); knob.addEventListener("lostpointercapture", release);
    knob.addEventListener("keydown", e => {
      if (opts.scene !== undefined || (e.key !== "Enter" && e.key !== " " && e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      e.preventDefault();
      if (state === "off" && e.key !== "ArrowLeft") toOn(false);
      else if (state === "on" && e.key !== "ArrowRight") toCountdown();
      else if (state === "cd") keep();
    });

    /* ---------- story scenes: the same screen playing one part of the app by itself ---------- */
    let winTick = 0, breathRaf = 0;
    const homeRows = () => row("wave", "I have an urge", "ride it out", "main") + row("install", "Install window", "15 + 15 min");
    function snapOn() { // locked, at once
      state = "on";
      setSwitch("on", "Slide to turn off");
      q("[data-head]").hidden = false; q("[data-timer]").hidden = true;
      q("[data-h]").textContent = "Locked."; q("[data-s]").textContent = "App Store and adult sites are blocked. The clock can't be changed.";
      q("[data-lbl]").style.display = "none";
      const cap = q("[data-cap]"); cap.style.transition = "none"; cap.style.opacity = 0;
      rows.forEach(r => bolt(r, 1, { knock: false }));
      squares(); q("[data-sqwrap]").hidden = false;
      q("[data-rows]").innerHTML = homeRows();
      const rest = q("[data-rest]"); rest.style.transition = "none"; rest.style.opacity = 1;
    }
    function snapOff() { toOff(); timers.forEach(clearTimeout); timers = []; ms.classList.remove("nudge"); }
    function autoSlide(dur) { // a finger takes the knob all the way
      busy = true;
      tween(dur, k => follow(ease(k)), () => { busy = false; resetFill(); if (state === "off") toOn(false); else if (state === "on") toCountdown(); });
    }
    function tap(label, done) {
      const r = $$(ms, ".ms-row").find(x => x.textContent.includes(label));
      if (r) { r.classList.add("tap"); later(460, () => r.classList.remove("tap")); }
      later(420, done);
    }
    function overlay(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); const el = d.firstElementChild; ms.appendChild(el); return el; }
    function breathe(el) {
      const sq = $(el, "[data-bsq]"), word = $(el, "[data-bword]"), ph = $$(el, "[data-bp]"), tm = $(el, "[data-btime]"), t0 = performance.now();
      const go = now => {
        const t = (now - t0) / 1000, c = t % 14, p = c < 4 ? 0 : c < 8 ? 1 : 2, left = p === 0 ? 4 - c : p === 1 ? 8 - c : 14 - c;
        const k = p === 0 ? c / 4 : p === 1 ? 1 : 1 - (c - 8) / 6;
        sq.style.transform = `scale(${0.62 + 0.38 * ease(k)})`; sq.textContent = Math.ceil(left);
        word.textContent = ["Inhale", "Hold", "Exhale"][p]; ph.forEach((e, j) => e.classList.toggle("on", j === p));
        const r = Math.max(0, 120 - t); tm.textContent = `${Math.floor(r / 60)}:${pad(Math.floor(r % 60))}`;
        breathRaf = requestAnimationFrame(go);
      };
      breathRaf = requestAnimationFrame(go);
    }
    function toEvening() { // the workday ends: the screen goes dark and turning off pauses until morning
      const parts = [q(".ms-top"), q(".ms-body")];
      fadeOut(parts, 300);
      later(160, () => ms.classList.add("night"));
      lab.style.transition = "opacity .25s ease"; lab.style.opacity = 0;
      later(320, () => {
        q("[data-rows]").innerHTML = row("wave", "I have an urge", "ride it out", "main") + row("install", "Install window", "from 07:00", "dim") + row("moon", "Evening mode is on", "until 07:00", "moonrow");
        parts.forEach((el, i) => fadeIn(el, i * 80, 620));
        lab.className = "ms-lab l"; lab.innerHTML = `${icon(16, P.moon, "soft")}<span>Turning off paused till 07:00</span>`;
        lab.style.transition = "opacity .6s ease .35s"; lab.style.opacity = 1;
      });
    }
    function toWindow() { // the install window opens: the App Store bolt draws back for fifteen minutes
      const head = q("[data-head]"), timer = q("[data-timer]"), rest = q("[data-rest]"), hours = q("[data-hours]"), cap = q("[data-cap]"), app = rows[0];
      fadeOut([head, rest], 220);
      later(140, () => { app.classList.add("open"); bolt(app, 0, { anim: true }); });
      sw.classList.remove("on"); sw.classList.add("cd");
      lab.style.transition = "opacity .2s ease"; lab.style.opacity = 0;
      knob.style.transition = reduce ? "none" : "left 1.1s cubic-bezier(.22, 1, .36, 1)"; knob.style.left = "133px";
      later(220, () => { knob.innerHTML = icon(26, P.glass, "k-cd"); if (!reduce) { knob.classList.remove("pop"); void knob.offsetWidth; knob.classList.add("pop"); } });
      const end = new Date(Date.now() + 15 * 60e3).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      later(240, () => {
        head.hidden = true; timer.hidden = false;
        q("[data-t]").textContent = "15:00"; q(".ms-timer .u").textContent = "left to install";
        q("[data-line]").textContent = `Closes on its own at ${end}, even if you leave the app.`;
        hours.classList.add("win"); hours.innerHTML = Array.from({ length: 15 }, (_, k) => `<i class="past" style="--k:${k}"></i>`).join("");
        if (!reduce) { hours.classList.remove("pop"); void hours.offsetWidth; hours.classList.add("pop"); }
        q("[data-sqwrap]").hidden = true;
        q("[data-rows]").innerHTML = row("install", "Open App Store", "", "main") + row("lock", "Close window early", "relock now");
        fadeIn(timer, 0, 520); fadeIn(rest, 180, 500);
        cap.textContent = "Social apps and adult sites stay blocked."; cap.style.transition = "opacity .5s ease .5s"; cap.style.opacity = 1;
        let left = 15 * 60; clearInterval(winTick);
        winTick = setInterval(() => { left = Math.max(0, left - 1); q("[data-t]").textContent = `${pad(left / 60 | 0)}:${pad(left % 60)}`; }, 1000);
      });
    }
    const BREATHE = `<div class="ts"><div class="bar"><span class="back">${icon(20, '<path d="M15 6l-6 6 6 6"/>')}</span><span class="mid">Breathe · 2 min</span></div>
      <div class="bbox"><div class="bsq" data-bsq>4</div></div><div class="bword" data-bword>Inhale</div>
      <div class="bphases"><span><i class="on" data-bp="0">In 4</i></span><span><i data-bp="1">Hold 4</i></span><span><i data-bp="2">Out 6</i></span></div>
      <div class="btime"><b data-btime>2:00</b><span>left</span></div><p class="bfoot">Leave the app and the timer pauses.</p></div>`;
    const RODE = `<div class="ts rode"><div class="bar"><span class="xbtn">${icon(20, '<path d="M6 6l12 12M18 6L6 18"/>')}</span></div>
      <h3 class="rh">Rode it out.</h3><div class="rnum"><span class="col"><b>14</b><b>15</b></span></div>
      <p class="rsub">urges ridden out. A slip won't erase them.</p>
      <div class="rsq">${Array.from({ length: 30 }, (_, i) => `<i style="--k:${i}" class="${SLIPS.includes(i) ? "slip" : ""}${i === 29 ? " today" : ""}"></i>`).join("")}</div>
      <p class="rcount">27 of 30 days clean · Breathe helped</p><div class="rdone">Done</div></div>`;
    function scene(n, play) {
      ms.classList.add("static"); knob.tabIndex = -1;
      if (n === 0) { snapOff(); if (play) later(700, () => autoSlide(1500)); }
      else if (n === 1) { snapOn(); if (play) later(800, () => autoSlide(1500)); }
      else if (n === 2) { snapOn(); const b = overlay(BREATHE); b.style.transition = "none"; b.classList.add("on"); if (play) breathe(b); }
      else if (n === 3) { snapOn(); if (play) later(1000, toEvening); }
      else if (n === 4) { snapOn(); if (play) later(700, () => tap("Install window", toWindow)); }
      else {
        snapOn(); const r = overlay(RODE), col = $(r, ".col"); r.style.transition = "none"; r.classList.add("on");
        if (play && !reduce) { $(r, ".rsq").classList.add("pop"); later(1200, () => col.classList.add("go")); }
        else { col.style.transition = "none"; col.classList.add("go"); }
      }
    }
    function destroy() {
      removeEventListener("resize", size);
      timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame); timers = []; frames = [];
      clearInterval(ticker); clearInterval(winTick); cancelAnimationFrame(breathRaf); clearTimeout(sayTimer);
    }

    /* size: the device's height follows the window, like a real phone held at arm's length */
    function size() {
      const narrow = innerWidth < 900;
      const h = opts.height ? opts.height() : narrow ? Math.min(600, innerWidth * 1.55) : clamp(innerHeight - 190, 360, 600);
      wrap.style.setProperty("--s", (h / 864).toFixed(4));
      rows.forEach(r => bolt(r, r.classList.contains("seated") ? 1 : 0, { knock: false }));
    }
    addEventListener("resize", size); size();
    if (opts.scene === undefined) toOff(); else scene(opts.scene, opts.play);
    return { size, destroy };
  }

  const heroEl = $('[data-dev="hero"]'), fxEl = $('[data-dev="fx"]');
  const heroDev = heroEl ? mountDevice(heroEl, $("[data-hint]")) : null;
  const fxDev = fxEl ? mountDevice(fxEl, $("[data-fxhint]")) : null;

  /* ---------- sticky story: a step is current once its heading passes the middle ---------- */
  const story = $("#d-story") || document.createElement("section"), steps = $$(story, ".d-step"), dots = $$(story, ".dots i");
  let cur = -1;
  // wide screens: one phone beside the steps plays the scene of the current step, once the story is in view
  const storyWrap = $(story, '[data-dev="story"]'), storyH = () => Math.min(560, innerHeight - 200);
  let storyKey = null, storyDev = null, storySwap = 0;
  function storyScene(key) {
    if (!storyWrap || key === storyKey) return;
    const first = storyKey === null; storyKey = key; clearTimeout(storySwap);
    const mount = () => { if (storyDev) storyDev.destroy(); storyWrap.innerHTML = ""; storyDev = mountDevice(storyWrap, null, { scene: Math.max(0, key), play: key >= 0, height: storyH }); storyWrap.style.opacity = 1; };
    if (first || reduce) { mount(); return; }
    storyWrap.style.opacity = 0; storySwap = setTimeout(mount, 300);
  }
  // phones: each step has its own phone, which plays its scene while it is on screen
  $$(story, ".devwrap.inline").forEach(w => {
    const n = +w.dataset.scene, h = () => Math.min(240, innerWidth * 0.62) / 0.4745;
    let dev = mountDevice(w, null, { scene: n, play: false, height: h }), on = false;
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting === on) return; on = e.isIntersecting;
      dev.destroy(); w.innerHTML = ""; dev = mountDevice(w, null, { scene: n, play: on, height: h });
    }), { rootMargin: "-25% 0px -25% 0px" }).observe(w);
  });
  function syncStory() {
    if (innerWidth < 900 || !steps.length) return;
    const line = innerHeight * 0.5;
    let n = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < line) n = i; });
    storyScene(steps[0].getBoundingClientRect().top < innerHeight * 0.75 ? n : -1);
    if (n === cur) return; cur = n;
    const d = steps[n].dataset;
    dots.forEach((im, i) => im.classList.toggle("on", i === n));
    story.style.setProperty("--bg", d.bg); story.style.setProperty("--fg", d.fg); story.style.setProperty("--sub", d.sub);
  }
  steps.forEach(st => { st.style.setProperty("--sb", st.dataset.bg); st.style.setProperty("--sf", st.dataset.fg); st.style.setProperty("--ss", st.dataset.sub); });
  addEventListener("scroll", syncStory, { passive: true });
  addEventListener("resize", () => { cur = -1; syncStory(); });

  /* ---------- the seven tasks ---------- */
  const TASKS = [["Breathe", "2 min"], ["Phone down", "3 min"], ["Follow the dot", "2 min"], ["Walk", "200 steps"], ["Puzzle", "3 min"], ["Nose push-ups", "20 reps"], ["Retype your letter", "1 min"]];
  const stageHTML = {
    "Breathe": `<div class="a-breathe"></div><span class="a-breathe-l"></span>`,
    "Phone down": `<div class="a-down-box"><p class="a-down-t"><span data-down>3:00</span><small>face down, then it counts</small></p><span class="a-table"></span><span class="a-down"></span></div>`,
    "Follow the dot": `<svg class="a-dot-path" viewBox="0 0 180 120"><path d="M 30 60 C 30 20, 90 20, 90 60 C 90 100, 150 100, 150 60 C 150 20, 90 20, 90 60 C 90 100, 30 100, 30 60 Z" fill="none" stroke="#CFC9BC" stroke-width="1.5" stroke-dasharray="3 5"/></svg><div class="a-dot"></div>`,
    "Walk": `<div class="a-walk"><span data-steps>0</span><small>of 200 steps</small></div><div class="a-walk-bar"><i></i></div>`,
    "Puzzle": `<div class="a-puz"><i>1</i><i>2</i><i>3</i><i>4</i><i class="mv">5</i><i class="gap"></i><i>7</i><i>8</i><i>6</i></div>`,
    "Nose push-ups": `<div class="a-push"><div class="ring"></div><div class="n" data-push>0</div></div>`,
    "Retype your letter": `<div class="a-letter"><span class="cnt"><b data-typed-n>0</b>/ 43</span><p class="paper"><span class="done" data-type></span><span class="caret"></span><span class="rest" data-rest-txt></span></p></div>`
  };
  const cardHTML = TASKS.map(([n, v]) => `<div class="card"><div class="stage">${stageHTML[n]}</div><div class="t"><b>${n}</b><span>${v}</span></div></div>`).join("")
    + `<div class="card more"><p>None of them unlocks anything.</p><span>They help the wave pass, and each one counts as an urge ridden out.</span></div>`;
  $$("[data-cards]").forEach(c => (c.innerHTML = cardHTML));
  let tick = 0;
  if ($("[data-cards]")) setInterval(() => {
    tick++;
    $$("[data-steps]").forEach(e => (e.textContent = Math.round(((tick % 70) / 70) * 200)));
    $$("[data-push]").forEach(e => (e.textContent = Math.floor(tick / 16) % 21));
    $$("[data-down]").forEach(e => { const s = 180 - (tick % 180); e.textContent = `${s / 60 | 0}:${pad(s % 60)}`; });
    const msg = "You're stronger than one wave. Wait it out.", n = Math.min(msg.length, tick % (msg.length + 14));
    $$("[data-type]").forEach(e => (e.textContent = msg.slice(0, n)));
    $$("[data-rest-txt]").forEach(e => (e.textContent = msg.slice(n)));
    $$("[data-typed-n]").forEach(e => (e.textContent = n));
  }, 100);

  /* ---------- the story moves one step per swipe on wide screens ---------- */
  const TOP = 0;
  let animating = false, target = 0, glideId = 0;
  let lastWheel = -1e4, lastDir = 0, lastFresh = -1e4, peak = 0, recent = [], used = false;
  const stepY = i => steps[i].getBoundingClientRect().top + scrollY - TOP;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function glide(to, dur = 760) {
    const moving = animating, curve = moving ? easeOut : ease; if (moving) dur = 640;
    const from = scrollY, t0 = performance.now(), id = ++glideId; animating = true; target = to;
    const go = now => {
      if (id !== glideId) return; // a newer swipe took over
      const k = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, from + (to - from) * curve(k));
      if (k < 1) requestAnimationFrame(go); else { animating = false; syncStory(); }
    };
    requestAnimationFrame(go);
  }
  function featureTarget(dir, y = scrollY) {
    const max = document.documentElement.scrollHeight - innerHeight;
    const secs = $$("#features > section").map(el => {
      const r = el.getBoundingClientRect(), top = Math.min(max, Math.round(r.top + scrollY - TOP));
      return { top, end: Math.min(max, Math.max(top, Math.round(r.bottom + scrollY - innerHeight))) }; // end: the bottom of a tall section in view
    });
    const cur = secs.find(c => c.top <= y + 2 && c.end + innerHeight > y + 2);
    if (dir > 0) {
      if (cur && cur.end > y + 2) return cur.end;
      for (const c of secs) if (c.top > y + 2) return c.top;
      return null;
    }
    if (cur && cur.top < y - 2) return cur.top;
    for (let i = secs.length - 1; i >= 0; i--) if (secs[i].top < y - 2) return secs[i].end > secs[i].top + 2 ? secs[i].end : secs[i].top;
    return null;
  }
  function stepTarget(dir, y = scrollY) {
    if (PAGE === "features") return featureTarget(dir, y);
    if (!steps.length) return null;
    const first = stepY(0), last = stepY(steps.length - 1);
    if (dir > 0) {
      if (y < first - 2 && y >= first - innerHeight - 2) return first;           // from the hero into step 1
      if (y >= first - 2 && y < last - 2) { for (let i = 0; i < steps.length; i++) if (stepY(i) > y + 2) return stepY(i); }
    } else {
      if (y > 2 && y <= first + 2 && first <= innerHeight + 2) return 0;         // from step 1 back up to the hero
      if (y > last + 2 && y < last + innerHeight * 0.95) return last;            // from below back into the last step
      if (y > first + 2 && y <= last + 2) { for (let i = steps.length - 1; i >= 0; i--) if (stepY(i) < y - 2) return stepY(i); }
    }
    return null;
  }
  /* A trackpad keeps sending a swipe's momentum for a second or more after the fingers lift.
     A new swipe is a pause, a turn the other way, or a rise out of a dip in that momentum
     (the fingers touching down stop it, then the new swipe starts small and grows). */
  addEventListener("wheel", e => {
    if (innerWidth < 900 || reduce || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = e.timeStamp, a = Math.abs(e.deltaY), dir = Math.sign(e.deltaY), gap = now - lastWheel;
    lastWheel = now;
    if (!dir || (gap <= 160 && dir !== lastDir && a < 4)) { if (used || animating) e.preventDefault(); return; } // empty, or a wobble as the fingers lift
    const low = recent.length ? Math.min(...recent) : 0, settled = now - lastFresh > 420;
    const fresh = gap > 160 || dir !== lastDir || (settled && ((gap > 60 && a > 4) || (a > 10 && a > low * 2.5 && low < peak * 0.5)));
    lastDir = dir;
    if (fresh) { lastFresh = now; used = false; peak = a; recent = [a]; }
    else { peak = Math.max(peak, a); recent.push(a); if (recent.length > 4) recent.shift(); }
    if (used || (animating && !fresh)) { e.preventDefault(); return; } // the rest of a swipe that already moved the page
    const to = stepTarget(dir, animating ? target : scrollY);
    if (to === null) { if (animating) e.preventDefault(); return; }
    e.preventDefault(); used = true; glide(to);
  }, { passive: false });
  addEventListener("keydown", e => {
    if (innerWidth < 900 || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.target.closest("button, input, textarea")) return;
    if (e.repeat && animating) { if (["ArrowDown", "PageDown", " ", "ArrowUp", "PageUp"].includes(e.key)) e.preventDefault(); return; }
    const dir = ["ArrowDown", "PageDown", " "].includes(e.key) ? 1 : ["ArrowUp", "PageUp"].includes(e.key) ? -1 : 0;
    if (!dir) return;
    const to = stepTarget(dir, animating ? target : scrollY);
    if (to !== null) { e.preventDefault(); glide(to); }
  });
  const toTop = () => window.scrollTo(0, 0);

  /* ---------- Features: option rows that switch the phone's screen ----------
     The rows step through on their own; a tap jumps to that one and the steps go on from there. */
  const DWELL = { off: 3200, urge: 7000, win: 3000, door: 3400, lang: 2600 };
  const live = {};
  $$("[data-opts]").forEach(group => {
    const name = group.dataset.opts, opts = $$(group, ".opt");
    const shots = $$(`[data-shots="${name}"] img`);
    const dwell = DWELL[name] || 4000;
    let i = 0, timer = 0, visible = false;
    function pick(n) {
      i = n; clearTimeout(timer);
      opts.forEach((o, k) => { o.setAttribute("aria-pressed", k === n ? "true" : "false"); const r = $(o, ".run"); r.style.transition = "none"; r.style.width = 0; });
      shots.forEach((im, k) => im.classList.toggle("on", k === n));
      if (live[name]) live[name](n);
      if (!visible) return;
      const r = $(opts[n], ".run"); void r.offsetWidth; r.style.transition = `width ${dwell}ms linear`; r.style.width = "100%";
      timer = setTimeout(() => pick((i + 1) % opts.length), dwell);
    }
    opts.forEach((o, k) => o.addEventListener("click", () => pick(k)));
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) pick(i); else { clearTimeout(timer); if (live[name + "Stop"]) live[name + "Stop"](); } }), { rootMargin: "-45% 0px -45% 0px" }).observe(group.closest(".fx-row"));
  });

  /* ---------- Features: the live task phone ---------- */
  if ($("[data-livewrap]")) {
    const lw = $("[data-livewrap]"), root = $("[data-live]"), screens = $$(root, ".ts");
    const sizeLive = () => { const w = innerWidth < 900 ? Math.min(270, innerWidth * 0.68) : Math.min(560, innerHeight - 200) * 0.472; lw.style.setProperty("--s", (w / 410).toFixed(4)); };
    addEventListener("resize", sizeLive); sizeLive();
    let cur = 0, t0 = performance.now(), raf = 0;
    const q = s_ => $(root, s_);
    // puzzle board
    const grid = q("[data-pgrid]"), SLOT = 110;
    const tiles = [1, 2, 3, 4, 5, 7, 8, 6].map(n => { const t = document.createElement("div"); t.className = "ptile"; t.textContent = n; grid.appendChild(t); return t; });
    const gap = document.createElement("div"); gap.className = "pgap"; grid.appendChild(gap);
    let pz = [0, 1, 2, 3, 4, 5, 6, 7, -1], moves = 14, last = -1;
    const place = (el, slot) => { el.style.left = (slot % 3) * SLOT + "px"; el.style.top = Math.floor(slot / 3) * SLOT + "px"; };
    const pzPaint = () => { pz = [0, 1, 2, 3, 4, -1, 5, 6, 7]; pz.forEach((ti, slot) => { if (ti >= 0) place(tiles[ti], slot); else place(gap, slot); }); tiles.forEach((t, k) => t.classList.toggle("wrong", k === 7)); };
    pzPaint();
    let pzTimer = 0;
    function pzStep() {
      const g = pz.indexOf(-1), c = g % 3, r = Math.floor(g / 3);
      const near = [c > 0 ? g - 1 : null, c < 2 ? g + 1 : null, r > 0 ? g - 3 : null, r < 2 ? g + 3 : null].filter(x => x !== null && x !== last);
      const from = near[Math.floor(Math.random() * near.length)], ti = pz[from];
      place(tiles[ti], g); place(gap, from); pz[g] = ti; pz[from] = -1; last = g;
      moves += 1; q("[data-pmoves]").textContent = moves;
    }
    // walk path
    const wpath = q("[data-wpath]"), wdot = q("[data-wdot]"), wlen = wpath.getTotalLength();
    // letter
    const LETTER = "I want more time for my projects and sport. Every time I get stuck scrolling, I regret it later. You're stronger than one wave.";
    q("[data-lt]").textContent = LETTER.length;
    const mmss = x => `${Math.floor(x / 60)}:${pad(Math.floor(x % 60))}`;
    function frame(now) {
      const t = (now - t0) / 1000;
      if (cur === 0) { // breathe: in 4, hold 4, out 6
        const c = t % 14, ph = c < 4 ? 0 : c < 8 ? 1 : 2, left = ph === 0 ? 4 - c : ph === 1 ? 8 - c : 14 - c;
        const k = ph === 0 ? c / 4 : ph === 1 ? 1 : 1 - (c - 8) / 6;
        q("[data-bsq]").style.transform = `scale(${0.62 + 0.38 * ease(k)})`;
        q("[data-bsq]").textContent = Math.ceil(left);
        q("[data-bword]").textContent = ["Inhale", "Hold", "Exhale"][ph];
        $$(root, "[data-bp]").forEach((e, j) => e.classList.toggle("on", j === ph));
        q("[data-btime]").textContent = mmss(Math.max(0, 91 - t));
      } else if (cur === 1) { // phone down: it turns over until put down, then the ring fills as the minutes go
        const flip = q("[data-dflip]"), WAIT = 3.2;
        if (t < WAIT) {
          flip.classList.add("wait"); flip.classList.remove("down");
          q("[data-dtime]").textContent = "3:00"; q("[data-dword]").textContent = "starts face down"; q("[data-dring]").setAttribute("stroke-dasharray", "0 100");
        } else {
          flip.classList.remove("wait"); flip.classList.add("down");
          const left = Math.max(0, 180 - (t - WAIT) * 14);
          q("[data-dtime]").textContent = mmss(left); q("[data-dword]").textContent = "left";
          q("[data-dring]").setAttribute("stroke-dasharray", `${(180 - left) / 180 * 100} 100`);
        }
      } else if (cur === 2) { // the dot sweeps once a second, with a fading trail
        const x = tt => 22 + (Math.sin(tt * Math.PI) * 0.5 + 0.5) * 298;
        [0, 1, 2, 3].forEach(j => { const d = q(`[data-dot="${j}"]`); d.style.left = x(t - j * 0.05) + "px"; });
        q("[data-dbar]").style.width = Math.min(100, 50 + (t % 24) / 24 * 50) + "%";
        q("[data-dleft]").textContent = mmss(Math.max(0, 76 - t)) + " left";
      } else if (cur === 3) { // walk: about three steps a second
        const n = Math.min(200, Math.floor((t * 3.2) % 214));
        q("[data-wn]").textContent = n;
        const L = wlen * n / 200; wpath.setAttribute("stroke-dasharray", `${L} 2000`);
        const pt = wpath.getPointAtLength(L); wdot.setAttribute("cx", pt.x); wdot.setAttribute("cy", pt.y);
        q("[data-wleft]").textContent = n >= 200 ? "done" : `≈ ${Math.max(1, Math.ceil((200 - n) / 100))} min left`;
      } else if (cur === 4) {
        q("[data-ptime]").textContent = mmss(Math.max(0, 108 - t));
      } else if (cur === 5) { // a push-up every 1.4 s
        const n = Math.min(20, 7 + Math.floor(t / 1.4));
        q("[data-pn]").textContent = n; q("[data-pn2]").textContent = n;
        const h = n / 20 * 100; q("[data-pfill]").style.height = h + "%"; q("[data-pover]").style.clipPath = `inset(${100 - h}% 0 0 0)`;
        q("[data-pleft]").textContent = n >= 20 ? "done" : `${20 - n} to go`;
      } else if (cur === 6) { // retype, a letter at a time
        const n = Math.min(LETTER.length, Math.floor(t * 9));
        q("[data-ln]").textContent = n; q("[data-ldone]").textContent = LETTER.slice(0, n); q("[data-lrest]").textContent = LETTER.slice(n);
        q("[data-ltyped]").textContent = LETTER.slice(Math.max(0, n - 60), n);
      }
      raf = requestAnimationFrame(frame);
    }
    live.urge = n => {
      cur = n; t0 = performance.now();
      screens.forEach((el, k) => el.classList.toggle("on", k === n));
      clearInterval(pzTimer); if (n === 4) { moves = 14; q("[data-pmoves]").textContent = moves; pzPaint(); pzTimer = setInterval(pzStep, 1200); }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    };
    live.urgeStop = () => { cancelAnimationFrame(raf); clearInterval(pzTimer); };
  }

  /* ---------- Features: evening mode, an afternoon running into the night ----------
     One continuous run: the clock fast-forwards minute by minute, eases into 18:00 and rests
     there while evening mode comes on, then runs on into the night and rewinds to the afternoon. */
  if ($(".evebar")) {
    const START = 14 * 60, END = 23 * 60 + 30, WORK = 18 * 60, bar = $(".evebar");
    const fillEl = $("[data-evefill]"), markEl = $("[data-evemark]"), nowEl = $("[data-eve-now]"), wordEl = $("[data-eve-word]"), stateEl = $(".eve .state");
    const smooth = t => (1 - Math.cos(Math.PI * t)) / 2;
    const PLAN = [[START, WORK, 4600, smooth], [WORK, WORK, 1600], [WORK, END, 5600, smooth], [END, END, 2200], [END, START, 1400, ease], [START, START, 800]];
    const TOTAL = PLAN.reduce((sum, p) => sum + p[2], 0);
    const pct = v => (v - 12 * 60) / (24 * 60 - 12 * 60) * 100;
    let eveRaf = 0, t0 = 0, lastMin = -1, night = null, fadeTimer = 0;
    bar.style.setProperty("--p", pct(WORK));
    function setState(isNight) {
      const apply = () => {
        $("[data-eve-t]").textContent = isNight ? "Evening mode is on" : "Daytime";
        $("[data-eve-s]").textContent = isNight ? "Nothing unlocks until 07:00, and no install windows either." : "You can ask to turn off. It takes 24 hours.";
      };
      bar.classList.toggle("night", isNight);
      $$('[data-shots="eve"] img').forEach((im, k) => im.classList.toggle("on", k === (isNight ? 1 : 0)));
      clearTimeout(fadeTimer);
      if (night === null || reduce) { apply(); return; }
      stateEl.style.transition = "opacity .2s ease"; stateEl.style.opacity = 0;
      fadeTimer = setTimeout(() => { apply(); stateEl.style.opacity = 1; }, 200);
    }
    function paint(m) {
      const p = pct(m) + "%"; fillEl.style.width = p; markEl.style.left = p;
      const min = Math.round(m);
      if (min !== lastMin) {
        lastMin = min;
        nowEl.textContent = `${pad(min / 60 | 0)}:${pad(min % 60)}`;
        wordEl.textContent = min < 17 * 60 ? "afternoon" : min < WORK ? "almost done" : min < 21 * 60 ? "evening" : "night";
      }
      const isNight = min >= WORK;
      if (isNight !== night) { setState(isNight); night = isNight; }
    }
    function frame(now) {
      let t = (now - t0) % TOTAL, m = START;
      for (const [from, to, dur, curve] of PLAN) { if (t < dur) { m = from + (to - from) * (curve ? curve(t / dur) : 1); break; } t -= dur; }
      paint(m); eveRaf = requestAnimationFrame(frame);
    }
    function start() {
      cancelAnimationFrame(eveRaf);
      if (reduce) { paint(WORK + 120); return; }
      t0 = performance.now(); eveRaf = requestAnimationFrame(frame);
    }
    const stop = () => cancelAnimationFrame(eveRaf);
    paint(START);
    new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop())), { rootMargin: "-45% 0px -45% 0px" }).observe($("#fx-eve .fx-row"));
  }

  /* ---------- Features: progress grid ---------- */
  const pg = $("[data-prog]"), slips = new Set(SLIPS);
  if (pg) {
  function drawProg() {
    pg.innerHTML = Array.from({ length: 30 }, (_, i) => `<button type="button" style="--i:${i}" class="${slips.has(i) ? "s" : ""}${i === 29 ? " t" : ""}" data-d="${i}" aria-label="Day ${i + 1}, ${slips.has(i) ? "slip" : "clean"}"></button>`).join("");
    $("[data-prog-n]").innerHTML = `<b>${30 - slips.size} of 30</b> days clean · <b>15</b> urges ridden out`;
  }
  pg.addEventListener("click", e => { const b = e.target.closest("[data-d]"); if (!b) return; const d = +b.dataset.d; slips.has(d) ? slips.delete(d) : slips.add(d); pg.classList.remove("pop"); drawProg(); });
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { pg.classList.remove("pop"); void pg.offsetWidth; pg.classList.add("pop"); } }), { rootMargin: "-45% 0px -45% 0px" }).observe($("#fx-prog .fx-row"));
  drawProg();
  }

  /* ---------- Features: index links ---------- */
  $$("[data-jump]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const t = document.getElementById(a.dataset.jump); if (t) glide(t.getBoundingClientRect().top + scrollY - TOP, 900); }));

  /* ---------- start ---------- */
  requestAnimationFrame(() => {
    if (heroDev) heroDev.size();
    if (fxDev) fxDev.size();
    cur = -1; syncStory();
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + scrollY - TOP);
  });
})();
