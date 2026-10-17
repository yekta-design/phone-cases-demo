/* Found Phone: a static, no-backend found-phone mystery player for CASES (built by game/build.py). */
(function () {
  "use strict";
  const { esc, avatar, icon, photo, map, wallpaper } = window.ART;
  const CASES = window.CASES || [];
  const $screen = document.getElementById("screen");
  const APP_LABEL = { messages: "Messages", phone: "Phone", mail: "Email", photos: "Photos", notes: "Notes", calendar: "Calendar",
    maps: "Maps", health: "Health", contacts: "Contacts", social: "Social", bank: "Bank", camera: "Camera", clock: "Clock",
    weather: "Weather", settings: "Settings", music: "Music" };
  const DECOR = ["camera", "clock", "weather", "settings", "music"];
  const ACKS = ["Okay.", "Got it.", "Right…", "That matches.", "Keep going.", "Okay, that's useful.", "I see.", "Good. Next one."];

  const EMO = { infidelity: "💔", "family secret": "🗝️", "scam fraud": "💸", "crime murder": "🕯️", "missing person": "🔦", "political surveillance": "🛰️", "stalker creep": "👁️" };
  const emblem = (c, size) => `<div class="emb" style="width:100%;height:100%">${wallpaper(c.wallpaper)}<span style="font-size:${size}px">${EMO[c.category] || "📱"}</span></div>`;
  let S = { scr: "picker", c: null, nav: [], sheet: false, onbI: 0, pin: "", tab: {}, q: "", vm: null, zoom: false, info: false };
  let P = null; // progress of current case

  // ------------------------------------------------------------------ progress
  const key = (id) => "foundphone:" + id;
  function loadP(id) { try { return JSON.parse(localStorage.getItem(key(id))) || null; } catch (e) { return null; } }
  function saveP() { if (S.c && P) try { localStorage.setItem(key(S.c.id), JSON.stringify(P)); } catch (e) {} }
  function freshP() { return { qi: 0, hints: {}, wrong: {}, reveals: [], log: [], start: Date.now(), end: null, unlocked: false, solved: false, vote: null, onbDone: false }; }

  // ------------------------------------------------------------------ answer matching
  function norm(s) {
    s = String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    s = s.replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"');
    s = s.replace(/\b0?(\d{1,2})[:.](\d{2})\b/g, (m, h, mm) => " t" + parseInt(h, 10) + mm + " ");
    s = s.replace(/(\d),(?=\d{3}\b)/g, "$1");
    s = s.replace(/kb\$|[€£₹₦₩$]/g, " ");
    s = s.replace(/&/g, " and ");
    s = s.replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
    s = s.replace(/^(the|a|an|his|her|their|my|at|in|on|to|it was|its|it s)\s+/, "");
    s = s.replace(/^(the|a|an)\s+/, "");
    return s;
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  function correct(input, answers) {
    const x = norm(input); if (!x) return false;
    return answers.some((a) => { const y = norm(a); if (!y) return false; if (x === y) return true;
      if (/\d/.test(y) || /\d/.test(x)) return false;
      const d = lev(x, y); return (y.length >= 5 && d <= 1) || (y.length >= 9 && d <= 2); });
  }

  // ------------------------------------------------------------------ helpers
  const h = (strs, ...vals) => strs.reduce((a, s, i) => a + s + (i < vals.length ? vals[i] : ""), "");
  function statusBar(light) {
    const b = S.c ? S.c.battery : 80;
    return `<div class="status ${light ? "light" : "dark"}"><span>9:41</span><span>●●●● <span class="bat"><i style="width:${Math.max(10, b) * 0.2}px"></i></span></span></div>`;
  }
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; $screen.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  function D() { return S.c.data; }
  function cards(app) { return (D().cards[app] || []).map((c) => `<div class="gcard">${esc(c.text)}</div>`).join(""); }
  function md(s) { return esc(s).replace(/~~(.+?)~~/g, "<s>$1</s>"); }
  function photosFlat() {
    const out = [];
    D().photos.forEach((p, pi) => { for (let i = 0; i < (p.count || 1); i++) out.push({ p, pi, i }); });
    return out;
  }
  function photoTile(p, i, tag) { return `<div style="width:100%;height:100%">${photo(p, i)}</div>`; }

  // ------------------------------------------------------------------ render root
  function render() {
    const scr = S.scr;
    let html = "";
    if (scr === "picker") html = picker();
    else if (scr === "onb") html = onboarding();
    else if (scr === "lock") html = lock();
    else if (scr === "home") html = home();
    else if (scr === "app") html = appView();
    else if (scr === "end") html = endScreen();
    $screen.innerHTML = `<div id="main" style="position:absolute;inset:0;display:flex;flex-direction:column">${html}</div><div id="ovl"></div>`;
    renderOverlay();
    const inp = $screen.querySelector("[data-autofocus]"); if (inp && window.innerWidth > 700) inp.focus();
  }
  function renderOverlay() {
    const o = document.getElementById("ovl"); if (!o) return;
    if (!(S.scr === "home" || S.scr === "app") || !P) { o.innerHTML = ""; return; }
    o.innerHTML = S.sheet ? sheet() : pill();
    if (S.sheet) { const m = o.querySelector(".msgs"); if (m) m.scrollTop = m.scrollHeight; const i = o.querySelector("#ans"); if (i && window.innerWidth > 700) i.focus(); }
  }

  // ------------------------------------------------------------------ picker
  function picker() {
    const rows = CASES.map((c, i) => {
      const p = loadP(c.id);
      const st = p && p.solved ? `<span class="chip ok">Solved ✓</span>` : p && p.qi > 0 ? `<span class="chip prog">${p.qi}/${c.questions.length}</span>` : "";
      const mature = /murder|missing/.test(c.category) || c.care ? `<span class="chip warn">mature</span>` : "";
      return `<button class="case-card" data-act="pick" data-i="${i}"><div class="thumb">${emblem(c, 30)}</div><div><h2>${esc(c.title)}</h2><p>${esc(c.tagline)}</p><div class="chips"><span class="chip">${esc(c.category)}</span><span class="chip">${esc(c.difficulty)}</span><span class="chip">${c.questions.length} questions · ~${c.minutes} min</span>${mature}${st}</div></div></button>`;
    }).join("");
    return `<div class="picker pad-top scroll" style="flex:1">${statusBar(true)}<h1>Case Files</h1><div class="sub">You get a stranger's phone. Unlock it, dig through it, and answer the client's questions. Every answer is somewhere on the phone.</div>${rows}<div class="foot">${CASES.length} cases · all people, places and events are fictional.<br>Progress is saved on this device.</div></div>`;
  }

  // ------------------------------------------------------------------ onboarding
  function onboarding() {
    const c = S.c, cards = [{ intro: true }].concat(c.onboarding), i = S.onbI, card = cards[i];
    const dots = cards.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("");
    const body = card.intro
      ? `<div class="role">Your role</div><div class="text" style="font-size:21px;font-weight:600">${esc(c.role[0].toUpperCase() + c.role.slice(1))}</div><div class="text" style="margin-top:12px;color:#c9cde0;font-size:16px">${esc(c.goal)}</div><div class="text" style="margin-top:12px;color:#9aa0b4;font-size:14px">Phone of ${esc(c.owner.name)}${c.owner.occupation ? ", " + esc(c.owner.occupation) : ""}${c.owner.city ? " · " + esc(c.owner.city) : ""}</div>`
      : `<div class="who">${avatar(card.speaker, 44)}<div><b>${esc(card.speaker)}</b><div style="font-size:12px;color:#9aa0b4">Client</div></div></div><div class="text">${esc(card.text)}</div>`;
    return `<div class="onb" style="flex:1;display:flex;flex-direction:column;position:relative">${statusBar(true)}<button class="back" data-act="home-cases">‹ Cases</button><button class="skip" data-act="onb-skip">Skip</button>
      <div style="flex:1;display:flex;align-items:center;justify-content:center"><div style="width:180px;height:180px;border-radius:40px;overflow:hidden;opacity:.9;box-shadow:0 20px 60px #000">${emblem(c, 84)}</div></div>
      <div class="card">${body}</div><div class="dots">${dots}</div>
      <button class="btn" data-act="onb-next">${i < cards.length - 1 ? "Next" : "Take the phone"}</button><div style="height:30px"></div></div>`;
  }

  // ------------------------------------------------------------------ lock
  function lock() {
    const c = S.c;
    const notes = D().lock.map((n) => `<div class="notif"><div class="ic" style="background:#34c759">${icon("messages").svg}</div><div style="flex:1"><b>${esc(n.from)}</b> <small>${esc(n.time || "")}</small><div class="t">${esc(n.text)}</div></div></div>`).join("");
    let ctl;
    if (!c.passcode) ctl = `<button class="swipe" data-act="unlock" style="color:#fff">Tap to open · the phone is already unlocked</button>`;
    else if (/^\d+$/.test(c.passcode)) {
      const n = c.passcode.length;
      const keys = ["1", "2 ABC", "3 DEF", "4 GHI", "5 JKL", "6 MNO", "7 PQRS", "8 TUV", "9 WXYZ", "", "0", "⌫"];
      ctl = `<div style="margin-top:auto">Enter Passcode</div><div class="pins" id="pins">${Array.from({ length: n }, (_, j) => `<i class="${j < S.pin.length ? "f" : ""}"></i>`).join("")}</div>
        <div class="keypad">${keys.map((k) => k === "" ? "<span></span>" : `<button class="key" data-act="key" data-k="${k[0] === "⌫" ? "del" : k[0]}" ${k === "⌫" ? 'style="background:none;font-size:22px"' : ""}>${k.split(" ")[0]}${k.split(" ")[1] ? `<small>${k.split(" ")[1]}</small>` : ""}</button>`).join("")}</div>
        <button class="lnk" data-act="code-help">Forgot? Ask ${esc(c.client)}</button><div style="height:24px"></div>`;
    } else {
      ctl = `<div style="margin-top:auto">Enter Password</div><input class="txtpass" id="tp" placeholder="Password" autocomplete="off" autocapitalize="none" data-autofocus><button class="btn" style="width:250px;margin:12px auto 0;padding:11px" data-act="tp">Unlock</button><button class="lnk" data-act="code-help">Forgot? Ask ${esc(c.client)}</button><div style="height:60px"></div>`;
    }
    return `<div class="lock" style="flex:1;display:flex;flex-direction:column;position:relative"><div class="wall">${wallpaper(c.wallpaper)}</div>${statusBar(true)}
      <div class="date" style="margin-top:58px">${esc(c.owner.first)}'s phone</div><div class="clock" style="margin-top:4px">9:41</div>${notes}${ctl}</div>`;
  }
  function tryUnlock(code) {
    if (String(code).trim().toLowerCase() === String(S.c.passcode).toLowerCase()) { unlocked(); return; }
    const el = $screen.querySelector("#pins") || $screen.querySelector("#tp"); if (el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
    S.pin = ""; setTimeout(() => { if (S.scr === "lock") { const p = $screen.querySelector("#pins"); if (p) p.querySelectorAll("i").forEach((i) => i.classList.remove("f")); } }, 350);
  }
  function unlocked() {
    P.unlocked = true;
    if (!P.log.length) { P.log.push({ w: "c", t: "You're in. I'll ask you things one at a time. Answer with a word or two." }); P.log.push({ w: "c", t: S.c.questions[0].q }); }
    saveP(); S.scr = "home"; S.nav = []; render();
  }

  // ------------------------------------------------------------------ home
  function badgeFor(app) {
    const d = D();
    if (app === "messages") { const n = d.messages.reduce((a, t) => a + t.chunks.filter((c) => c.unread).length, 0) + d.lock.length; return n; }
    if (app === "phone") return d.calls.filter((c) => c.dir === "missed").length;
    return 0;
  }
  function appIcon(id, label) {
    const ic = icon(id), b = badgeFor(id);
    return `<button class="app" data-act="open" data-app="${id}"><div class="icon" style="background:${ic.bg}">${ic.svg}${b ? `<span class="badge">${b}</span>` : ""}</div><span>${esc(label || APP_LABEL[id])}</span></button>`;
  }
  function homeApps() {
    const apps = S.c.apps.slice();
    const dockPref = ["phone", "messages", "mail", "photos"];
    const dock = dockPref.filter((a) => apps.includes(a));
    while (dock.length < 4) dock.push(DECOR[dock.length]);
    const grid = apps.filter((a) => !dock.includes(a)).concat(DECOR.filter((d) => !dock.includes(d)));
    return { dock, grid };
  }
  function home() {
    const { dock, grid } = homeApps();
    return `<div class="home" style="flex:1;position:relative"><div class="wall" style="position:absolute;inset:0;z-index:0">${wallpaper(S.c.wallpaper)}</div>${statusBar(true)}
      <div style="position:relative;z-index:1"><div class="grid">${grid.map((a) => appIcon(a)).join("")}</div></div>
      <div class="dock" style="z-index:1">${dock.map((a) => appIcon(a)).join("")}</div>
      <button data-act="home-cases" style="position:absolute;top:44px;left:16px;z-index:2;color:#fff;font-size:13px;opacity:.85">‹ Cases</button></div>`;
  }

  // ------------------------------------------------------------------ app shell
  function top() { return S.nav[S.nav.length - 1]; }
  function navBar(title, opts = {}) {
    const back = S.nav.length > 1 ? (opts.backLabel || "Back") : "Home";
    return `<div class="nav">${statusBar(opts.light)}<button class="bk" data-act="back">‹ ${esc(back)}</button><h3>${opts.big ? "" : esc(title)}</h3><span class="r">${opts.right || ""}</span>${opts.big ? `<div class="big">${esc(title)}</div>` : ""}${opts.extra || ""}</div>`;
  }
  function appView() {
    const v = top(), fn = VIEWS[v.app] || VIEWS.decor;
    const r = fn(v);
    return `<div class="appv ${r.dark ? "dark" : ""} ${r.cls || ""}" style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">${r.nav}<div class="scroll" id="sc" style="padding-bottom:110px">${r.body}</div>${r.over || ""}</div>`;
  }
  function searchBox(ph) { return `<input class="search" id="q" placeholder="${esc(ph)}" value="${esc(S.q)}" autocomplete="off">`; }
  function tabs(id, list) {
    const cur = S.tab[id] || list[0][0];
    return `<div class="tabs">${list.map(([k, l]) => `<button class="${k === cur ? "on" : ""}" data-act="tab" data-id="${id}" data-k="${k}">${esc(l)}</button>`).join("")}</div>`;
  }
  const curTab = (id, def) => S.tab[id] || def;
  const match = (q, ...xs) => !q || xs.some((x) => String(x || "").toLowerCase().includes(q.toLowerCase()));

  const VIEWS = {};
  // ---------------- messages
  VIEWS.messages = function (v) {
    const d = D();
    if (v.view === "thread") {
      const t = d.messages.find((x) => x.id === v.id);
      let body = t.deleted ? `<div class="delbanner">Recently Deleted${t.delnote ? " · " + esc(t.delnote) : ""} · this conversation will be removed permanently in 29 days</div>` : "";
      if (t.note) body += `<div class="tnote">${esc(t.note)}</div>`;
      body += `<div class="chat col">`;
      t.chunks.forEach((ch) => {
        body += `<div class="when ${ch.unread ? "unr" : ""}">${esc(ch.when || "")}${ch.unread ? " · Unread" : ""}</div>`;
        ch.bubbles.forEach((b) => {
          if (b.from) body += `<div class="bfrom ${b.dir}">${esc(b.from)}</div>`;
          if (b.del) {  // a deleted-flagged message, recovered: shown struck through and labelled
            body += `<div class="bub ${b.dir} del">${esc(b.text)}</div><div class="bstat ${b.dir} delt">🗑 Deleted message${b.time ? " · " + esc(b.time) : ""}</div>`;
            if (b.status && !/deleted/i.test(b.status)) body += `<div class="bstat ${b.dir}">${esc(b.status)}</div>`;
            return;
          }
          if (b.img) {
            const kind = b.photo || "screenshot";
            const ph = d.photos.find((p) => p.kind === kind) || { kind };
            const n = typeof b.img === "number" ? b.img : 1;
            body += `<div class="bub img ${b.dir} ${n > 1 ? "multi" : ""}" style="align-self:${b.dir === "out" ? "flex-end" : "flex-start"}">${Array.from({ length: n }, (_, i) => `<button class="ph" data-act="viewph" data-pi="${d.photos.indexOf(ph)}" data-i="${i}">${photo(ph, i)}</button>`).join("")}</div>`;
            if (b.text) body += `<div class="bub ${b.dir}">${esc(b.text)}</div>`;
          } else body += `<div class="bub ${b.dir}">${esc(b.text)}</div>`;
          if (b.time) body += `<div class="btime ${b.dir}">${esc(b.time)}</div>`;
          if (b.status) body += `<div class="bstat ${b.dir}">${esc(b.status)}</div>`;
        });
      });
      body += `</div>`;
      return { nav: navBar(t.name + (t.sub ? ` (${t.sub})` : ""), { backLabel: t.deleted ? "Deleted" : "Messages" }), body };
    }
    const list = (ts) => ts.map((t) => {
      const ch = t.chunks[t.chunks.length - 1] || { bubbles: [] }; const lb = ch.bubbles[ch.bubbles.length - 1] || {};
      const unread = t.chunks.some((c) => c.unread);
      const prev = lb.img ? "📷 Image" : lb.del ? "🗑 Deleted message" : lb.text || "";
      return `<button class="row ${unread ? "unread" : ""}" data-act="push" data-app="messages" data-view="thread" data-id="${t.id}">${avatar(t.name, 46)}<div class="main"><div class="t1"><span>${esc(t.name)}</span><small>${esc(ch.when || "")}</small></div><div class="t3">${esc(prev)}</div></div></button>`;
    }).join("");
    const q = S.q;
    const visible = d.messages.filter((t) => !t.deleted && match(q, t.name, ...t.chunks.flatMap((c) => c.bubbles.map((b) => b.text))));
    const ordered = visible.filter((t) => !t.filler).sort((x, y) => (y.seq || 0) - (x.seq || 0)).concat(visible.filter((t) => t.filler));
    const del = d.messages.filter((t) => t.deleted);
    if (v.view === "deleted") return { nav: navBar("Recently Deleted", { backLabel: "Messages" }), body: del.length ? list(del) : `<div class="empty">No deleted conversations.</div>` };
    const body = cards("messages") + list(ordered) +
      `<button class="row" data-act="push" data-app="messages" data-view="deleted"><div class="main"><div class="t1"><span>🗑 Recently Deleted</span><small>${del.length} ›</small></div></div></button>`;
    return { nav: navBar("Messages", { big: true, extra: searchBox("Search") }), body };
  };

  // ---------------- mail
  VIEWS.mail = function (v) {
    const d = D();
    if (v.view === "mail") {
      const m = d.mail[v.id];
      const body = `<div class="mailv"><h2>${esc(m.subject)}</h2><div class="meta">${avatar(m.from, 38)}<div style="flex:1"><b style="color:#000">${esc(m.from)}</b><div>${m.to ? "To: " + esc(m.to) : "To: me"}</div></div><span>${esc(m.date || "")}</span></div><div class="body">${md(m.body)}</div></div>`;
      return { nav: navBar("", { backLabel: "Mailbox" }), body };
    }
    const hasSent = d.mail.some((m) => m.folder === "sent");
    const folder = curTab("mail", "inbox");
    const items = d.mail.map((m, i) => ({ m, i })).filter(({ m }) => (m.folder || "inbox") === folder && match(S.q, m.from, m.subject, m.body, m.to));
    const ordered = items.filter((x) => !x.m.filler).concat(items.filter((x) => x.m.filler));
    const body = cards("mail") + (ordered.map(({ m, i }) => `<button class="row" data-act="push" data-app="mail" data-view="mail" data-id="${i}"><div class="main"><div class="t1"><span>${esc(folder === "sent" ? "To: " + (m.to || "") : m.from)}</span><small>${esc(m.date || "")}</small></div><div class="t2" style="color:#000">${esc(m.subject)}</div><div class="t3">${esc(m.body.replace(/\n+/g, " "))}</div></div></button>`).join("") || `<div class="empty">No mail.</div>`);
    return { nav: navBar(folder === "sent" ? "Sent" : "Inbox", { big: true, extra: (hasSent ? tabs("mail", [["inbox", "Inbox"], ["sent", "Sent"]]) : "") + searchBox("Search mail") }), body };
  };

  // ---------------- photos
  VIEWS.photos = function (v) {
    const d = D(), flat = photosFlat();
    if (v.view === "album") {
      const items = flat.filter((x) => v.id === "deleted" ? x.p.deleted : v.id === "screens" ? x.p.kind === "screenshot" && !x.p.deleted : x.p.album === v.id && !x.p.deleted);
      const name = v.id === "deleted" ? "Recently Deleted" : v.id === "screens" ? "Screenshots" : v.id;
      return { nav: navBar(name, { backLabel: "Albums" }), body: (v.id === "deleted" ? `<div class="delbanner">Photos are kept here for 30 days before being permanently deleted.</div>` : "") + grid(items) };
    }
    const tab = curTab("photos", "lib");
    let body = cards("photos");
    if (tab === "lib") body += grid(flat.filter((x) => !x.p.deleted)) + `<div class="empty" style="padding:16px">${flat.filter((x) => !x.p.deleted).length} photos</div>`;
    else {
      const albums = [];
      const named = [...new Set(d.photos.filter((p) => p.album).map((p) => p.album))];
      named.forEach((a) => albums.push([a, a, flat.filter((x) => x.p.album === a)]));
      const sc = flat.filter((x) => x.p.kind === "screenshot" && !x.p.deleted); if (sc.length) albums.push(["screens", "Screenshots", sc]);
      albums.push(["deleted", "Recently Deleted", flat.filter((x) => x.p.deleted)]);
      body += `<div class="sect">My Albums</div><div class="albums">${albums.map(([id, nm, it]) => `<button data-act="push" data-app="photos" data-view="album" data-id="${esc(id)}"><div class="ac" style="background:#eee">${it[0] ? photo(it[0].p, it[0].i) : ""}</div>${esc(nm)}<small>${it.length}</small></button>`).join("")}</div>`;
    }
    return { nav: navBar(tab === "lib" ? "Library" : "Albums", { big: true, extra: tabs("photos", [["lib", "Library"], ["alb", "Albums"]]) }), body };
    function grid(items) {
      return `<div class="pgrid">${items.map((x) => `<button data-act="viewph" data-pi="${x.pi}" data-i="${x.i}">${photo(x.p, x.i)}</button>`).join("")}</div>` + (items.length ? "" : `<div class="empty">No photos</div>`);
    }
  };
  function viewer() {
    const vw = S.viewer; if (!vw) return "";
    const p = D().photos[vw.pi]; if (!p) return "";
    const n = p.count || 1;
    const info = p.exif || p.date || "No details";
    return `<div class="viewer">${statusBar(true)}<div class="vnav"><button data-act="closeph">‹ Back</button><span style="font-size:14px">${n > 1 ? `${vw.i + 1} of ${n}` : esc(p.date || "")}</span><button data-act="info" title="Info" style="font-size:20px">ⓘ</button></div>
      <div class="img"><div class="zoomable ${S.zoom ? "z" : ""}" data-act="zoom">${photo(p, vw.i)}</div></div>
      <div class="bar">${n > 1 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><button data-act="phnav" data-d="-1" style="color:#0a84ff">‹ Prev</button><button data-act="phnav" data-d="1" style="color:#0a84ff">Next ›</button></div>` : ""}${p.caption ? esc(p.caption) : ""}${S.info ? `<div class="exif"><div><span>Details</span>${esc(info)}</div>${p.deleted ? `<div><span>Status</span>Recently Deleted</div>` : ""}${p.album ? `<div><span>Album</span>${esc(p.album)}</div>` : ""}</div>` : `<div style="color:#8e8e93;font-size:12px;margin-top:6px">Tap ⓘ for photo info · tap the photo to zoom</div>`}</div></div>`;
  }

  // ---------------- notes
  VIEWS.notes = function (v) {
    const d = D();
    if (v.view === "note") {
      const n = d.notes[v.id];
      return { cls: "notesv", nav: navBar("", { backLabel: "Notes" }), body: `<div class="note"><h2>${esc(n.title)}</h2><div class="m">${esc(n.date || "")}${n.meta ? " · " + esc(n.meta) : ""}</div>${md(n.body)}</div>` };
    }
    const items = d.notes.map((n, i) => ({ n, i })).filter(({ n }) => match(S.q, n.title, n.body));
    const body = cards("notes") + items.map(({ n, i }) => `<button class="row" data-act="push" data-app="notes" data-view="note" data-id="${i}"><div class="main"><div class="t1"><span>${esc(n.title)}</span></div><div class="t2"><b style="color:#555;font-weight:500">${esc(n.date || "")}</b> ${esc(n.body.replace(/~~/g, "").replace(/\n+/g, " "))}</div></div></button>`).join("");
    return { nav: navBar("Notes", { big: true, extra: searchBox("Search") }), body };
  };

  // ---------------- calendar
  VIEWS.calendar = function (v) {
    const d = D();
    if (v.view === "ev") {
      const e = d.calendar[v.id];
      const kv = (k, x) => x ? `<div class="kv"><span>${k}</span>${esc(x)}</div>` : "";
      return { nav: navBar("Event Details", { backLabel: "Calendar" }), body: `<div style="padding:16px 16px 8px"><h2 style="font-size:24px;${e.status ? "text-decoration:line-through;color:#8a8a8e" : ""}">${esc(e.title)}</h2></div>${kv("Date", e.date)}${kv("Time", e.time)}${kv("Repeat", e.repeat)}${kv("Status", e.status)}${kv("Notes", e.notes)}` };
    }
    const body = cards("calendar") + (d.calendar.map((e, i) => `<button class="ev ${e.status ? "cx" : ""}" data-act="push" data-app="calendar" data-view="ev" data-id="${i}"><div class="bar"></div><div class="d">${esc(e.date)}<br>${esc(e.time || "all-day")}</div><div style="flex:1"><div class="tt">${esc(e.title)}</div>${e.repeat ? `<div style="font-size:13px;color:#8a8a8e">↻ ${esc(e.repeat)}</div>` : ""}${e.status ? `<div style="font-size:13px;color:#ff3b30">${esc(e.status)}</div>` : ""}${e.notes ? `<div style="font-size:13px;color:#8a8a8e">📝 Notes</div>` : ""}</div></button>`).join("") || `<div class="empty">No events.</div>`);
    return { nav: navBar("Calendar", { big: true }), body };
  };

  // ---------------- maps
  VIEWS.maps = function () {
    const d = D();
    const kinds = [...new Set(d.maps.map((m) => m.kind))];
    const lab = { timeline: "Timeline", recent: "Recents", places: "Places" };
    const tab = curTab("maps", kinds[0] || "timeline");
    const items = d.maps.map((m, i) => ({ m, i })).filter(({ m }) => m.kind === tab);
    const body = cards("maps") + items.map(({ m, i }) => `<div class="mcard"><div class="map">${map(i + 7 + (S.c.wallpaper * 13), m.stops.length)}</div><div class="hd">${esc(lab[m.kind] || "")} · ${esc(m.date)}</div>${m.stops.map((s, j) => `<div class="stop"><span class="dot" style="${j === m.stops.length - 1 && m.stops.length > 1 ? "background:#ff3b30" : ""}"></span><span class="tm">${esc(s.time || "")}</span><span style="flex:1">${esc(s.place)}</span></div>`).join("")}${m.note ? `<div class="nt">${esc(m.note)}</div>` : ""}</div>`).join("");
    return { cls: "", nav: navBar("Maps", { big: true, extra: kinds.length > 1 ? tabs("maps", kinds.map((k) => [k, lab[k] || k])) : "" }), body: body || `<div class="empty">Nothing here.</div>` };
  };

  // ---------------- health
  VIEWS.health = function () {
    const d = D(), ic = { steps: "👣", sleep: "🛏", meds: "💊", heart: "❤️" };
    const body = cards("health") + d.health.map((x) => `<div class="hcard"><h4>${ic[x.kind] || "•"} ${esc(x.title)} <span style="margin-left:auto;color:#8e8e93;font-weight:400;font-size:13px">${esc(x.date)}</span></h4>${x.rows.map((r) => `<div class="hr"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join("")}${x.note ? `<div style="color:#8e8e93;font-size:13px;margin-top:6px">${esc(x.note)}</div>` : ""}</div>`).join("");
    return { dark: true, nav: navBar("Summary", { big: true }), body };
  };

  // ---------------- phone
  VIEWS.phone = function () {
    const d = D();
    const hasVm = d.voicemails.length > 0;
    const tab = curTab("phone", "rec");
    let body = cards("phone");
    if (tab === "rec") {
      body += d.calls.map((c, i) => {
        const open = S.vm === "c" + i;
        const dirTxt = { missed: "Missed call", in: "Incoming call", out: "Outgoing call" }[c.dir];
        return `<button class="row" data-act="expand" data-k="c${i}" style="flex-wrap:wrap"><div style="width:16px;color:#8a8a8e">${c.dir === "out" ? "↗" : c.dir === "in" ? "↙" : ""}</div><div class="main"><div class="t1"><span class="${c.dir === "missed" ? "missed" : ""}">${esc(c.name)}</span><small>${esc(c.date)} ${esc(c.time)}</small></div><div class="t2">${esc(c.via || "mobile")}</div>${open ? `<div class="trans">${esc(dirTxt)} · ${esc(c.date)} at ${esc(c.time)}${c.dur ? `<br>Duration: ${esc(c.dur)}` : c.dir === "missed" ? "<br>Not answered" : ""}${c.number ? `<br>${esc(c.number)}` : ""}${c.note ? `<br><i>${esc(c.note)}</i>` : ""}</div>` : ""}</div></button>`;
      }).join("") || `<div class="empty">No recent calls.</div>`;
    } else {
      body += d.voicemails.map((m, i) => {
        const on = S.vm === "v" + i;
        return `<div class="vm"><div class="t1" style="display:flex;justify-content:space-between;font-weight:600">${esc(m.from)}<small style="color:#8a8a8e;font-weight:400">${esc(m.date)} ${esc(m.time)}</small></div><div class="play"><button class="pb" data-act="expand" data-k="v${i}">${on ? "❚❚" : "▶"}</button><div class="wave ${on ? "on" : ""}">${Array.from({ length: 32 }, (_, j) => `<i style="height:${6 + ((j * 7) % 17)}px;animation-delay:${(j % 5) * 0.1}s"></i>`).join("")}</div><small style="color:#8a8a8e">${esc(m.dur)}</small></div>${on ? `<div class="trans"><b style="font-size:12px;color:#8a8a8e">Transcription</b><br>“${esc(m.text)}”</div>` : ""}</div>`;
      }).join("");
    }
    return { nav: navBar(tab === "rec" ? "Recents" : "Voicemail", { big: true, extra: hasVm ? tabs("phone", [["rec", "Recents"], ["vm", "Voicemail"]]) : "" }), body };
  };

  // ---------------- contacts
  VIEWS.contacts = function (v) {
    const d = D();
    if (v.view === "c") {
      const c = d.contacts[v.id];
      const pic = c.photo === "handbag" ? `<div class="av" style="width:110px;height:110px;background:#f3e9e4"><svg viewBox="0 0 60 60" width="70"><path d="M18 24c0-9 24-9 24 0" stroke="#7a1c1c" stroke-width="4" fill="none"/><rect x="10" y="24" width="40" height="28" rx="6" fill="#d62828"/><rect x="26" y="30" width="8" height="5" rx="1" fill="#f6bd60"/></svg></div>` : avatar(c.name, 110);
      return { nav: navBar("", { backLabel: "Contacts" }), body: `<div class="cardme">${pic}<h2>${esc(c.name)}</h2>${c.me ? `<span class="chip" style="background:#e5e5ea;color:#333">My Card</span>` : ""}</div>${c.phone ? `<div class="kv"><span>mobile</span><span style="color:#0a84ff;font-size:16px;display:inline">${esc(c.phone)}</span></div>` : ""}${c.fields.map((f) => `<div class="kv"><span>${esc(f[0])}</span>${esc(f[1])}</div>`).join("")}${c.note ? `<div class="kv"><span>Notes</span>${esc(c.note)}</div>` : ""}${c.pinned ? `<div class="kv"><span>Pinned</span>📌 Pinned contact</div>` : ""}` };
    }
    const items = d.contacts.map((c, i) => ({ c, i })).filter(({ c }) => match(S.q, c.name, c.note));
    const me = items.filter((x) => x.c.me), pinned = items.filter((x) => x.c.pinned), rest = items.filter((x) => !x.c.me && !x.c.pinned);
    const row = ({ c, i }) => `<button class="row" data-act="push" data-app="contacts" data-view="c" data-id="${i}">${avatar(c.name, 40)}<div class="main"><div class="t1"><span>${esc(c.name)}</span></div>${c.me ? `<div class="t2">My Card</div>` : c.note ? `<div class="t2">${esc(c.note)}</div>` : ""}</div></button>`;
    const body = cards("contacts") + me.map(row).join("") + (pinned.length ? `<div class="sect">Pinned</div>` + pinned.map(row).join("") : "") + `<div class="sect">All contacts</div>` + rest.map(row).join("");
    return { nav: navBar("Contacts", { big: true, extra: searchBox("Search") }), body };
  };

  // ---------------- social
  VIEWS.social = function () {
    const d = D();
    const hasDm = d.social.some((s) => s.kind === "dm");
    const tab = curTab("social", "feed");
    const img = (n) => n ? `<div class="pi" style="display:grid;grid-template-columns:repeat(${Math.min(n, 2)},1fr);gap:2px">${Array.from({ length: n }, (_, i) => `<div>${photo({ kind: "screenshot" }, i)}</div>`).join("")}</div>` : "";
    const one = (s) => {
      if (s.kind === "story") return `<div class="post"><div class="ph">${avatar(s.author, 34)}<div><b>${esc(s.handle || s.author)}</b> <span style="color:#8e8e93;font-size:12px">Story · ${esc(s.date)}</span></div></div><div class="story">${esc(s.text)}</div>${s.meta ? `<div class="mt">${esc(s.meta)}</div>` : ""}</div>`;
      if (s.kind === "profile") return `<div class="post"><div class="ph">${avatar(s.author, 44)}<div><b>${esc(s.handle || s.author)}</b><div style="color:#8e8e93;font-size:12px">About this account</div></div></div><div class="gcard" style="margin:0">${esc(s.text)}<br>${esc(s.meta || "")}</div></div>`;
      if (s.kind === "follow") return `<div class="post"><div class="ph">${avatar(s.author, 40)}<div style="flex:1"><b>${esc(s.handle)}</b><div style="color:#8e8e93;font-size:12px">${esc(s.author)}${s.meta ? " · " + esc(s.meta) : ""}</div></div><span class="chip" style="background:#262626">Following</span></div><div class="mt">${esc(s.text)}</div></div>`;
      if (s.kind === "dm") return `<div class="post"><div class="ph">${avatar(s.me ? s.to : s.author, 40)}<div><b>${esc(s.me ? s.to : s.handle || s.author)}</b><div style="color:#8e8e93;font-size:12px">${esc(s.date)}</div></div></div><div class="col">${s.images ? `<div style="align-self:${s.me ? "flex-end" : "flex-start"};width:70%">${img(s.images)}</div>` : ""}${s.text ? `<div class="bub ${s.me ? "out" : "in"}" style="${s.me ? "" : "background:#262626;color:#fff"}">${esc(s.me && s.images ? "Sent " + s.images + " photos: " + s.text : s.text)}</div>` : ""}${s.me ? `<div class="bstat">Sent from this account · ${esc(s.date)}</div>` : ""}</div></div>`;
      return `<div class="post"><div class="ph">${avatar(s.author, 34)}<div><b>${esc(s.author)}</b> <span style="color:#8e8e93;font-size:12px">${esc(s.handle || "")}</span></div></div>${img(s.images)}<div class="tx">${esc(s.text)}</div><div class="mt">${esc(s.date)}${s.meta ? " · " + esc(s.meta) : ""}</div></div>`;
    };
    const items = d.social.filter((s) => tab === "dm" ? s.kind === "dm" : s.kind !== "dm");
    const body = cards("social") + (items.map(one).join("") || `<div class="empty">Nothing here.</div>`);
    return { dark: true, nav: navBar(tab === "dm" ? "Direct messages" : "Social", { big: true, light: true, extra: hasDm ? tabs("social", [["feed", "Feed & profile"], ["dm", "Messages"]]) : "" }), body };
  };

  // ---------------- bank
  VIEWS.bank = function () {
    const d = D();
    const sec = d.bank.filter((b) => b.kind === "security");
    const tx = d.bank.filter((b) => b.kind !== "security" && match(S.q, b.party, b.ref, b.amount, b.date));
    const real = tx.filter((b) => !b.filler).concat(tx.filter((b) => b.filler));
    const bal = (window.ART.hash(S.c.id) % 9000 + 400).toLocaleString("en-US") + ".00";
    const row = (b) => { const pos = /^\+/.test(b.amount); return `<div class="row"><div class="txic" style="background:${pos ? "#34c759" : "#5856d6"}">${esc((b.party || "?").replace(/[^A-Za-z]/g, "")[0] || "•")}</div><div class="main"><div class="t1"><span>${esc(b.party)}</span></div><div class="t2">${esc(b.date)}${b.ref ? " · " + esc(b.ref) : ""}</div></div><span class="amt ${pos ? "pos" : ""}">${esc(b.amount)}</span></div>`; };
    const body = `<div class="bal"><small>Main account · ${esc(S.c.owner.name)}</small><b>${esc(S.c.currency)}${bal}</b></div>` + cards("bank") +
      (sec.length ? `<div class="sect">Security</div><div class="card-l">${sec.map((b) => `<div class="row"><div class="txic" style="background:#ff9500">!</div><div class="main"><div class="t1"><span>${esc(b.party)}</span></div><div class="t2">${esc(b.date)} · ${esc(b.ref || "")}</div></div></div>`).join("")}</div>` : "") +
      `<div class="sect">Transactions</div><div class="card-l">${real.map(row).join("") || `<div class="empty">No transactions.</div>`}</div>`;
    return { cls: "bankv", nav: navBar("Bank", { big: true, extra: searchBox("Search transactions") }), body };
  };

  VIEWS.decor = function (v) { return { nav: navBar(APP_LABEL[v.app] || ""), body: `<div class="empty">Nothing useful here. Try another app.</div>` }; };

  // ------------------------------------------------------------------ question sheet
  function pill() {
    const c = S.c, q = c.questions[P.qi];
    if (!q) return "";
    return `<button class="qpill ${S.scr === "app" ? "low" : ""}" data-act="sheet">${avatar(c.client, 36)}<div style="flex:1;min-width:0"><div class="n">${esc(c.client)} · question ${P.qi + 1} of ${c.questions.length}</div><div class="q">${esc(q.q)}</div></div><span style="font-size:20px">💬</span></button>`;
  }
  function sheet() {
    const c = S.c, q = c.questions[P.qi];
    const pct = Math.round((P.qi / c.questions.length) * 100);
    const msgs = P.log.map((m) => m.w === "me" ? `<div class="bub out">${esc(m.t)}</div>` : m.w === "hint" ? `<div class="hintb">💡 ${esc(m.t)}</div>` : m.w === "rev" ? `<div class="rev">🔓 ${esc(m.t)}</div>` : `<div class="bub in">${esc(m.t)}</div>`).join("") + (S.typing ? `<div class="typing"><i></i><i></i><i></i></div>` : "");
    const hintsUsed = q ? (P.hints[q.id] || 0) : 0;
    return `<div class="sheet" role="dialog"><div class="sh">${avatar(c.client, 34)}<b>${esc(c.client)}<small>Question ${Math.min(P.qi + 1, c.questions.length)} of ${c.questions.length}</small></b><button data-act="sheet-close" style="color:#0a84ff;font-size:15px">Close ▾</button></div><div class="prog"><i style="width:${pct}%"></i></div>
      <div class="msgs col">${msgs}</div>
      <form class="ansbar" data-act="answer"><button type="button" class="hb" data-act="hint">${hintsUsed ? "Reveal" : "Hint"}</button><input id="ans" placeholder="Your answer…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="send"><button class="send" type="submit" aria-label="Send">➤</button></form></div>`;
  }
  function submitAnswer(val) {
    const c = S.c, q = c.questions[P.qi]; if (!q || S.typing) return;
    val = val.trim(); if (!val) return;
    P.log.push({ w: "me", t: val });
    if (correct(val, q.answers)) advance(false);
    else {
      P.wrong[q.id] = (P.wrong[q.id] || 0) + 1;
      const n = P.wrong[q.id];
      P.log.push({ w: "c", t: n >= 3 && !P.hints[q.id] ? "That's not it. Want a hint? Tap Hint." : ["Hmm, that doesn't match what I'm seeing.", "No… look again.", "I don't think so. Check the phone again."][n % 3] });
      saveP(); renderOverlay();
      const i = document.getElementById("ans"); if (i) { i.classList.remove("wrong"); void i.offsetWidth; i.classList.add("wrong"); }
    }
  }
  function advance(revealed) {
    const c = S.c, q = c.questions[P.qi];
    if (revealed) { P.reveals.push(q.id); P.log.push({ w: "rev", t: "Answer: " + q.answers[0] }); }
    P.qi += 1; saveP();
    S.typing = true; renderOverlay();
    setTimeout(() => {
      S.typing = false;
      const nq = c.questions[P.qi];
      if (nq) { P.log.push({ w: "c", t: ACKS[P.qi % ACKS.length] + " " + nq.q }); saveP(); renderOverlay(); }
      else { P.solved = true; P.end = Date.now(); P.log.push({ w: "c", t: "That's everything. Thank you." }); saveP(); renderOverlay(); setTimeout(() => { S.sheet = false; S.scr = "end"; render(); }, 1100); }
    }, 750);
  }
  function hint() {
    const q = S.c.questions[P.qi]; if (!q || S.typing) return;
    if (!P.hints[q.id]) { P.hints[q.id] = 1; P.log.push({ w: "hint", t: q.hint || "Look through the apps again." }); saveP(); renderOverlay(); return; }
    if (confirm("Reveal the answer to this question?")) advance(true);
  }

  // ------------------------------------------------------------------ end
  function endScreen() {
    const c = S.c;
    const secs = Math.round(((P.end || Date.now()) - P.start) / 1000);
    const hints = Object.keys(P.hints).length;
    return `<div class="end scroll pad-top" style="flex:1">${statusBar(true)}<div style="padding:10px 20px 0;color:#34c759;font-weight:700;letter-spacing:1px;font-size:12px">CASE CLOSED</div><h1>${esc(c.title)}</h1>
      <div class="box"><h4>${esc(c.client)}</h4>${esc(c.ending)}</div>
      <div class="box"><h4>The twist</h4>${esc(c.twist)}</div>
      <div class="box"><h4>The open question</h4><b>${esc(c.central.question)}</b>${c.central.why_gray ? `<div style="margin-top:8px;color:#c9cde0">${esc(c.central.why_gray)}</div>` : ""}<div class="vote">${["Guilty as sin", "It's complicated"].map((v) => `<button class="${P.vote === v ? "on" : ""}" data-act="vote" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div></div>
      <div class="stats"><div><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</b>time</div><div><b>${hints}</b>hints</div><div><b>${P.reveals.length}</b>reveals</div></div>
      ${c.care ? `<div class="box care">This story touches on a death. If it brings anything up for you, please talk to someone: in the US call or text 988, in the UK call Samaritans on 116 123, or find a local helpline at findahelpline.com.</div>` : ""}
      <div style="height:16px"></div><button class="btn" data-act="home-cases">More cases</button><button class="btn ghost" data-act="replay">Replay this case</button><div style="height:40px"></div></div>`;
  }

  // ------------------------------------------------------------------ actions
  function openCase(i) {
    S.c = CASES[i]; P = loadP(S.c.id) || freshP(); S.onbI = 0; S.pin = ""; S.nav = []; S.sheet = false; S.tab = {}; S.q = "";
    if (P.solved) S.scr = "end"; else if (P.unlocked) S.scr = "home"; else if (P.onbDone) S.scr = "lock"; else S.scr = "onb";
    render();
  }
  function act(el, ev) {
    const a = el.dataset.act;
    switch (a) {
      case "pick": openCase(+el.dataset.i); break;
      case "home-cases": S.scr = "picker"; S.c = null; P = null; S.sheet = false; render(); break;
      case "onb-next": if (S.onbI < S.c.onboarding.length) { S.onbI++; render(); } else { P.onbDone = true; saveP(); S.scr = "lock"; render(); } break;
      case "onb-skip": P.onbDone = true; saveP(); S.scr = "lock"; render(); break;
      case "unlock": unlocked(); break;
      case "key": {
        const k = el.dataset.k;
        if (k === "del") S.pin = S.pin.slice(0, -1); else if (S.pin.length < S.c.passcode.length) S.pin += k;
        const pins = $screen.querySelectorAll("#pins i"); pins.forEach((p, j) => p.classList.toggle("f", j < S.pin.length));
        if (S.pin.length === S.c.passcode.length) setTimeout(() => tryUnlock(S.pin), 120);
        break;
      }
      case "tp": tryUnlock(($screen.querySelector("#tp") || {}).value || ""); break;
      case "code-help": { const line = S.c.onboarding.find((o) => /code|passcode/i.test(o.text)); toast(line ? line.text.length > 70 ? "“" + line.text.slice(0, 68) + "…”" : "“" + line.text + "”" : "No code needed."); if (line && line.text.length > 70) setTimeout(() => alert(S.c.client + ": " + line.text), 50); break; }
      case "open": {
        const app = el.dataset.app;
        if (DECOR.includes(app) && !S.c.apps.includes(app)) { toast("Nothing useful in " + APP_LABEL[app] + "."); break; }
        S.nav = [{ app, view: "list" }]; S.q = ""; S.scr = "app"; S.vm = null; render(); break;
      }
      case "push": S.nav.push({ app: el.dataset.app, view: el.dataset.view, id: isNaN(+el.dataset.id) ? el.dataset.id : +el.dataset.id }); render(); document.getElementById("sc").scrollTop = 0; if (el.dataset.view === "thread") { const sc = document.getElementById("sc"); sc.scrollTop = sc.scrollHeight; } break;
      case "back": if (S.nav.length > 1) { S.nav.pop(); render(); } else { S.nav = []; S.scr = "home"; S.q = ""; render(); } break;
      case "tab": S.tab[el.dataset.id] = el.dataset.k; render(); break;
      case "expand": S.vm = S.vm === el.dataset.k ? null : el.dataset.k; { const sc = document.getElementById("sc"); const y = sc ? sc.scrollTop : 0; render(); const s2 = document.getElementById("sc"); if (s2) s2.scrollTop = y; } break;
      case "viewph": S.viewer = { pi: +el.dataset.pi, i: +el.dataset.i }; S.zoom = false; S.info = false; showViewer(); break;
      case "closeph": S.viewer = null; const v = document.querySelector(".viewer"); if (v) v.remove(); break;
      case "info": S.info = !S.info; showViewer(); break;
      case "zoom": S.zoom = !S.zoom; showViewer(); break;
      case "phnav": { const p = D().photos[S.viewer.pi]; S.viewer.i = (S.viewer.i + +el.dataset.d + p.count) % p.count; showViewer(); break; }
      case "sheet": S.sheet = true; renderOverlay(); break;
      case "sheet-close": S.sheet = false; renderOverlay(); break;
      case "hint": hint(); break;
      case "vote": P.vote = el.dataset.v; saveP(); render(); break;
      case "replay": localStorage.removeItem(key(S.c.id)); openCase(CASES.indexOf(S.c)); break;
    }
  }
  function showViewer() {
    let v = document.querySelector(".viewer"); const html = viewer();
    const tmp = document.createElement("div"); tmp.innerHTML = html;
    if (v) v.replaceWith(tmp.firstChild); else document.getElementById("main").appendChild(tmp.firstChild);
  }
  $screen.addEventListener("click", (ev) => { const el = ev.target.closest("[data-act]"); if (!el || el.tagName === "FORM") return; ev.preventDefault(); act(el, ev); });
  $screen.addEventListener("submit", (ev) => { ev.preventDefault(); const i = document.getElementById("ans"); if (i) { const v = i.value; i.value = ""; submitAnswer(v); } });
  $screen.addEventListener("input", (ev) => {
    if (ev.target.id === "q") { S.q = ev.target.value; const pos = ev.target.selectionStart; render(); const q = document.getElementById("q"); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }
  });
  $screen.addEventListener("keydown", (ev) => { if (ev.target.id === "tp" && ev.key === "Enter") tryUnlock(ev.target.value); });
  document.addEventListener("keydown", (ev) => {
    if (S.scr === "lock" && S.c && S.c.passcode && /^\d+$/.test(S.c.passcode) && /^[0-9]$/.test(ev.key)) { const b = $screen.querySelector(`[data-k="${ev.key}"]`); if (b) b.click(); }
    if (S.scr === "lock" && ev.key === "Backspace") { const b = $screen.querySelector(`[data-k="del"]`); if (b) b.click(); }
  });
  // deep link: #case=<id>
  const m = location.hash.match(/case=([\w-]+)/);
  render();
  if (m) { const i = CASES.findIndex((c) => c.id === m[1] || c.id.startsWith(m[1])); if (i >= 0) openCase(i); }
  window.__FP = { S: () => S, P: () => P, correct, norm, CASES };
})();
