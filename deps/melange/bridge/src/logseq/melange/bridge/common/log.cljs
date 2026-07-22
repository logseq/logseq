(ns logseq.melange.bridge.common.log
  "Console logging capability for CLJS and nbb consumers.")

(defn error
  [& messages]
  (apply js/console.error (map clj->js messages)))
