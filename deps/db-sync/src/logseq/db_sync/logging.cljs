(ns logseq.db-sync.logging
  (:require [lambdaisland.glogi :as glogi]
            [lambdaisland.glogi.console :as glogi-console]))

(defn install!
  "Installs console logging and sets the root logger level to `:info`."
  []
  (glogi-console/install!)
  (glogi/set-level :glogi/root :info))
