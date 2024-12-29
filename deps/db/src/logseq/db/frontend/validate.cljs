(ns logseq.db.frontend.validate
  "Validate frontend db for DB graphs"
  (:require [datascript.core :as d]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [malli.core :as m]
            [malli.error :as me]
            [malli.util :as mu]
            [clojure.pprint :as pprint]))

(def ^:private db-schema-validator (m/validator db-malli-schema/DB))
(def ^:private db-schema-explainer (m/explainer db-malli-schema/DB))
(def ^:private closed-db-schema-validator (m/validator (mu/closed-schema db-malli-schema/DB)))
(def ^:private closed-db-schema-explainer (m/explainer (mu/closed-schema db-malli-schema/DB)))

(defn get-schema-validator
  [closed-schema?]
  (if closed-schema? closed-db-schema-validator db-schema-validator))

(defn get-schema-explainer
  [closed-schema?]
  (if closed-schema? closed-db-schema-explainer db-schema-explainer))

(defn validate-tx-report!
  "Validates the datascript tx-report for entities that have changed. Returns
  boolean indicating if db is valid"
  [{:keys [db-after tx-data tx-meta]} validate-options]
  (let [changed-ids (->> tx-data (keep :e) distinct)
        tx-datoms (mapcat #(d/datoms db-after :eavt %) changed-ids)
        ent-maps* (map (fn [[db-id m]]
                         ;; Add :db/id for debugging
                         (assoc m :db/id db-id))
                       (db-malli-schema/datoms->entity-maps tx-datoms {:entity-fn #(d/entity db-after %)}))
        ent-maps (db-malli-schema/update-properties-in-ents db-after ent-maps*)
        validator (get-schema-validator (:closed-schema? validate-options))]
    (binding [db-malli-schema/*db-for-validate-fns* db-after]
      (let [invalid-ent-maps (remove
                              ;; remove :db/id as it adds needless declarations to schema
                              #(validator [(dissoc % :db/id)])
                              ent-maps)]
        (js/console.log "changed eids:" changed-ids tx-meta)
        (if (seq invalid-ent-maps)
          (let [explainer (get-schema-explainer (:closed-schema? validate-options))]
            (js/console.error "Invalid datascript entities detected amongst changed entity ids:" changed-ids)
            (doseq [m invalid-ent-maps]
              (let [m' (update m :block/properties (fn [properties]
                                                     (map (fn [[p v]]
                                                            [(:db/ident p) v])
                                                          properties)))
                    data {:entity-map m'
                          :errors (me/humanize (explainer [m]))}]
                (try
                  (pprint/pprint data)
                  (catch :default _e
                    (prn data)))))
            false)
          true)))))

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
                                                         [:block/name :block/tags :db/id :block/created-at])))))
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
        ent-maps (mapv
                  ;; Remove some UI interactions adding this e.g. import
                  #(dissoc % :block.temp/fully-loaded?)
                  (db-malli-schema/update-properties-in-ents db ent-maps*))
        errors (binding [db-malli-schema/*db-for-validate-fns* db]
                 (-> ent-maps closed-db-schema-explainer :errors))]
    (cond-> {:datom-count (count datoms)
             :entities ent-maps}
      (some? errors)
      (assoc :errors (map #(-> (dissoc % :errors-by-type)
                               (update :errors (fn [errs] (me/humanize {:errors errs}))))
                          (group-errors-by-entity db ent-maps errors))))))
