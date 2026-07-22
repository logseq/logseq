(ns logseq.melange.bridge.platform.browser
  "Primitive browser adapters for Melange Common and DB consumers."
  (:require ["@logseq/melange-js-api/browser" :as browser-api]))

(defn browser-platform
  []
  (.browser_platform (.-Platform browser-api)))
