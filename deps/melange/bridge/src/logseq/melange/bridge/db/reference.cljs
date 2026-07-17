(ns logseq.melange.bridge.db.reference
  "DataScript reference boundary backed by typed Melange graph filtering."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private reference-api (.-ReferenceFilter melange-db))
(def ^:private reference-workflow-api (.-ReferenceWorkflow melange-db))

(defn get-filters
  [page]
  (when-let [^js result ((.-filtersWith reference-workflow-api)
                         (runtime/runtime-adapter)
                         (d/adapter)
                         page)]
    {:included (set (seq (.-included result)))
     :excluded (set (seq (.-excluded result)))}))

(defn get-linked-references
  [db id]
  (let [^js result ((.-linkedWith reference-workflow-api)
                    (runtime/runtime-adapter)
                    (d/adapter)
                    db
                    id)]
    {:ref-blocks (seq (.-refBlocks result))
     :ref-pages-count (some->> (.-refPageCounts result)
                               seq
                               (map (fn [^js entry]
                                      [(.-label entry) (.-count entry)])))
     :ref-matched-children-ids (some->> (.-refMatchedChildrenIds result)
                                        seq
                                        set)}))

(defn get-unlinked-references
  [db id]
  (let [result ((.-unlinkedWith reference-api)
                (runtime/runtime-adapter)
                (d/adapter)
                db
                id)]
    (when (some? result)
      (map identity (seq result)))))
