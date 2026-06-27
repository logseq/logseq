(ns frontend.worker.platform.browser
  "Browser platform adapter for db-worker."
  (:require ["@logseq/melange-js-api/browser" :as melange-js-api]
            [frontend.worker.platform :as platform]))

(defn browser-platform
  []
  (-> (.-Platform melange-js-api)
      (.browser_platform)
      platform/js-platform->platform))
