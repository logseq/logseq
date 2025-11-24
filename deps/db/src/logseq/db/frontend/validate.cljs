(ns logseq.db.frontend.validate
  "Validate frontend db for DB graphs"
  (:require [clojure.pprint :as pprint]
            [datascript.core :as d]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [malli.core :as m]
            [malli.error :as me]
            [malli.util :as mu]))

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

(defn validate-tx-report
  "Validates the datascript tx-report for entities that have changed. Returns
  boolean indicating if db is valid"
  [{:keys [db-after tx-data tx-meta]} {:keys [closed-schema?]}]
  (binding [db-malli-schema/*skip-strict-url-validate?* true]
    (let [changed-ids (->> tx-data (keep :e) distinct)
          tx-datoms (mapcat #(d/datoms db-after :eavt %) changed-ids)
          ent-maps* (map (fn [[db-id m]]
                         ;; Add :db/id for debugging
                           (assoc m :db/id db-id))
                         (db-malli-schema/datoms->entity-maps tx-datoms {:entity-fn #(d/entity db-after %)}))
          ent-maps (db-malli-schema/update-properties-in-ents db-after ent-maps*)
          validator (get-schema-validator closed-schema?)]
      (binding [db-malli-schema/*db-for-validate-fns* db-after]
        (let [invalid-ent-maps (remove
                              ;; remove :db/id as it adds needless declarations to schema
                                #(validator [(dissoc % :db/id)])
                                ent-maps)]
          (if (seq invalid-ent-maps)
            (do
              (prn "Invalid datascript entities detected amongst changed entity ids:" changed-ids :tx-meta tx-meta)
              (let [explainer (get-schema-explainer closed-schema?)
                    errors (doall
                            (map
                             (fn [m]
                               (let [m' (update m :block/properties (fn [properties]
                                                                      (map (fn [[p v]]
                                                                             [(:db/ident p) v])
                                                                           properties)))
                                     data {:entity-map m'
                                           :errors (me/humanize (explainer [(dissoc m :db/id)]))}]
                                 (try
                                   (pprint/pprint data)
                                   (catch :default _e
                                     (prn data)))
                                 data))
                             invalid-ent-maps))]

                [false errors]))
            [true nil]))))))

(defn group-errors-by-entity
  "Groups malli errors by entities. db is used for providing more debugging info"
  [db ent-maps errors]
  (assert (vector? ent-maps) "Must be a vec for grouping to work")
  (->> errors
       (group-by #(-> % :in first))
       (map (fn [[idx errors']]
              (let [ent (get ent-maps idx)]
                {:entity (cond-> ent
                           ;; Provide additional page info for debugging
                           (:block/page ent)
                           (update :block/page
                                   (fn [id] (select-keys (d/entity db id)
                                                         [:block/name :block/tags :db/id :block/created-at]))))
                 :dispatch-key (->> (dissoc ent :db/id) (db-malli-schema/entity-dispatch-key db))
                 :errors errors'})))))

(defn validate-db!
  "Validates all the entities of the given db using :eavt datoms. Returns a map
  with info about db being validated. If there are errors, they are placed on
  :errors and grouped by entity"
  [db]
  (let [datoms (d/datoms db :eavt)
        ent-maps* (db-malli-schema/datoms->entities datoms)
        ent-maps (mapv
                  ;; Remove some UI interactions adding this e.g. import
                  #(dissoc % :block.temp/load-status :block.temp/has-children?)
                  (db-malli-schema/update-properties-in-ents db ent-maps*))
        errors (binding [db-malli-schema/*db-for-validate-fns* db]
                 (-> (map (fn [e]
                            (dissoc e :db/id))
                          ent-maps) closed-db-schema-explainer :errors))]
    (cond-> {:datom-count (count datoms)
             :entities ent-maps*}
      (some? errors)
      (assoc :errors (map #(update % :errors (fn [errs] (me/humanize {:errors errs})))
                          (group-errors-by-entity db ent-maps errors))))))

(defn graph-counts
  "Calculates graph-wide counts given a graph's db and its entities from :eavt datoms"
  [db entities]
  (let [classes-count (count (d/datoms db :avet :block/tags :logseq.class/Tag))
        properties-count (count (d/datoms db :avet :block/tags :logseq.class/Property))]
    {:entities (count entities)
     :pages (count (filter :block/name entities))
     ;; Nodes that aren't pages
     :blocks (count (filter :block/page entities))
     :classes classes-count
     :properties properties-count
     ;; Objects that aren't classes or properties
     :objects (- (count (d/datoms db :avet :block/tags)) classes-count properties-count)
     :property-pairs (count (mapcat #(-> % db-property/properties (dissoc :block/tags)) entities))}))
