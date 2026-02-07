(ns frontend.worker.graph-dir
  "Platform-agnostic graph directory naming helpers."
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]))

(defn repo->graph-dir-key
  [repo]
  (when (seq repo)
    (if (string/starts-with? repo common-config/db-version-prefix)
      (subs repo (count common-config/db-version-prefix))
      repo)))
