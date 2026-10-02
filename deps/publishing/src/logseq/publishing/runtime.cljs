(ns logseq.publishing.runtime
  "Relative asset paths used by hosted HTML export.

  After React was bundled into publishing main.js, UMD globals such as
  react.production.min.js are no longer copied into static/js. Published
  index.html must only reference files that the export actually ships.")

(def ^:api page-js-scripts
  "Scripts emitted into published index.html, in load order.
  `src` values are relative `static/` paths for python http.server,
  Cloudflare Pages, and subpath hosts."
  [{:src "static/js/magic_portal.js"}
   {:src "static/js/main.js"}
   {:src "static/js/interact.min.js" :defer true}
   {:src "static/js/highlight.min.js" :defer true}
   {:src "static/js/katex.min.js" :defer true}
   {:src "static/js/pdfjs/pdf.mjs" :defer true :type "module"}
   {:src "static/js/pdf_viewer3.mjs" :defer true :type "module"}
   {:src "static/js/html2canvas.min.js" :defer true}
   {:src "static/js/code-editor.js" :defer true}
   {:src "static/js/custom.js" :defer true}])

(def ^:api required-js-runtime-files
  "Files the published app loads besides the publishing cljs build.
  Missing any of these makes a hosted export fail to restore the graph."
  ["db-worker.js"
   "db-worker-bundle.js"
   "worker.js"
   "sqlite3.wasm"
   "lightning-fs.min.js"
   "magic_portal.js"])
