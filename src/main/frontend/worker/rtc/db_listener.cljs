(ns frontend.worker.rtc.db-listener
  "listen datascript changes, infer operations from the db tx-report"
  (:require [frontend.worker.db-listener :as db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.gen-client-op :as gen-client-op]))

(comment
  ;; TODO: make it a qualified-keyword
  (defkeywords
    :persist-op? {:doc "tx-meta option, generate rtc ops when not nil (default true)"}))

(defmethod db-listener/listen-db-changes :gen-rtc-ops
  [_
   {:keys [repo same-entity-datoms-coll id->same-entity-datoms]}
   {:keys [_tx-data tx-meta db-before db-after]}]
  (when (and (client-op/rtc-db-graph? repo)
             (:persist-op? tx-meta true))
    (let [e->a->add?->v->t (update-vals
                            id->same-entity-datoms
                            gen-client-op/entity-datoms=>a->add?->v->t)
          ops (gen-client-op/generate-rtc-ops db-before db-after same-entity-datoms-coll e->a->add?->v->t)]
      (when (seq ops)
        (client-op/add-ops repo ops)))))
