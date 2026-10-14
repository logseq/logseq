# Bootstrap validation

Reference master 7dfa9b45a built from its ClojureScript sources with Java 21. App and worker compilations passed with 0 warnings; webpack reported its existing SQLite dynamic-import warnings. Root dependencies installed independently with frozen lockfiles.

Native baseline 7b0d18735000f2b7ae6342c410df476088baa543 failed to build against resolved LUI 7ae8b157281fc4837fc7e6f1507d722c1f13404c: ocaml_host/logseq_native.ml did not initialize Lui_paint.hooks.hidden. The host already installs its real visibility predicate through Lui_host.set_hidden; initialization now supplies the neutral pre-host predicate. No dependency API is bypassed.

After repair: worker bin/main.exe and js_api built; native host, js_app and test targets built. dune runtest ocaml_host test/contracts passed, including the Linux text shaping/rasterization test and native I/O completion tests. UI recording suite: 2066 checks, 0 failures, 0 expected-failures, 0 unexpected-passes. spec-dev-tool check --all passed against existing decision documents.

Actual native execution: SDL 1280 x 900, scale 1, LUI software rasterizer/blit, 6192 icons registered. Independent disposable LOGSEQ_ROOT_DIR and LOGSEQ_UI_STATE_DIR; Demo graph created by native app, worker process registered on dynamically allocated port 43203. Home rendered; left sidebar opened by one actual pointer press. AT-SPI exposes only top-level metadata; screenshots plus the host's retained-tree diagnostics and persisted data must establish native interaction evidence.

Evidence: master/01-home-light.png (1280 x 900), native/01-home-light-before.png; reference-exploration trajectory records normal desktop opening of sidebar and application menu. The headless reference automation browser uses a separate disposable profile and the same built master app. The installed BetterChromium crashes under automated attachment; standard Playwright Chromium works headlessly, while the ordinary desktop reference browser works normally. This is a toolchain observation, not a native product parity blocker.

No visual/interaction parity claim follows from these build checks. Shell, settings and editing differences remain under investigation.
