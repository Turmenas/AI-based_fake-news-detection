// Fakeddit tipai: serverio raktas -> [pavadinimas, aprasas, antraste]
const TYPES = {
  "true": ["Real news", "Real stories and photos (r/nottheonion, r/upliftingnews, r/usnews)", "Reads like real news"],
  "satire/parody": ["Satire or parody", "Jokes written as news (r/TheOnion, r/satire)", "Reads like satire"],
  "false connection": ["False connection", "A real picture with a misleading title (r/misleadingthumbnails, r/pareidolia)", "Looks like a misleading caption"],
  "imposter content": ["Imposter content", "Titles written by bots (r/SubredditSimulator)", "Reads like a bot wrote it"],
  "manipulated content": ["Manipulated content", "Edited photos (r/psbattle_artwork)", "Reads like an edited-photo post"],
  "misleading content": ["Misleading content", "Propaganda and spin (r/propagandaposters, r/savedyouaclick)", "Reads like propaganda or spin"],
};
// po 4 paruostas lipnios juostos vietas kiekvienam kampui: [dx, dy cqw nuo kampo, kampas, ilgis]
const TAPES = {
  tl: [[0, 0, -42, 17], [1.5, -.4, -30, 15], [-.4, 1.8, -55, 15], [4, -.6, -7, 13]],
  tr: [[0, 0, 42, 17], [-1.5, -.4, 30, 15], [.4, 1.8, 55, 15], [-4, -.6, 7, 13]],
  bl: [[0, 0, 42, 17], [1.5, .4, 30, 15], [-.4, -1.8, 55, 15], [4, .6, 7, 13]],
  br: [[0, 0, -42, 17], [-1.5, .4, -30, 15], [.4, -1.8, -55, 15], [-4, .6, -7, 13]],
};
const CORNER = { tl: [0, 0], tr: [100, 0], bl: [0, 100], br: [100, 100] };
const DATE = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const PHONE = matchMedia("(max-width: 760px)").matches;  // ponytail: parenkama krovimo metu; perejus 760 px riba reikia perkrauti
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = p => (p * 100 >= 99.95 ? "99.9" : p * 100 < 0.05 ? "<0.1" : (p * 100).toFixed(1));


class Press {
  assets() { return fetch("/api/assets").then(r => r.json()); }
  headline(text) { return this.#post("/api/headline", { text }); }
  photo(image) { return this.#post("/api/photo", { image }); }

  async #post(url, body) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  }
}


class Scene {
  constructor(assets) {
    const place = pick(Object.values(assets.scenes));
    if (place) document.getElementById("scene").style.backgroundImage = `url("${pick(place.photos)}")`;
    const cover = pick(assets.covers);
    if (cover) {
      document.getElementById("cover-photo").style.backgroundImage = `url("${cover.url}")`;
      document.getElementById("cover-credit").textContent = cover.credit && `Photo: ${cover.credit}`;
    }
    this.audio = place && place.sounds.length ? Object.assign(new Audio(pick(place.sounds)), { loop: true, preload: "none" }) : null;  // garsas is tos pacios vietos kaip nuotrauka; preload none: keli MB siunciami tik kai pradeda groti
    this.flips = assets.sfx;
    this.muted = false;
    for (const ev of ["pointerdown", "pointerup", "keydown"]) addEventListener(ev, () => this.#start());  // garsas leidziamas tik po gesto: pelei tai pointerdown, liecimui tik pointerup
  }

  flip() {
    if (!this.ctx || this.muted || !this.flips.length) return;
    const a = this.turn = Object.assign(new Audio(pick(this.flips)), { preservesPitch: false });  // nauja kopija kiekvienam vertimui, kad greiti vertimai nenukirstu vienas kito; greitesnis = ir auksciau, kaip tikras popierius
    this.#route(a, 3500, .35);  // tylesnis, be astriu aukstuju dazniu
    a.play().catch(() => {});
  }

  pace(speed) {  // iprastas vertimas pereina knyga per ~0.4 s (2.5 plocio/s) = normalus greitis; 0.5-2x ribos, kad garsas neiskreiptu
    if (this.turn) this.turn.playbackRate += (Math.min(2, Math.max(.5, speed / 2.5)) - this.turn.playbackRate) * .3;  // .3 suglodina truksmingus peles judesius
  }

  #start() {
    if (this.ctx?.state === "running" || (!this.audio && !this.flips.length)) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = new GainNode(this.ctx, { gain: this.muted ? 0 : 1 });
      this.master.connect(this.ctx.destination);
      if (this.audio) this.#route(this.audio, 1800, 0).gain.setTargetAtTime(.25, this.ctx.currentTime, 1);  // fonas prislopintas, ~70 % buvusio .35 garsumo, ijungiamas per kelias sekundes
    }
    this.ctx.resume();  // liecimo pointerdown sukuria sustabdyta konteksta, pointerup ji paleidzia
    this.audio?.play().catch(() => {});
  }

  #route(el, hz, vol) {  // elementas -> zemu dazniu filtras (prislopina) -> garsumas -> bendras jungiklis
    const gain = new GainNode(this.ctx, { gain: vol });
    this.ctx.createMediaElementSource(el).connect(new BiquadFilterNode(this.ctx, { type: "lowpass", frequency: hz })).connect(gain).connect(this.master);
    return gain;
  }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
    return this.muted;
  }
}


class Issue {
  text = "";
  headline = { state: "empty" };  // empty, pending, done, error
  photo = { state: "empty" };

  verdict() {
    const h = this.headline, p = this.photo;
    const tint = v => `rgba(${v > 0 ? "216,30,30" : "29,95,168"},${(Math.min(Math.abs(v) / 3, 1) * .42).toFixed(2)})`;
    let head = `<div class="vhead"><span class="sub">The headline</span></div>`;
    if (h.state === "empty") head += `<div class="big wait">?</div><div class="big-cap">waiting for your headline</div>`;
    if (h.state === "pending") head += `<div class="big wait">…</div><div class="big-cap">going to press</div>`;
    if (h.state === "error") head += `<p>The press is not answering. Is the server still running?</p>`;
    if (h.state === "done") {
      const fake = h.p_fake >= .5, tone = fake ? "var(--fake)" : "var(--real)";
      head = `<div class="vhead"><span class="sub">The headline</span><span class="stamp" style="color:${tone}">${fake ? "LIKELY FAKE" : "LIKELY REAL"}</span></div>
        <div class="big" style="color:${tone}">${pct(h.p_fake)}<small>%</small></div><div class="big-cap">chance the headline is fake</div>
        <div><div class="meter"><i style="left:${(h.p_fake * 100).toFixed(1)}%"></i></div><div class="ends"><span>REAL</span><span>FAKE</span></div></div>
        <div class="quote">“${h.words.map(([w, v]) => `<span style="background:${tint(v)}">${esc(w)}</span>`).join(" ")}”</div>`;
    }

    let pic = `<div class="vphoto"><div class="thumb none"></div><div><span class="sub">The photo</span><p class="small">No photo glued in. Glue one on page 2 to check it too.</p></div></div>`;
    if (p.state !== "empty") {
      let body = p.state === "pending" ? `<div class="mid wait">…</div><div class="big-cap">developing</div>`
        : p.state === "error" ? `<p class="small">This file could not be read as a photo.</p>` : "";
      let stamp = "";
      if (p.state === "done") {
        const tone = p.ai ? "var(--fake)" : "var(--real)";
        stamp = `<span class="stamp" style="color:${tone}">${p.ai ? "LOOKS AI-MADE" : "LOOKS REAL"}</span>`;
        body = `<div class="mid" style="color:${tone}">${Math.round(p.p_ai * 100)}<small>%</small></div><div class="big-cap">sure it is AI-generated</div>`;
      }
      pic = `<div class="vphoto"><div class="thumb"><img src="${p.url}" alt="The glued-in photo"></div>
        <div><div class="vhead"><span class="sub">The photo</span>${stamp}</div>${body}</div></div>`;
    }

    let together = "";
    if (h.state === "done" && p.state === "done") {
      const fake = h.p_fake >= .5;
      together = `<p class="together">${fake && p.ai ? "Both the headline and the photo look fake."
        : p.ai ? "Careful: the headline reads like real news, but the photo looks AI-generated. Find where the photo came from before sharing (p. 8)."
        : fake ? "The photo looks real, but the headline reads like fake news. A real photo can be put next to a false story."
        : "Both look real. That is still not proof, so check the source before sharing (p. 8)."}</p>`;
    }
    return `<div class="vblock">${head}</div>${pic}${together}
      <p class="small foot">Two models, two verdicts: DistilBERT reads the headline (right on 89.1% of 59,319 test posts), CLIP checks the photo. Details on pages 4 to 6.</p>`;
  }

  words() {
    const h = this.headline, top = `<h2>What gave it away</h2>`;
    if (h.state !== "done") return top + `<p>Each word of your headline gets a bar here, once there is a verdict on page 3.</p>`;
    const max = Math.max(...h.words.map(w => Math.abs(w[1])), 1e-9);
    const bars = [...h.words].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 7).map(([w, v]) => {
      const half = (Math.abs(v) / max * 50).toFixed(1);
      return `<div class="w">${esc(w)}</div><div class="track"><b style="${v > 0 ? `left:50%;width:${half}%;background:var(--fake)` : `right:50%;width:${half}%;background:var(--real)`}"></b></div>`;
    }).join("");
    return top + `<p class="deck">Each word was taken out in turn and the headline checked again. The longer the bar, the more that word moved the verdict.</p>
      <div class="key"><span style="color:var(--real)">← TOWARD REAL</span><span style="color:var(--fake)">TOWARD FAKE →</span></div>
      <div class="words">${bars}</div>
      <p class="small foot">This explains the model, not the facts. A word like “study” is a style clue it learned from Reddit, not proof of anything.</p>`;
  }

  types() {
    const h = this.headline;
    if (h.state !== "done") return `<h2>Six kinds of fake</h2>
      <p>Satire, false connection, imposter content, manipulated content, misleading content, or real news. The chances for your headline appear here.</p>`;
    const top = Object.keys(h.types).reduce((a, b) => (h.types[a] >= h.types[b] ? a : b));
    return `<h2>${TYPES[top][2]}</h2>
      <div class="types">${Object.entries(TYPES).map(([k, [n, desc]]) => `<div class="type${k === top ? " top" : ""}"><span class="n">${n}</span><span class="v">${pct(h.types[k])}%</span><span class="d">${desc}</span><span class="t"><b style="width:${(h.types[k] * 100).toFixed(1)}%"></b></span></div>`).join("")}</div>
      <p class="small foot">Fakeddit labels whole subreddits, not single posts. “Satire” means the headline is written like r/TheOnion, not that a fact-checker reviewed it.</p>`;
  }

  photoPage() {
    const p = this.photo;
    const table = `<table class="acc"><tr><th>Photo check, tested on</th><th>Right</th></tr>
      <tr><td>NYT photos vs Midjourney (same as training)</td><td>99.6%</td></tr>
      <tr><td>BBC photos vs Stable Diffusion XL</td><td>82.0%</td></tr>
      <tr><td>CNN photos vs Stable Diffusion XL</td><td>75.0%</td></tr></table>`;
    if (p.state !== "done") return `<h2>${p.state === "pending" ? "Developing…" : "No photo glued in"}</h2>
      <div class="pair"><div class="shot none"></div><p>Glue the photo that came with the headline onto page 2, and this page shows whether it looks AI-generated.</p></div>${table}`;
    const tone = p.ai ? "var(--fake)" : "var(--real)";
    return `<h2>${p.ai ? "Looks AI-generated" : "Looks like a real photo"}</h2>
      <div class="pair"><div class="shot"><img src="${p.url}" alt="The glued-in photo"></div><div>
        <div class="mid" style="color:${tone}">${Math.round(p.p_ai * 100)}<small>%</small></div><div class="big-cap">sure it is AI-generated</div></div></div>
      <div class="gauge"><b style="width:${Math.round(p.p_ai * 100)}%;background:${tone}"></b><span class="cut" style="left:${p.cut * 100}%"><span>cut-off ${p.cut}</span></span></div>${table}
      <p class="small foot">No combined score: the two models learned from different data, so both verdicts sit side by side on page 3.</p>`;
  }
}


class Magazine {
  constructor(el, issue) {
    this.issue = issue;
    document.getElementById("cover-date").textContent = DATE;
    for (const page of el.querySelectorAll("[data-sec]")) this.#fill(page, page.querySelector(".pg").innerHTML);  // antraste ir folio visiems vidiniams puslapiams
    this.render(false);
    this.book = new St.PageFlip(el, { width: 400, height: PHONE ? 760 : 525, size: "stretch", minWidth: 280, maxWidth: 1000, minHeight: 368, maxHeight: 1313,
      showCover: true, maxShadowOpacity: .45, flippingTime: REDUCE ? 1 : 900, mobileScrollSupport: false, disableFlipByClick: true });  // 400x525 = TIME proporcijos; telefone aukstesnis, kad tilptu didesnis tekstas
    this.book.loadFromHTML(el.querySelectorAll(".page"));
    this.book.on("changeState", e => {  // garsas vos puslapis pakyla: tempiant tai user_fold, klavisais ir kampu flipping
      if (e.data === "user_fold" || (e.data === "flipping" && this.state !== "user_fold")) this.onFlip?.();  // greitas braukimas eina user_fold -> flipping, antras garsas nereikalingas
      this.state = e.data;
    });
    let last = null;
    addEventListener("pointermove", e => {  // tempimo greitis knygos plociais per sekunde, kad telefone ir kompiuteryje jaustusi vienodai
      if (this.state === "user_fold" && last) this.onPace?.(Math.hypot(e.clientX - last.x, e.clientY - last.y) / el.clientWidth / Math.max(e.timeStamp - last.t, 1) * 1000);
      last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    });
    addEventListener("keydown", e => {
      if (e.target.tagName === "TEXTAREA") return;  // rasant rodykles juda tekste, ne puslapiuose
      if (e.key === "ArrowRight") this.book.flipNext();
      if (e.key === "ArrowLeft") this.book.flipPrev();
    });
  }

  render(inked) {
    const pages = { p3: this.issue.verdict(), p4: this.issue.words(), p5: this.issue.types(), p6: this.issue.photoPage() };
    for (const [id, html] of Object.entries(pages)) this.#fill(document.getElementById(id), html);
    const p3 = document.getElementById("p3");
    p3.classList.remove("inked");
    if (inked && !REDUCE) { void p3.offsetWidth; p3.classList.add("inked"); }  // offsetWidth perleidzia animacija is naujo
  }

  #fill(page, html) {  // TIME stiliaus skyriaus antraste virsuje, puslapio numeris ir data apacioje
    const [a, b, sub] = page.dataset.sec.split("|"), n = page.id.slice(1);
    const head = `<div class="sec"><span class="sn">${a}<b>${b}</b></span>${sub ? `<span class="ss">${sub}</span>` : ""}</div>`;
    const folio = page.classList.contains("left") ? `<div class="folio"><span class="n">${n}</span><b>FACT</b><span>${DATE}</span></div>`
      : `<div class="folio"><b>FACT</b><span>${DATE}</span><span class="n">${n}</span></div>`;
    page.querySelector(".pg").innerHTML = head + html + folio;
  }
}


class Submission {
  #tickets = { headline: 0, photo: 0 };
  #timer;

  constructor(press, issue, magazine) {
    Object.assign(this, { press, issue, magazine });
    this.write = document.getElementById("write");
    this.slot = document.getElementById("slot");
    this.file = document.getElementById("file");
    this.write.addEventListener("input", () => {
      this.write.textContent = this.write.value;  // puslapio kopija vartant turi rodyti parasyta teksta
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => this.sendText(), 1200);
    });
    this.write.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this.sendText(); } });
    this.slot.addEventListener("click", () => this.file.click());
    this.file.addEventListener("change", () => { this.sendPhoto(this.file.files[0]); this.file.value = ""; });
    this.slot.addEventListener("dragover", e => { e.preventDefault(); this.slot.classList.add("over"); });
    this.slot.addEventListener("dragleave", () => this.slot.classList.remove("over"));
    this.slot.addEventListener("drop", e => { e.preventDefault(); this.slot.classList.remove("over"); this.sendPhoto(e.dataTransfer.files[0]); });
    for (const el of [this.write, this.slot]) for (const ev of ["mousedown", "touchstart"]) el.addEventListener(ev, e => e.stopPropagation());  // kitaip zurnalas pradeda versti puslapi
  }

  sendText() {
    clearTimeout(this.#timer);
    const text = this.write.value.trim();
    if (text === this.issue.text) return;
    this.issue.text = text;
    if (text) return this.#send("headline", () => this.press.headline(text));
    this.#tickets.headline++;  // istrintas tekstas: laukiantis atsakymas nebeturi nieko uzrasyti
    this.issue.headline = { state: "empty" };
    this.magazine.render(false);
  }

  sendPhoto(f) {
    if (!f || !f.type.startsWith("image/")) return;
    if (this.issue.photo.url) URL.revokeObjectURL(this.issue.photo.url);
    const url = URL.createObjectURL(f);
    this.#glue(url);
    this.#send("photo", async () => this.press.photo(await this.#dataUrl(f)), { url });
  }

  async #send(kind, request, extra = {}) {
    const ticket = ++this.#tickets[kind];  // senesnis atsakymas neturi uzrasyti naujesnio
    this.issue[kind] = { state: "pending", ...extra };
    this.magazine.render(false);
    let next;
    try { next = { state: "done", ...extra, ...(await request()) }; } catch { next = { state: "error", ...extra }; }
    if (ticket !== this.#tickets[kind]) return;
    this.issue[kind] = next;
    this.magazine.render(true);
  }

  #glue(url) {
    const tapes = Object.keys(TAPES).map(c => {
      const [dx, dy, r, len] = pick(TAPES[c]), [cx, cy] = CORNER[c];
      return `<span class="tape" style="left:calc(${cx}% + ${dx}cqw);top:calc(${cy}% + ${dy}cqw);width:${len}cqw;--r:${r}deg"></span>`;
    }).join("");
    this.slot.innerHTML = `<span class="ph" style="--tilt:${(Math.random() * 3.6 - 1.8).toFixed(2)}deg"><img src="${url}" alt="The glued-in photo">${tapes}</span>`;
    this.slot.classList.add("glued");
    this.slot.setAttribute("aria-label", "Photo glued in. Click to swap it, or drop another image here");
  }

  #dataUrl(f) {
    return new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = fail; r.readAsDataURL(f); });
  }
}


(async () => {
  const press = new Press(), issue = new Issue();
  const magazine = new Magazine(document.getElementById("book"), issue);
  new Submission(press, issue, magazine);
  const assets = await press.assets().catch(() => ({ scenes: {}, covers: [], sfx: [] }));  // be fono zurnalas vis tiek veikia
  const scene = new Scene(assets);
  magazine.onFlip = () => scene.flip();
  magazine.onPace = speed => scene.pace(speed);
  const sound = document.getElementById("sound");  // "?" pastaba yra narsykles popover: atidaro, uzdaro su Esc ir paspaudus salia pati
  sound.hidden = !scene.audio && !scene.flips.length;  // be jokiu garsu jungiklio nereikia
  sound.addEventListener("click", () => { sound.textContent = scene.toggle() ? "Sound: off" : "Sound: on"; });
})();
