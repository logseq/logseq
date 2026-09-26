(ns logseq.graph-parser.exporter.finalize
  "Post-import finishing passes: tx-id stamping, block refs rebuild, missing
  placeholder ref cleanup, journal uuid normalization, and page order repair."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(defn- remove-block-ref-from-title
  [title block-uuid]
  (when (string? title)
    (-> title
        (string/replace (block-ref/->block-ref block-uuid) "")
        (string/replace (page-ref/->page-ref block-uuid) "")
        (string/replace #" {2,}" " ")
        string/trim)))

(defn- placeholder-block-ref?
  [entity]
  (and (:block/uuid entity)
       (nil? (:block/title entity))))

(defn- missing-placeholder-ref-datoms
  [db attr candidate-ref-uuids]
  (if (seq candidate-ref-uuids)
    (mapcat (fn [ref-uuid]
              (when-let [ref-id (some-> (d/entity db [:block/uuid ref-uuid]) :db/id)]
                (when (placeholder-block-ref? (d/entity db ref-id))
                  (for [datom (d/datoms db :avet attr ref-id)]
                    {:source-id (:e datom)
                     :ref-id ref-id
                     :ref-uuid ref-uuid}))))
            candidate-ref-uuids)
    (->> (d/datoms db :aevt attr)
         (keep (fn [datom]
                 (let [ref-entity (d/entity db (:v datom))]
                   (when (placeholder-block-ref? ref-entity)
                     {:source-id (:e datom)
                      :ref-id (:v datom)
                      :ref-uuid (:block/uuid ref-entity)})))))))

(defn- cleanup-missing-block-refs-tx
  ([db] (cleanup-missing-block-refs-tx db nil))
  ([db candidate-ref-uuids]
   (let [missing-ref-datoms (missing-placeholder-ref-datoms db :block/refs candidate-ref-uuids)
         missing-link-datoms (missing-placeholder-ref-datoms db :block/link candidate-ref-uuids)
         refs-by-source-id (group-by :source-id missing-ref-datoms)
         retract-ref-tx
         (mapcat (fn [[source-id refs]]
                   (map (fn [{:keys [ref-id]}]
                          [:db/retract source-id :block/refs ref-id])
                        refs))
                 refs-by-source-id)
         retract-link-tx
         (map (fn [{:keys [source-id ref-id]}]
                [:db/retract source-id :block/link ref-id])
              missing-link-datoms)
         update-title-tx
         (keep (fn [[source-id refs]]
                 (let [source (d/entity db source-id)
                       title (:block/title source)
                       title' (reduce remove-block-ref-from-title title (map :ref-uuid refs))]
                   (when (and (string? title') (not= title title'))
                     [:db/add source-id :block/title title'])))
               refs-by-source-id)
         retract-placeholder-tx
         (->> (concat missing-ref-datoms missing-link-datoms)
              (map (juxt :ref-id :ref-uuid))
              distinct
              (map (fn [[ref-id ref-uuid]]
                     [:db/retract ref-id :block/uuid ref-uuid])))]
     (concat retract-ref-tx retract-link-tx update-title-tx retract-placeholder-tx))))

(defn set-finishing-import-ui!
  [set-ui-state]
  (set-ui-state [:graph/importing-state :step] :finishing)
  (set-ui-state [:graph/importing-state :label] :import/finishing)
  (set-ui-state [:graph/importing-state :current-page] nil))

(defn finalize-imported-graph!
  "Stamp :block/tx-id and rebuild :block/refs once after file import.

  Per-file import txs set :logseq.graph-parser.exporter/new-graph?, so CLI listeners and worker
  transact-pipeline skip refs. This pass writes both in one transact.
  File-graph import does not notify renderer clients; :logseq.graph-parser.exporter/imported-data?
  skips worker render-delta broadcast. :transact-new-graph-refs? skips
  the worker pipeline so refs are not rebuilt a second time."
  [conn]
  (let [db @conn
        entity-ids (d/q '[:find [?e ...]
                          :where
                          [?e :block/uuid]
                          [?e :block/title]
                          [(missing? $ ?e :block/tx-id)]]
                     db)]
    (when (seq entity-ids)
      (let [tx-id (inc (:max-tx db))
            rebuild-refs (outliner-pipeline/db-rebuild-block-refs-fn db)
            tx (into []
                     (mapcat
                      (fn [id]
                        (let [block (d/entity db id)
                              refs (when-not (:logseq.property.reaction/target block)
                                     (set (rebuild-refs block)))
                              old-refs (when (seq refs)
                                         (into #{} (map :v) (d/datoms db :eavt id :block/refs)))]
                          (concat [[:db/add id :block/tx-id tx-id]]
                                  (map (fn [ref] [:db/retract id :block/refs ref])
                                    (set/difference old-refs refs))
                                  (map (fn [ref] [:db/add id :block/refs ref])
                                    (set/difference refs old-refs))))))
                     entity-ids)]
        (ldb/transact! conn tx
          {:logseq.graph-parser.exporter/imported-data? true :logseq.graph-parser.exporter/new-graph? true :transact-new-graph-refs? true})))))

(defn cleanup-missing-block-refs!
  ([conn] (cleanup-missing-block-refs! conn nil))
  ([conn import-state]
   (let [candidate-ref-uuids (when import-state @(:placeholder-ref-uuids import-state))
         tx (cleanup-missing-block-refs-tx @conn candidate-ref-uuids)]
     (when (seq tx)
       (ldb/transact! conn tx {:logseq.graph-parser.exporter/imported-data? true})))))

(defn- journal-uuid-normalizations
  [db]
  (keep (fn [datom]
          (let [entity (d/entity db (:e datom))
                old-uuid (:block/uuid entity)
                journal-day (:block/journal-day entity)
                standard-uuid (common-uuid/gen-uuid :journal-page-uuid journal-day)]
            (when (and old-uuid (not= old-uuid standard-uuid))
              (when-let [target (d/entity db [:block/uuid standard-uuid])]
                (when (not= (:db/id target) (:db/id entity))
                  (throw (ex-info "Cannot normalize journal uuid because the standard uuid is already used"
                                  {:journal-day journal-day
                                   :old-uuid old-uuid
                                   :standard-uuid standard-uuid
                                   :target-id (:db/id target)}))))
              {:eid (:db/id entity)
               :old-uuid old-uuid
               :standard-uuid standard-uuid})))
        (d/datoms db :avet :block/journal-day)))

(defn- replace-journal-uuid-refs
  [value uuid-replacements]
  (if (seq uuid-replacements)
    (walk/postwalk
     (fn [x]
       (if (string? x)
         (reduce (fn [s [old-uuid standard-uuid]]
                   (-> s
                       (string/replace (page-ref/->page-ref old-uuid)
                                       (page-ref/->page-ref standard-uuid))
                       (string/replace (block-ref/->block-ref old-uuid)
                                       (block-ref/->block-ref standard-uuid))))
                 x
                 uuid-replacements)
         x))
     value)
    value))

(defn- normalize-journal-uuids-tx
  [db]
  (let [normalizations (vec (journal-uuid-normalizations db))
        uuid-replacements (map (juxt :old-uuid :standard-uuid) normalizations)
        uuid-tx (mapcat (fn [{:keys [eid old-uuid standard-uuid]}]
                          [[:db/retract eid :block/uuid old-uuid]
                           [:db/add eid :block/uuid standard-uuid]])
                        normalizations)
        text-tx (when (seq uuid-replacements)
                  (keep (fn [datom]
                          (let [value (:v datom)
                                value' (when (or (string? value) (coll? value))
                                         (replace-journal-uuid-refs value uuid-replacements))]
                            (when (and (some? value') (not= value value'))
                              [:db/add (:e datom) (:a datom) value'])))
                        (d/datoms db :eavt)))]
    (vec (concat uuid-tx text-tx))))

(defn normalize-journal-uuids!
  [conn]
  (let [tx (normalize-journal-uuids-tx @conn)]
    (when (seq tx)
      (ldb/transact! conn tx {:logseq.graph-parser.exporter/imported-data? true}))))

(defn ensure-imported-page-parent-orders!
  [conn]
  (let [tx-data (db-order/missing-internal-page-parent-order-tx @conn)]
    (when (seq tx-data)
      (ldb/transact! conn tx-data {:logseq.graph-parser.exporter/imported-data? true}))))
