# rbrowser-main-example

A minimal, runnable example of [`@rbrowser/main`](https://www.npmjs.com/package/@rbrowser/main) (v1.0.57).

It shows the **native RBrowser header** (the full toolbar: reference dropdown,
region search, RNA Mode, Scenario, import / highlight / history / favourite /
download) **and** drives the renderer API from a custom side panel — at the same
time.

## Run

```bash
npm install
npm run dev      # open the printed http://localhost:3001 (or next free port)
```

Vanilla JS + Vite. `react` / `react-dom` are dependencies because the ESM build
of `@rbrowser/main` treats them as external (the example writes no React code).

## How it works

`mountBrowser()` renders the full browser (native header) and creates the
renderer internally, keeping it private. To get the instance too, intercept
`TranscriptBrowserRenderer.prototype.mount` once to capture it, then restore the
prototype:

```js
import { mountBrowser, TranscriptBrowserRenderer } from "@rbrowser/main";

let renderer = null;
const origMount = TranscriptBrowserRenderer.prototype.mount;
TranscriptBrowserRenderer.prototype.mount = function () {
  renderer = this;                                        // capture the instance
  TranscriptBrowserRenderer.prototype.mount = origMount;  // restore immediately
  return origMount.call(this);
};

const unmount = mountBrowser("rbrowser");                 // native header + tracks
// now: renderer.channelManager / referenceManager / highlightManager / locusManager …
```

## What the side panel calls

| Section | API |
| --- | --- |
| Current Locus | `locusManager.setMode("dna"\|"rna"\|"cds")` · `renderer.region = …` · `locusManager.getLocus() / tick()` |
| Load Track | `renderer.importLocalFiles(files)` · `renderer.importRemoteUrl()` |
| Highlight | `highlightManager.setRegion() / clear()` · `.size` / `.isEmpty` · `getViewDomain()` · `forceRedraw()` |
| History | `historyManager.getAll() / on() / add() / clear()` |
| Favorites | `favouriteManager.toggle() / getAll() / count / on()` · `locusManager.navigateToLocus()` |

Plus `mountBrowser`, `VERSION`. `historyManager` / `favouriteManager` are global
singletons; the other managers come from the captured renderer instance.

## Files

- `index.html` — layout (native browser + side panel)
- `src/main.js` — all the API calls
- `src/style.css` — side-panel styles (scoped to `.panel` so they don't leak into the native header)
