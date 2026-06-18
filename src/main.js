// RBrowser API test bench — @rbrowser/main.
//
// Goal: the NATIVE header panel (the real RBrowser toolbar) AND full access to
// the renderer instance (channelManager / referenceManager / highlightManager /
// locusManager …) AT THE SAME TIME.
//
// mountBrowser() renders the full React browser (native header) and returns a
// handle { renderer, unmount } — the renderer instance is available
// synchronously, so the side panel below drives the public API directly.
import {
  mountBrowser,
  VERSION,
  historyManager,
  favouriteManager,
} from "@rbrowser/main";

const $ = (id) => document.getElementById(id);
$("ver").textContent = VERSION;
console.log("[example] @rbrowser/main VERSION =", VERSION);

// ── Mount the full browser (native header) and grab the renderer handle ──────
const { renderer, unmount } = mountBrowser("rbrowser");
console.log("[example] mountBrowser() → { renderer, unmount }", renderer);

// renderer is available synchronously — initialise the side panel now.
renderLocus(renderer.locusManager.getLocus());
updateHighlightInfo();
startLocusLoop();

// ── Current Locus: mode switch (DNA / RNA / CDS) ─────────────────────────────
const MODES = ["dna", "rna", "cds"];
function syncMode(mode) {
  for (const m of MODES) $(`md-${m}`).classList.toggle("active", m === mode);
}
for (const m of MODES) {
  $(`md-${m}`).onclick = () => {
    if (!renderer) return;
    renderer.locusManager.setMode(m);
    setTimeout(() => renderLocus(renderer.locusManager.getLocus()), 300);
  };
}

// ── Current Locus: live readout ──────────────────────────────────────────────
function renderLocus(locus) {
  const rna = locus.rna;
  $("locus-mode").textContent = locus.mode.toUpperCase();
  $("locus-gene").textContent = rna.gene_name || "—";
  $("locus-trans").textContent = rna.trans_name || "—";
  $("locus-transid").textContent = rna.trans_id || "—";
  $("locus-type").textContent = rna.trans_type || rna.gene_type || "—";
  $("locus-strand").textContent = rna.strand || "—";
  $("locus-where").textContent = locusWhere(locus);
  $("locus-asm").textContent = locus.dna.assembly || rna.assembly || "—";
  $("locus-fav").textContent = locus.isFavorite ? "★ favorited" : "☆ not favorited";
  syncMode(locus.mode);
}
let rafId = 0;
function startLocusLoop() {
  const loop = () => {
    if (renderer) {
      const fresh = renderer.locusManager.tick(); // host drives detection
      if (fresh) renderLocus(fresh);
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}
function goToRegion(value) {
  if (!renderer) return;
  try {
    renderer.region = value;
  } catch (err) {
    alert("Invalid region string: " + err.message);
    return;
  }
  setTimeout(() => {
    historyManager.add(renderer.locusManager.getLocus());
    renderLocus(renderer.locusManager.getLocus());
  }, 800);
}
$("locus-go").onclick = () => {
  const value = $("locus-input").value.trim();
  if (value) goToRegion(value);
};
function runExample(value) {
  $("locus-input").value = value;
  goToRegion(value);
}
$("ex1").onclick = () => runExample("VAMP3-201:5000");
$("ex2").onclick = () => runExample("YTHDF2-201:5000");

// ── Load Track ───────────────────────────────────────────────────────────────
$("load-local").onclick = () => $("local-file").click();
$("local-file").onchange = (e) => {
  const files = Array.from(e.target.files ?? []);
  if (files.length && renderer) renderer.importLocalFiles(files);
  e.target.value = "";
};
$("load-remote").onclick = () => { if (renderer) renderer.importRemoteUrl(); };

// ── Highlight ────────────────────────────────────────────────────────────────
let hlSeq = 0;
const HL_COLORS = ["#3867d6", "#eb3b5a", "#20bf6b", "#f7b731"];
$("hl-add").onclick = () => {
  if (!renderer) return;
  const d = renderer.getViewDomain();
  const span = d.end - d.start;
  const start = Math.round(d.start + span * 0.35);
  const end = Math.round(d.start + span * 0.65);
  hlSeq += 1;
  renderer.highlightManager.setRegion(`hl-${hlSeq}`, start, end, HL_COLORS[hlSeq % HL_COLORS.length]);
  renderer.forceRedraw();
  updateHighlightInfo();
};
$("hl-clear").onclick = () => {
  if (!renderer) return;
  renderer.highlightManager.clear();
  renderer.forceRedraw();
  updateHighlightInfo();
};
function updateHighlightInfo() {
  if (!renderer) { $("hl-info").textContent = "—"; return; }
  const hm = renderer.highlightManager;
  $("hl-info").textContent = `${hm.size} region(s) · isEmpty = ${hm.isEmpty}`;
}

// ── History (global singleton) ───────────────────────────────────────────────
function renderHistory() {
  const all = historyManager.getAll();
  const ul = $("history");
  ul.innerHTML = all.length ? "" : '<li class="muted">empty</li>';
  for (const locus of all) ul.appendChild(locusItem(locus));
}
$("history-clear").onclick = () => historyManager.clear();
historyManager.on(() => renderHistory());

// ── Favorites (global singleton) ─────────────────────────────────────────────
function renderFavorites() {
  const all = favouriteManager.getAll();
  const ul = $("favorites");
  ul.innerHTML = all.length ? "" : '<li class="muted">empty</li>';
  for (const locus of all) ul.appendChild(locusItem(locus));
  $("fav-count").textContent = String(favouriteManager.count);
}
$("fav-toggle").onclick = () => {
  if (!renderer) return;
  favouriteManager.toggle(renderer.locusManager.getLocus());
  renderLocus(renderer.locusManager.getLocus());
};
$("fav-clear").onclick = () => favouriteManager.clear();
favouriteManager.on(() => renderFavorites());

// ── Shared helpers ───────────────────────────────────────────────────────────
function locusWhere(locus) {
  return locus.dna.chr
    ? `${locus.dna.chr}:${locus.dna.start}-${locus.dna.end}`
    : locus.rna.trans_name || "(unknown)";
}
function locusItem(locus) {
  const li = document.createElement("li");
  li.className = "clickable";
  const rna = locus.rna;
  const pos = locus.dna.chr
    ? `${locus.dna.chr}:${locus.dna.start}-${locus.dna.end}`
    : "—";
  const asm = locus.dna.assembly || rna.assembly || "—";

  const primary = document.createElement("span");
  primary.className = "li-primary";
  primary.textContent = rna.trans_name || rna.trans_id || pos;

  const secondary = document.createElement("span");
  secondary.className = "li-secondary";
  secondary.textContent = `[${locus.mode}] ${pos} · ${asm}`;

  li.append(primary, secondary);
  li.title = "Click to navigate (navigateToLocus)";
  li.onclick = async () => {
    if (!renderer) return;
    const ok = await renderer.locusManager.navigateToLocus(locus);
    if (!ok) alert("navigateToLocus refused: assembly not loaded, or locus has no usable identity.");
  };
  return li;
}

// ── Init (globals work before the instance is captured) ──────────────────────
renderHistory();
renderFavorites();

if (import.meta.hot) {
  import.meta.hot.dispose(() => unmount());
}
