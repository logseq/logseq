(ns logseq.db-sync.worker.coerce
  (:require [lambdaisland.glogi :as log]))

(def invalid-coerce ::invalid-coerce)

(defn coerce
  [coercer value context]
  (try
    (coercer value)
    (catch :default e
      (js/console.error "DEBUG coerce FAILED:" (pr-str context) "value:" (pr-str value) "error:" e)
      (log/error :db-sync/malli-coerce-failed (merge context {:error e :value value}))
      invalid-coerce)))
