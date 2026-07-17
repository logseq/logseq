(ns frontend.worker.platform.browser
  "Browser platform adapter for db-worker."
  (:require [frontend.worker.platform :as platform]
            [logseq.melange.bridge.platform.browser :as platform-browser]))

(defn browser-platform
  []
  (-> (platform-browser/browser-platform)
      platform/js-platform->platform))
