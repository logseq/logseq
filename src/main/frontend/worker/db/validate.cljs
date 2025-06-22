(ns frontend.worker.db.validate
  "Validate db"
  (:require [datascript.core :as d]
            [frontend.worker.shared-service :as shared-service]
            [logseq.db :as ldb]
            [logseq.db.frontend.validate :as db-validate]))

(defn- fix-invalid-blocks!
  [conn errors]
  (let [tx-data (keep
                 (fn [{:keys [entity dispatch-key]}]
                   (let [entity (d/entity @conn (:db/id entity))]
                     (cond
                       (:block.temp/fully-loaded? entity)
                       [:db/retract (:db/id entity) :block.temp/fully-loaded?]
                       (and (:block/page entity) (not (:block/parent entity)))
                       [:db/add (:db/id entity) :block/parent (:db/id (:block/page entity))]
                       (and (not (:block/page entity)) (not (:block/parent entity)) (not (:block/name entity)))
                       [:db/retractEntity (:db/id entity)]
                       (and (= dispatch-key :property-value-block) (:block/title entity))
                       [:db/retract (:db/id entity) :block/title]
                       (and (ldb/class? entity) (not (:logseq.property.class/extends entity)))
                       [:db/add (:db/id entity) :logseq.property.class/extends :logseq.class/Root]
                       (and (or (ldb/class? entity) (ldb/property? entity)) (ldb/internal-page? entity))
                       [:db/retract (:db/id entity) :block/tags :logseq.class/Page]
                       :else
                       nil)))
                 errors)]
    (when (seq tx-data)
      (ldb/transact! conn tx-data {:fix-db? true}))))

(defn validate-db
  [conn]
  (let [db @conn
        {:keys [errors datom-count entities]} (db-validate/validate-db! db)
        invalid-entity-ids (distinct (map (fn [e] (:db/id (:entity e))) errors))]
    (if errors
      (do
        (fix-invalid-blocks! conn errors)
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
     :invalid-entity-ids invalid-entity-ids}))
