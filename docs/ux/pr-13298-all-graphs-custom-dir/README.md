# All graphs path with `LOGSEQ_GRAPHS_DIR`

UX media for https://github.com/logseq/logseq/pull/13298.

With `:system/info :graphs-dir` set to `/tmp/logseq-custom-graphs-dir` (the directory Electron main resolves from `LOGSEQ_GRAPHS_DIR`), All graphs reports the real filesystem path instead of `~/logseq/graphs/<name>`.

Captured from the live All graphs page (`http://localhost:3001/#/graphs`). The Demo row `title` / resolved local dir is `/tmp/logseq-custom-graphs-dir/Demo`.

| File | What it shows |
| --- | --- |
| `all_graphs_default_fallback.png` | All graphs before `:graphs-dir` is set. Graph title is the default `logseq/graphs/Demo` fallback. |
| `all_graphs_custom_dir_path.png` | Same page after `:graphs-dir` is `/tmp/logseq-custom-graphs-dir`. Path badge is `/tmp/logseq-custom-graphs-dir/Demo`. |
| `all_graphs_custom_dir_path_crop.png` | Crop of the All graphs heading and Demo path. |
| `all_graphs_custom_dir_chrome.png` | Chrome window on `#/graphs` with the custom path visible. |
| `all_graphs_custom_dir_path.mp4` | Short clip of that Chrome All graphs view. |
| `all_graphs_custom_dir_capture.json` | DOM extract: heading `All graphs`, title `/tmp/logseq-custom-graphs-dir/Demo`. |

Electron desktop in this environment stayed on a blank window, so the capture uses the same renderer All graphs page and `frontend.config/get-local-dir` path that Electron would show on hover (`root` / `title`).
