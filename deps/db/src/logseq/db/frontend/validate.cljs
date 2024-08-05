(ns logseq.db.frontend.validate
  "Validate frontend db for DB graphs"
  (:require [datascript.core :as d]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [malli.util :as mu]
            [malli.core :as m]
            [malli.error :as me]))

(defn update-schema
  "Updates the db schema to add a datascript db for property validations
   and to optionally close maps"
  [db-schema db {:keys [closed-schema?]}]
  (cond-> db-schema
    true
    (db-malli-schema/update-properties-in-schema db)
    closed-schema?
    mu/closed-schema))

(defn validate-tx-report!
  "Validates the datascript tx-report for entities that have changed. Returns
  boolean indicating if db is valid"
  [{:keys [db-after tx-data tx-meta]} validate-options]
  (let [changed-ids (->> tx-data (map :e) distinct)
        tx-datoms (mapcat #(d/datoms db-after :eavt %) changed-ids)
        ent-maps* (map (fn [[db-id m]]
                         ;; Add :db/id for debugging
                         (assoc m :db/id db-id))
                       (db-malli-schema/datoms->entity-maps tx-datoms {:entity-fn #(d/entity db-after %)}))
        ent-maps (db-malli-schema/update-properties-in-ents db-after ent-maps*)
        db-schema (update-schema db-malli-schema/DB db-after validate-options)
        invalid-ent-maps (remove
                          ;; remove :db/id as it adds needless declarations to schema
                          #(m/validate db-schema [(dissoc % :db/id)])
                          ent-maps)]
    (js/console.log "changed eids:" changed-ids tx-meta)
    (if (seq invalid-ent-maps)
      (do
        (js/console.error "Invalid datascript entities detected amongst changed entity ids:" changed-ids)
        (doseq [m invalid-ent-maps]

          (prn {:entity-map m
                :errors (me/humanize (m/explain db-schema [m]))})
          ;; FIXME: pprint fails sometime
          ;; (pprint/pprint {;; :entity-map (map #(into {} %) m)
          ;;                 :errors (me/humanize (m/explain db-schema [m]))})
          )
        false)
      true)))

(defn group-errors-by-entity
  "Groups malli errors by entities. db is used for providing more debugging info"
  [db ent-maps errors]
  (assert (vector? ent-maps) "Must be a vec for grouping to work")
  (->> errors
       (group-by #(-> % :in first))
       (map (fn [[idx errors']]
              {:entity (let [ent (get ent-maps idx)
                             db-id (:db/id (meta ent))]
                         (cond-> ent
                           db-id
                           (assoc :db/id db-id)
                           ;; Provide additional page info for debugging
                           (:block/page ent)
                           (update :block/page
                                   (fn [id] (select-keys (d/entity db id)
                                                         [:block/name :block/type :db/id :block/created-at])))))
               :errors errors'
               ;; Group by type to reduce verbosity
               ;; TODO: Move/remove this to another fn if unused
               :errors-by-type
               (->> (group-by :type errors')
                    (map (fn [[type' type-errors]]
                           [type'
                            {:in-value-distinct (->> type-errors
                                                     (map #(select-keys % [:in :value]))
                                                     distinct
                                                     vec)
                             :schema-distinct (->> (map :schema type-errors)
                                                   (map m/form)
                                                   distinct
                                                   vec)}]))
                    (into {}))}))))

(defn validate-db!
  "Validates all the entities of the given db using :eavt datoms. Returns a map
  with info about db being validated. If there are errors, they are placed on
  :errors and grouped by entity"
  [db]
  (let [datoms (d/datoms db :eavt)
        ent-maps* (db-malli-schema/datoms->entities datoms)
        schema (update-schema db-malli-schema/DB db {:closed-schema? true})
        ent-maps (mapv
                  ;; Remove some UI interactions adding this e.g. import
                  #(dissoc % :block.temp/fully-loaded?)
                  (db-malli-schema/update-properties-in-ents db ent-maps*))
        errors (->> ent-maps (m/explain schema) :errors)]
    (cond-> {:datom-count (count datoms)
             :entities ent-maps}
      (some? errors)
      (assoc :errors (map #(-> (dissoc % :errors-by-type)
                               (update :errors (fn [errs] (me/humanize {:errors errs}))))
                          (group-errors-by-entity db ent-maps errors))))))
