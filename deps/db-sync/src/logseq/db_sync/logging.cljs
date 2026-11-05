(ns logseq.db-sync.logging
  (:require [clojure.string :as string]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]))

(defn install!
  "Installs console logging and sets the root logger level to `:info`."
  []
  (glogi-console/install!)
  (log/set-level :glogi/root :info))

(defn set-root-level!
  "Sets the root logger level from a level name such as \"error\" or \"debug\"
  (case-insensitive). An unknown name leaves the level as it is and logs a
  warning, so a typo in DB_SYNC_LOG_LEVEL does not stop the server."
  [level-name]
  (let [lvl (some-> level-name str string/trim string/lower-case keyword)]
    (if (log/level lvl)
      (log/set-level :glogi/root lvl)
      (log/warn :db-sync/unknown-log-level {:log-level level-name}))))
