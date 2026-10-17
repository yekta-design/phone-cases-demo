/* Placeholder art: every image in the game is generated SVG, no external assets. */
(function () {
  function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
  function hash(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svg = (inner, vb = "0 0 300 300") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

  const WALLS = [
    ["#ff9a8b", "#6a4cff", "#1b1464"], ["#13547a", "#80d0c7", "#0b2a3d"], ["#f6d365", "#fda085", "#7a2e5b"],
    ["#30cfd0", "#330867", "#120428"], ["#ff758c", "#ff7eb3", "#3a1c71"], ["#0f2027", "#2c5364", "#203a43"]];
  function wallpaper(i) {
    const w = WALLS[i % WALLS.length];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${w[0]}"/><stop offset=".55" stop-color="${w[1]}"/><stop offset="1" stop-color="${w[2]}"/></linearGradient></defs><rect width="400" height="860" fill="url(#wg)"/><circle cx="320" cy="180" r="160" fill="#fff" opacity=".08"/><circle cx="60" cy="640" r="220" fill="#000" opacity=".12"/><path d="M0 560 C120 500 260 640 400 560 L400 860 L0 860Z" fill="#000" opacity=".15"/></svg>`;
  }

  const ICONS = {
    messages: ["#34c759", "#30b14f", '<path d="M18 4C9.7 4 3 9.6 3 16.5c0 3.9 2.1 7.4 5.5 9.7L7 32l6.6-3.4c1.4.4 2.9.6 4.4.6 8.3 0 15-5.6 15-12.5S26.3 4 18 4z" fill="#fff"/>'],
    phone: ["#34c759", "#2aa84a", '<path d="M11 4l5 7-3 3c1.8 3.8 4.8 6.8 8.6 8.6l3-3 7 5-2 5c-.4 1-1.5 1.6-2.6 1.4C14 29 7 22 5 9.4 4.8 8.3 5.4 7.2 6.4 6.8z" fill="#fff"/>'],
    mail: ["#1e90ff", "#0a6fe0", '<rect x="4" y="8" width="28" height="20" rx="3" fill="#fff"/><path d="M5 10l13 10 13-10" stroke="#1e90ff" stroke-width="2.4" fill="none"/>'],
    photos: ["#ffffff", "#f2f2f2", '<g transform="translate(18 18)">' + ["#ff9500", "#ffcc00", "#34c759", "#5ac8fa", "#007aff", "#af52de", "#ff2d55", "#ff3b30"].map((c, i) => `<ellipse rx="5" ry="10" cy="-8" fill="${c}" opacity=".85" transform="rotate(${i * 45})"/>`).join("") + "</g>"],
    notes: ["#ffd60a", "#ffcc00", '<rect x="5" y="4" width="26" height="28" rx="4" fill="#fff"/><rect x="5" y="4" width="26" height="7" rx="3" fill="#ffd60a"/><path d="M10 17h16M10 22h16M10 27h10" stroke="#c7c7cc" stroke-width="1.6"/>'],
    calendar: ["#ffffff", "#f5f5f5", '<text x="18" y="12" font-size="7" text-anchor="middle" fill="#ff3b30" font-family="Helvetica" font-weight="700">SAT</text><text x="18" y="30" font-size="18" text-anchor="middle" fill="#111" font-family="Helvetica">17</text>'],
    maps: ["#e9f5e1", "#d4ecc6", '<path d="M0 24 L36 12 M12 0 L22 36" stroke="#fff" stroke-width="4"/><path d="M0 24 L36 12" stroke="#ffcc00" stroke-width="2"/><path d="M18 6c-4.4 0-8 3.4-8 7.7 0 5.6 8 14.3 8 14.3s8-8.7 8-14.3C26 9.4 22.4 6 18 6z" fill="#ff3b30"/><circle cx="18" cy="13.5" r="3" fill="#fff"/>'],
    health: ["#ffffff", "#f5f5f5", '<path d="M18 31S5 23 5 13.5C5 9.4 8.2 6 12 6c2.5 0 4.7 1.4 6 3.4C19.3 7.4 21.5 6 24 6c3.8 0 7 3.4 7 7.5C31 23 18 31 18 31z" fill="#ff2d55"/>'],
    contacts: ["#d1d1d6", "#b8b8be", '<circle cx="18" cy="13" r="6" fill="#fff"/><path d="M6 31c1-6.5 6-10 12-10s11 3.5 12 10z" fill="#fff"/>'],
    social: ["#f58529", "#dd2a7b", '<rect x="6" y="6" width="24" height="24" rx="7" stroke="#fff" stroke-width="2.6" fill="none"/><circle cx="18" cy="18" r="5.5" stroke="#fff" stroke-width="2.6" fill="none"/><circle cx="25" cy="11" r="1.8" fill="#fff"/>'],
    bank: ["#1d1d3b", "#4b2bb3", '<rect x="5" y="9" width="26" height="18" rx="3" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M5 15h26" stroke="#fff" stroke-width="3"/><rect x="9" y="20" width="8" height="3" rx="1" fill="#fff"/>'],
    camera: ["#8e8e93", "#636366", '<rect x="5" y="10" width="26" height="18" rx="4" fill="#2c2c2e"/><circle cx="18" cy="19" r="6" fill="#636366" stroke="#fff" stroke-width="1.5"/><rect x="13" y="7" width="10" height="4" rx="1.5" fill="#2c2c2e"/>'],
    clock: ["#000000", "#1c1c1e", '<circle cx="18" cy="18" r="13" fill="#fff"/><path d="M18 9v9l6 4" stroke="#000" stroke-width="2.2" fill="none" stroke-linecap="round"/>'],
    weather: ["#4aa3ff", "#1e6fd9", '<circle cx="14" cy="14" r="6" fill="#ffd60a"/><path d="M11 28h15a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0-2 8z" fill="#fff"/>'],
    settings: ["#8e8e93", "#6e6e73", '<circle cx="18" cy="18" r="11" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 3"/><circle cx="18" cy="18" r="5" fill="#fff"/>'],
    music: ["#fc3c44", "#d42a33", '<path d="M14 26V10l14-3v16" stroke="#fff" stroke-width="2.6" fill="none"/><circle cx="11" cy="26" r="3.5" fill="#fff"/><circle cx="25" cy="23" r="3.5" fill="#fff"/>'],
    case: ["#2b2d6e", "#0a84ff", '<circle cx="15" cy="15" r="8" fill="none" stroke="#fff" stroke-width="3"/><path d="M21 21l8 8" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'],
  };
  function icon(id) {
    const [a, b, inner] = ICONS[id] || ICONS.settings;
    return { bg: `linear-gradient(160deg,${a},${b})`, svg: `<svg viewBox="0 0 36 36">${inner}</svg>` };
  }

  const AVC = ["#ff6b6b", "#f7b267", "#4ecdc4", "#5c7cfa", "#b197fc", "#63e6be", "#ffa94d", "#e64980", "#20c997", "#748ffc"];
  function avatar(name, size) {
    const n = String(name || "?").replace(/[^\p{L}\p{N} ]/gu, "").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    const ini = parts.length ? (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase() : "#";
    const c = AVC[hash(name) % AVC.length];
    return `<div class="av" style="width:${size}px;height:${size}px;background:linear-gradient(160deg,${c},${c}bb);font-size:${Math.round(size * 0.4)}px">${esc(/^[+\d ]+$/.test(name) ? "#" : ini)}</div>`;
  }

  function person(x, y, s, c, r) { return `<g transform="translate(${x} ${y}) scale(${s})"><circle cy="-38" r="17" fill="${c}"/><path d="M-30 30 C-30 -6 30 -6 30 30Z" fill="${r}"/></g>`; }

  function photo(p, idx) {
    const r = rng(hash((p.kind || "") + (p.caption || "") + (p.seed || 0) + idx));
    const k = p.kind;
    const skin = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac"];
    const cloth = ["#3b5bdb", "#e03131", "#2f9e44", "#f08c00", "#862e9c", "#495057"];
    const pick = (a) => a[Math.floor(r() * a.length)];
    if (k === "screenshot") {
      let b = "";
      for (let i = 0; i < 6; i++) { const out = r() > 0.5; const w = 90 + r() * 90; b += `<rect x="${out ? 280 - w : 20}" y="${70 + i * 36}" width="${w}" height="26" rx="13" fill="${out ? "#0a84ff" : "#e5e5ea"}"/>`; }
      return svg(`<rect width="300" height="300" fill="#fff"/><rect width="300" height="54" fill="#f6f6f6"/><circle cx="150" cy="22" r="12" fill="#c7c7cc"/><rect x="120" y="38" width="60" height="7" rx="3" fill="#c7c7cc"/>${b}`);
    }
    if (k === "sticky") {
      const t = esc(p.sticky || "");
      const parts = t.split(" ");
      const l1 = parts[0] || "", l2 = parts.slice(1).join(" ");
      return svg(`<rect width="300" height="300" fill="#8d6e63"/><rect width="300" height="300" fill="#a1887f" opacity=".5"/><g transform="rotate(-4 150 150)"><rect x="45" y="50" width="210" height="200" fill="#ffeb3b"/><rect x="45" y="50" width="210" height="26" fill="#fdd835"/><text x="150" y="140" text-anchor="middle" font-family="Comic Sans MS,Marker Felt,cursive" font-size="34" fill="#1a237e">${l1}</text><text x="150" y="188" text-anchor="middle" font-family="Comic Sans MS,Marker Felt,cursive" font-size="25" fill="#1a237e">${l2}</text></g>`);
    }
    if (k === "badge") {
      const t = esc(p.badge || "");
      const [nm, role] = t.split(" – ");
      return svg(`<rect width="300" height="300" fill="#dfe6ee"/><rect y="200" width="300" height="100" fill="#c5d0dc"/>${person(150, 210, 2.1, pick(skin), "#37474f")}<path d="M125 150 L150 200 L175 150" stroke="#1565c0" stroke-width="5" fill="none"/><rect x="100" y="196" width="100" height="70" rx="6" fill="#fff" stroke="#90a4ae"/><rect x="100" y="196" width="100" height="16" rx="5" fill="#1565c0"/><text x="150" y="232" text-anchor="middle" font-family="Helvetica" font-size="12" font-weight="700" fill="#111">${nm || ""}</text><text x="150" y="250" text-anchor="middle" font-family="Helvetica" font-size="10" fill="#333">${role || ""}</text>`);
    }
    if (k === "vigil") {
      let c = "";
      for (let i = 0; i < 9; i++) { const x = 25 + i * 32 + r() * 8, y = 190 + r() * 40; c += `<rect x="${x - 4}" y="${y}" width="8" height="30" fill="#fff8e1"/><ellipse cx="${x}" cy="${y - 7}" rx="5" ry="9" fill="#ffb300"/><circle cx="${x}" cy="${y - 7}" r="18" fill="#ffca28" opacity=".18"/>`; }
      let f = ""; for (let i = 0; i < 4; i++) f += `<rect x="${40 + i * 62}" y="${95 + r() * 20}" width="44" height="56" fill="#eceff1"/><circle cx="${62 + i * 62}" cy="${118 + r() * 10}" r="10" fill="#90a4ae"/>`;
      return svg(`<rect width="300" height="300" fill="#0d1321"/>${f}${c}`);
    }
    if (k === "lights") {
      let l = ""; for (let j = 0; j < 4; j++) { let d = `M0 ${40 + j * 40}`; for (let x = 0; x <= 300; x += 30) d += ` Q${x + 15} ${70 + j * 40} ${x + 30} ${40 + j * 40}`; l += `<path d="${d}" stroke="#555" fill="none"/>`; for (let x = 10; x < 300; x += 22) l += `<circle cx="${x}" cy="${52 + j * 40 + Math.sin(x) * 6}" r="4" fill="#fff59d"/><circle cx="${x}" cy="${52 + j * 40 + Math.sin(x) * 6}" r="10" fill="#fff59d" opacity=".25"/>`; }
      let m = ""; for (let i = 0; i < 26; i++) m += `<circle cx="${r() * 300}" cy="${220 + r() * 80}" r="${6 + r() * 6}" fill="${r() > 0.5 ? "#ff9800" : "#ffc107"}"/>`;
      return svg(`<rect width="300" height="300" fill="#2b1a3a"/>${l}${m}`);
    }
    if (k === "window") {
      let s = ""; for (let i = 0; i < 18; i++) { const x = 200 + r() * 90, y = 210 + r() * 70; s += `<path d="M${x} ${y} l${6 + r() * 10} ${-4 + r() * 8} l${-4} ${8}z" fill="#cfe8ff" stroke="#fff" stroke-width=".8"/>`; }
      return svg(`<rect width="300" height="300" fill="#6d5d50"/><rect x="0" y="0" width="190" height="300" fill="#8a7a6b"/><text x="95" y="290" text-anchor="middle" font-family="Helvetica" font-size="13" fill="#3e2723">SHOP – INSIDE</text><rect x="190" y="0" width="110" height="300" fill="#4e4e52"/><text x="245" y="290" text-anchor="middle" font-family="Helvetica" font-size="13" fill="#ddd">ALLEY</text><rect x="150" y="50" width="80" height="140" fill="#9fb8c9" stroke="#3e2723" stroke-width="8"/><path d="M190 120 L160 70 M190 120 L222 80 M190 120 L170 180 M190 120 L215 170 M190 120 L155 125" stroke="#fff" stroke-width="2"/><rect x="140" y="190" width="100" height="10" fill="#5d4037"/>${s}`);
    }
    if (k === "phonehand") {
      const sc = p.screen || ["", ""];
      return svg(`<rect width="300" height="300" fill="#3e4a3d"/><rect y="200" width="300" height="100" fill="#2e3a2d"/>${person(70, 190, 1.8, pick(skin), "#1e88e5")}<g transform="rotate(-8 180 150)"><rect x="118" y="60" width="120" height="200" rx="16" fill="#1565c0"/><rect x="126" y="70" width="104" height="180" rx="10" fill="#fff"/><rect x="126" y="70" width="104" height="26" fill="#f2f2f7"/><text x="178" y="88" text-anchor="middle" font-family="Helvetica" font-size="12" font-weight="700" fill="#000">${esc(sc[0])}</text><rect x="140" y="${200}" width="84" height="38" rx="12" fill="#0a84ff"/><text x="182" y="215" text-anchor="middle" font-family="Helvetica" font-size="9" fill="#fff">${esc(sc[1].split(", ")[0] || "")},</text><text x="182" y="229" text-anchor="middle" font-family="Helvetica" font-size="9" fill="#fff">${esc(sc[1].split(", ")[1] || "")}</text></g><ellipse cx="160" cy="250" rx="34" ry="22" fill="${pick(skin)}"/>`);
    }
    if (k === "kiss") {
      return svg(`<rect width="300" height="300" fill="#2a1b12"/><rect y="200" width="300" height="100" fill="#4e342e"/>${[30, 80, 230, 270].map((x) => `<circle cx="${x}" cy="60" r="16" fill="#ffcc80" opacity=".5"/>`).join("")}<rect x="0" y="220" width="300" height="14" fill="#795548"/>${person(130, 205, 1.6, pick(skin), "#1b5e20")}${person(170, 205, 1.6, pick(skin), "#880e4f")}<rect width="300" height="300" fill="#000" opacity=".15"/>`);
    }
    if (k === "selfie") {
      const n = 3 + Math.floor(r() * 4); let g = "";
      for (let i = 0; i < n; i++) g += person(40 + i * (220 / (n - 1 || 1)), 230 + (i % 2) * 18, 1.3 + r() * 0.3, pick(skin), pick(cloth));
      return svg(`<rect width="300" height="300" fill="${pick(["#5c4d7d", "#3d405b", "#264653", "#6d597a"])}"/><circle cx="240" cy="50" r="30" fill="#ffd166" opacity=".3"/>${g}`);
    }
    const scenes = {
      sunset: () => `<rect width="300" height="300" fill="#ff8a65"/><rect width="300" height="150" fill="#ffb74d"/><circle cx="150" cy="170" r="50" fill="#fff3e0"/><rect y="180" width="300" height="120" fill="#5d4037" opacity=".85"/>`,
      food: () => `<rect width="300" height="300" fill="#d7ccc8"/><circle cx="150" cy="150" r="100" fill="#fff"/><circle cx="150" cy="150" r="70" fill="#ffcc80"/><circle cx="125" cy="135" r="14" fill="#e53935"/><circle cx="170" cy="165" r="12" fill="#43a047"/><circle cx="160" cy="125" r="9" fill="#fdd835"/>`,
      cat: () => `<rect width="300" height="300" fill="#b0bec5"/><ellipse cx="150" cy="210" rx="80" ry="55" fill="#ff9800"/><circle cx="150" cy="135" r="48" fill="#ff9800"/><path d="M110 105 L118 70 L135 95Z M190 105 L182 70 L165 95Z" fill="#ff9800"/><circle cx="133" cy="135" r="6" fill="#222"/><circle cx="167" cy="135" r="6" fill="#222"/>`,
      coffee: () => `<rect width="300" height="300" fill="#8d6e63"/><circle cx="150" cy="150" r="80" fill="#fff"/><circle cx="150" cy="150" r="62" fill="#6d4c41"/><path d="M150 120 C130 140 170 150 150 180" stroke="#efebe9" stroke-width="7" fill="none"/>`,
      street: () => `<rect width="300" height="300" fill="#90caf9"/>${[0, 60, 130, 200, 250].map((x, i) => `<rect x="${x}" y="${80 + (i % 3) * 30}" width="55" height="220" fill="${["#78909c", "#a1887f", "#8d6e63", "#607d8b", "#9e9e9e"][i]}"/>`).join("")}<rect y="260" width="300" height="40" fill="#424242"/>`,
      plant: () => `<rect width="300" height="300" fill="#f1f8e9"/><rect x="115" y="190" width="70" height="80" rx="8" fill="#a1887f"/>${[-50, -20, 10, 40].map((a) => `<ellipse cx="150" cy="140" rx="16" ry="55" fill="#66bb6a" transform="rotate(${a} 150 190)"/>`).join("")}`,
      beach: () => `<rect width="300" height="300" fill="#81d4fa"/><rect y="150" width="300" height="70" fill="#0288d1"/><rect y="215" width="300" height="85" fill="#ffe082"/><circle cx="240" cy="60" r="26" fill="#fff59d"/>`,
      dog: () => `<rect width="300" height="300" fill="#c5e1a5"/><ellipse cx="150" cy="220" rx="85" ry="50" fill="#8d6e63"/><circle cx="150" cy="140" r="50" fill="#a1887f"/><ellipse cx="105" cy="140" rx="15" ry="32" fill="#6d4c41"/><ellipse cx="195" cy="140" rx="15" ry="32" fill="#6d4c41"/><circle cx="135" cy="135" r="6" fill="#222"/><circle cx="165" cy="135" r="6" fill="#222"/><ellipse cx="150" cy="160" rx="10" ry="7" fill="#222"/>`,
    };
    const f = scenes[k] || (() => { const h = Math.floor(r() * 360); return `<rect width="300" height="300" fill="hsl(${h},35%,55%)"/><circle cx="${80 + r() * 140}" cy="${80 + r() * 60}" r="40" fill="hsl(${(h + 40) % 360},60%,75%)"/><path d="M0 220 Q150 ${150 + r() * 60} 300 220 V300 H0Z" fill="hsl(${(h + 180) % 360},30%,35%)"/>`; });
    return svg(f());
  }

  function map(seed, n) {
    const r = rng(seed);
    let roads = "";
    for (let i = 0; i < 4; i++) roads += `<path d="M${r() * 400} 0 L${r() * 400} 160" stroke="#fff" stroke-width="${3 + r() * 5}"/><path d="M0 ${r() * 160} L400 ${r() * 160}" stroke="#fff" stroke-width="${3 + r() * 5}"/>`;
    let pts = []; for (let i = 0; i < Math.max(1, n); i++) pts.push([40 + (320 / Math.max(1, n - 1 || 1)) * i + r() * 20, 30 + r() * 100]);
    if (n === 1) pts = [[200, 80]];
    const route = pts.length > 1 ? `<path d="M${pts.map((p) => p.join(" ")).join(" L")}" stroke="#0a84ff" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="1 0"/>` : "";
    const pins = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="11" fill="${i === pts.length - 1 ? "#ff3b30" : "#0a84ff"}" stroke="#fff" stroke-width="3"/><text x="${p[0]}" y="${p[1] + 4}" font-size="11" text-anchor="middle" fill="#fff" font-family="Helvetica" font-weight="700">${i + 1}</text>`).join("");
    return `<svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block"><rect width="400" height="160" fill="#e8eee4"/><path d="M0 120 Q100 90 200 130 T400 110 V160 H0Z" fill="#cde3f5"/><rect x="${r() * 300}" y="${r() * 100}" width="70" height="40" rx="8" fill="#cfe8c3"/>${roads}${route}${pins}</svg>`;
  }

  window.ART = { wallpaper, icon, avatar, photo, map, esc, hash };
})();
