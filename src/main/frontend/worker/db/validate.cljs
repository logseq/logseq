(ns frontend.worker.db.validate
  "Validate db"
  (:require [frontend.worker.util :as worker-util]
            [logseq.db.frontend.validate :as db-validate]))

(defn validate-db
  [db]
  (let [{:keys [errors datom-count entities]} (db-validate/validate-db! db)]
    (if errors
      (do
        (worker-util/post-message :log [:db-invalid :error
                                        {:msg "Validation errors"
                                         :errors errors}])
        (worker-util/post-message :notification
                                  [(str "Validation detected " (count errors) " invalid block(s). These blocks may be buggy when you interact with them. See the javascript console for more.")
                                   :warning false]))

      (worker-util/post-message :notification
                                [(str "Your graph is valid! " (assoc (db-validate/graph-counts db entities) :datoms datom-count))
                                 :success false]))
    {:errors errors
     :datom-count datom-count
     :invalid-entity-ids (distinct (map (fn [e] (:db/id (:entity e))) errors))}))
