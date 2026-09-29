// Drop-in replacement for melange/printf.js (Stdlib.Printf), backed by
// our mini format interpreter in src/core/sprintf.ml. The real printf.js
// pulls the entire camlinternalFormat.js interpreter (~215KB emitted)
// into the bundle; vite.config.mjs aliases every printf.js import here
// so it drops out entirely. Same curry-compatible export surface.
export {
  sprintf,
  ksprintf,
  bprintf,
  fprintf,
  eprintf,
  printf,
  ifprintf,
  ibprintf,
} from "../_build/default/js_app/js_app/src/core/sprintf.js";
