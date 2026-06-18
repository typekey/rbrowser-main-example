# rbrowser-main-example

A minimal, runnable example of [`@rbrowser/main`](https://www.npmjs.com/package/@rbrowser/main) (>= v1.0.60).

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

`mountBrowser()` renders the full browser (native header) **and** returns a
handle `{ renderer, unmount }`. The `renderer` instance is available
synchronously, so you get the native UI and full API access at once:

```js
import { mountBrowser } from "@rbrowser/main";

const { renderer, unmount } = mountBrowser("rbrowser"); // native header + tracks

renderer.locusManager;
renderer.searchManager;
renderer.channelManager;
renderer.referenceManager;
renderer.highlightManager;
// later: unmount();
```

> Requires `@rbrowser/main` **>= 1.0.60**. Earlier versions returned only an
> `unmount` function and did not expose the renderer instance.

## What the side panel calls

| Section | API |
| --- | --- |
| Current Locus | `locusManager.setMode("dna"\|"rna"\|"cds")` · `renderer.region = …` · `locusManager.getLocus() / tick()` |
| Load Track | `renderer.importLocalFiles(files)` · `renderer.importRemoteUrl()` |
| Highlight | `highlightManager.setRegion() / clear()` · `.size` / `.isEmpty` · `getViewDomain()` · `forceRedraw()` |
| History | `historyManager.getAll() / on() / add() / clear()` |
| Favorites | `favouriteManager.toggle() / getAll() / count / on()` · `locusManager.navigateToLocus()` |

Plus `mountBrowser`, `VERSION`. `historyManager` / `favouriteManager` are global
singletons; the other managers come from the `renderer` handle returned by
`mountBrowser`.

## Files

- `index.html` — layout (native browser + side panel)
- `src/main.js` — all the API calls
- `src/style.css` — side-panel styles (scoped to `.panel` so they don't leak into the native header)
