(ns logseq.db-sync.logging
  (:require [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]))

(defn install!
  "Installs console logging and sets the root logger level to `:info`."
  []
  (glogi-console/install!)
  (log/set-level :glogi/root :info))
