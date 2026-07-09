---
name: Import setup gotchas
description: What blocked the initial "get it running" pass on this imported repo
---

- `apps/mobile/node_modules` was not present after import — the workflow failed with
  `./node_modules/.bin/expo: No such file or directory`. Fix: `npm install` in `apps/mobile`.
- After install, Metro bundling failed with a Babel parse error inside a `<<<<<<< HEAD` /
  `=======` / `>>>>>>>` block left in `src/app/(tabs)/merchant.tsx` — an unresolved git merge
  conflict had been committed. Resolved by keeping the HEAD-side state declarations and
  discarding the incoming branch's duplicate data-loading effect (an equivalent `initializeData()`
  already existed later in the file covering the same store/promos load).
- **Why:** a workflow failing to boot on a freshly imported repo is often just missing deps or a
  stray conflict marker, not a deeper code problem — check `npm install` and
  `grep -rn '^<<<<<<<' src/` before assuming the app is broken.
