# Dark Bricks

A LeCodes app. The whole SDK is available as globals (`UIScreen`, `UIText`, `Scene2D`, …) —
no imports needed. `main.ts` is the entry point.

## Run it

```
lecodes dev                  # live on your phone: scan the QR with the LeCodes app, hot reload
lecodes compile -o app.js    # bundle to a single self-contained JS file
```

## Test it (no device needed)

```
lecodes render --png shot.png    # headless screenshot of the running app
lecodes test                     # run tests/*.flow.json — the starter ships with a passing one
```

Scenario format + conventions: see [CLAUDE.md](./CLAUDE.md) (written for AI assistants, useful
for humans too).

## Put it on the platform

This project is local-only. To give it a home on le.codes (web editor, sharing, OTA updates):

```
lecodes login                    # once per machine
lecodes link                     # create a project from this folder and connect it
lecodes push -m "initial"        # upload it as the first checkpoint (--publish to go live)
```

Already made the project in the web editor? `lecodes link --project <uuid>` adopts it — it
shows what your next push would change there before connecting anything.

## Go native

```
lecodes app init ios         # generate a native Xcode shell in ios/
lecodes app sync             # embed the compiled bundle + plugins into it
lecodes app open             # open it in Xcode, build & run
```

## Layout

- `main.ts` — the app's entry point. Add more .ts files freely and import them from
  `main.ts`; a file named `main.ts` is always the entry.
- `tests/` — headless flow tests (`lecodes test`); failing steps dump the frame to
  `tests/.artifacts/`
- `CLAUDE.md` — guidance for AI assistants (the headless feedback loop + testability conventions)
- `assets/` — images/fonts the app references (created on demand)
- `tsconfig.json` + `.lecodes/types/` — generated IDE types (rewritten by the CLI; don't edit).
  They come from the SDK bundled in the CLI; `lecodes update` refreshes them from the platform.
- `.lecodes/` is gitignored — per-checkout state (those types + `manifest.json`, this machine's
  sync cursor once linked). After a fresh git clone: `lecodes update`, then
  `lecodes link --project <uuid>` to re-attach.
- `.lecodesignore` — files a future `lecodes push` would skip

Full command list: `lecodes --help`.
