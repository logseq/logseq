(ns frontend.worker.db.validate
  "Validate db"
  (:require [frontend.worker.shared-service :as shared-service]
            [logseq.db.frontend.validate :as db-validate]))

(defn validate-db
  [db]
  (let [{:keys [errors datom-count entities]} (db-validate/validate-db! db)]
    (if errors
      (do
        (shared-service/broadcast-to-clients! :log [:db-invalid :error
                                                    {:msg "Validation errors"
                                                     :errors errors}])
        (shared-service/broadcast-to-clients! :notification
                                              [(str "Validation detected " (count errors) " invalid block(s). These blocks may be buggy. Attempting to fix invalid blocks. Run validation again to see if they were fixed.")
                                               :warning false]))

      (shared-service/broadcast-to-clients! :notification
                                            [(str "Your graph is valid! " (assoc (db-validate/graph-counts db entities) :datoms datom-count))
                                             :success false]))
    {:errors errors
     :datom-count datom-count
     :invalid-entity-ids (distinct (map (fn [e] (:db/id (:entity e))) errors))}))
