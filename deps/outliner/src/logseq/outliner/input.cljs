(ns logseq.outliner.input
  "Prepares raw editor content and canonical outliner operations atomically."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.db-input :as db-input]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]))

(defkeywords
  ::parse-options {:doc "Graph configuration for raw editor input parsing."}
  :logseq.outliner/save-block-input {:doc "Saves raw editor input after resolving it in the transaction."}
  :logseq.outliner/insert-blocks-input {:doc "Inserts raw editor blocks after resolving them in the transaction."}
  :logseq.outliner/preview-ops {:doc "Evaluates an operation batch without committing graph changes."})

(defn- ref-summary
  [ref]
  (select-keys ref [:db/id :block/uuid :block/title :block/name :db/ident :block/tags]))

(defn- resolve-input-refs!
  [conn refs ast tags]
  (let [names (into #{} (keep #(gp-block/get-page-reference % :markdown))
                    (tree-seq coll? seq ast))
        parent-names (into #{} (keep #(get-in % [:block/namespace :block/name])) refs)]
    (->> refs
         ;; File parsing also emits namespace ancestors. The DB editor
         ;; references the selected leaf rather than these generated parents.
         (remove (fn [ref]
                   (and (map? ref) (:block/type ref)
                        (contains? parent-names (:block/name ref))
                        (not (contains? names (:block/title ref))))))
         (mapv (fn [ref]
                 (cond
                   (and (map? ref) (common-util/uuid-string? (:block/title ref)))
                   [:block/uuid (uuid (:block/title ref))]

                   (and (map? ref) (:block/type ref) (:block/title ref))
                   (let [title (:block/title ref)
                         class? (boolean (some #(= (or (:block.temp/original-page-name ref) (:block/title ref))
                                                   (:block/title %)) tags))
                         [_ id] (outliner-page/create! conn title {:uuid (:block/uuid ref)
                                                                   :split-namespace? true
                                                                   :class? class?})]
                     (assoc (ref-summary (d/entity @conn [:block/uuid id]))
                            :block.temp/original-page-name
                            (or (:block.temp/original-page-name ref) title)))

                   :else ref))))))

(defn- plain-input?
  [block]
  (let [title (:block/title block)]
    (and (uuid? (:block/uuid block))
         (string? title) (not (string/blank? title))
         (nil? (:logseq.property.node/display-type block))
         ;; Without a closing bracket or another markup delimiter, mldoc can
         ;; only produce plain text. Avoid its expensive unmatched-link scan.
         (not (re-find #"[#`~$:{}()\\\r\n*_<>!|=^\]-]" title)))))

(defn- parse-new-input-block!
  [conn block options]
  (let [existing (when-let [id (:block/uuid block)] (d/entity @conn [:block/uuid id]))
        block (merge (select-keys existing [:logseq.property.node/display-type])
                     (dissoc block :block/refs))
        parsed (if (plain-input? block)
                 (assoc block :block/refs [] :block/tags [])
                 (db-input/parse-block-input block
                            (merge {:repo "logseq_db_editor"
                                    :user-config {}
                                    :date-formatter date-time-util/default-journal-title-formatter}
                                   options
                                   {:cached-refs (mapv ref-summary (:block/refs existing))
                                    :resolve-refs (partial resolve-input-refs! conn)})))
        resolved-tags (keep (fn [tag]
                              (or (some (fn [ref]
                                          (when (and (map? ref)
                                                     (= (:block/title tag)
                                                        (or (:block.temp/original-page-name ref) (:block/title ref)))) ref))
                                        (:block/refs parsed))
                                  (when (common-util/uuid-string? (:block/title tag))
                                    (some-> (d/entity @conn [:block/uuid (uuid (:block/title tag))]) ref-summary))
                                  tag))
                            (:block/tags parsed))]
    ;; Desktop applies explicit metadata after parsing. Keep it alongside
    ;; canonical inline tags, including stable UUIDs in semantic history.
    (assoc parsed :block/tags (vec (distinct (concat (:block/tags block) resolved-tags))))))

(defn- parse-input-op!
  [conn [op args :as entry] options]
  (case op
    :logseq.outliner/save-block-input (let [[block opts] args]
                  (when-not (d/entity @conn [:block/uuid (:block/uuid block)])
                    (throw (ex-info "Block source does not exist" {:block/uuid (:block/uuid block)})))
                  (let [block (parse-new-input-block! conn block options)]
                    [:save-block [block opts]]))
    :logseq.outliner/insert-blocks-input (let [[blocks target opts] args]
                     (when-not (d/entity @conn [:block/uuid target])
                       (throw (ex-info "Block target does not exist" {:block/uuid target})))
                     [:insert-blocks [(mapv #(parse-new-input-block! conn % options) blocks) target opts]])
    entry))

(defn- canonical-shape
  [[op :as entry]]
  (into [(case op :logseq.outliner/save-block-input :save-block :logseq.outliner/insert-blocks-input :insert-blocks op)]
        (rest entry)))

(defn- apply-content-ops!
  "Applies editor input atomically using the existing graph parser and outliner.

  Parses raw titles inside a temporary connection. Captures canonical operations
  for undo and sync, so replay never reparses input or generates new identities."
  [conn ops options]
  (let [semantic-ops (atom [])
        result (atom nil)
        batch-options (outliner-op/operation-options conn (mapv canonical-shape ops)
                                                    (dissoc options ::parse-options))
        tx-meta (dissoc batch-options :additional-tx :transact-opts :current-block)]
    (ldb/batch-transact-with-temp-conn!
     conn tx-meta
     (fn [temp-conn _]
       (doseq [op ops]
         (let [op (parse-input-op! temp-conn op (::parse-options options))
               value (outliner-op/apply-ops! temp-conn [op] (dissoc batch-options :additional-tx))]
           (when (some? value) (reset! result value))))
       (when (seq (:additional-tx batch-options))
         (ldb/transact! temp-conn (:additional-tx batch-options) {})))
     :listen-db (fn [{:keys [tx-meta]}]
                  (swap! semantic-ops into (:outliner-ops tx-meta)))
     :transform-tx-meta #(assoc % :outliner-ops @semantic-ops))
    @result))

(declare apply-ops!)

(defn- plan-ops!
  "Resolves input on an isolated copy; downstream transaction hooks are not forecast."
  [conn ops options]
  (let [preview (ldb/temp-conn-from-db @conn)
        before @conn
        named-pages (atom #{})
        page! (fn [page-name]
                (let [matches (map #(d/entity @preview (:e %))
                                   (d/datoms @preview :avet :block/name
                                             (common-util/page-name-sanity-lc page-name)))]
                  ;; Match live name materialization: explicit property
                  ;; lookups cannot implicitly restore an all-recycled name.
                  (when (and (seq matches) (every? ldb/recycled? matches))
                    (throw (ex-info "page is recycled" {:block/name page-name})))
                  (let [[_ id] (outliner-page/create! preview page-name {:split-namespace? true})]
                    (d/entity @preview [:block/uuid id]))))
        named-lookup? (fn [x] (and (vector? x) (= :block/name (first x))))]
    (d/listen! preview ::preview-pages
               (fn [{:keys [tx-data]}]
                 (doseq [datom tx-data
                         :when (and (:added datom) (= :block/name (:a datom)))]
                   (swap! named-pages conj (:e datom)))))
    (try
      (let [ops (mapv (fn [[op args :as entry]]
                        (let [entry (if (and (= :logseq.outliner/insert-blocks-input op) (named-lookup? (second args)))
                                      [op (assoc args 1 (:block/uuid (page! (second (second args)))))]
                                      entry)]
                          (walk/postwalk (fn [x]
                                           (if (named-lookup? x) (:db/id (page! (second x))) x))
                                         entry)))
                      ops)]
        (apply-ops! preview ops options)
        {:would-create-pages (->> @named-pages
                                 (remove #(:block/name (d/entity before %)))
                                 (filter #(:block/name (d/entity @preview %)))
                                 sort
                                 (map #(ldb/get-title-with-parents (d/entity @preview %)))
                                 distinct
                                 vec)})
      (finally
        (d/unlisten! preview ::preview-pages)
        (reset! preview nil)))))

(defn ^:api apply-ops!
  "Applies canonical operations or parses raw content in the same atomic batch.

  A sole `:logseq.outliner/preview-ops` request evaluates its batch on a storage-disabled copy.
  Preview reports pages resolved by parsing and core operations, without
  forecasting downstream transaction hooks. Raw content is normalized before
  semantic history is captured.

  | Option | Meaning |
  | --- | --- |
  | `::parse-options` | Graph and reference configuration for [[logseq.graph-parser.db-input/parse-block-input]]. |
  | `:additional-tx` | Additional datoms applied once after the batch, including in a preview. |

  Other options follow [[logseq.outliner.op/operation-options]]."
  [conn ops options]
  (assert (sequential? ops) ops)
  (if (= :logseq.outliner/preview-ops (ffirst ops))
    (do
      (assert (and (= 1 (count ops))
                   (= 2 (count (first ops)))
                   (sequential? (second (first ops)))
                   (= 1 (count (second (first ops))))
                   (sequential? (first (second (first ops))))) ops)
      (plan-ops! conn (first (second (first ops))) options))
    (do
      (outliner-op/validate-ops! (mapv canonical-shape ops))
      (doseq [[op args] ops]
        (case op
          :logseq.outliner/save-block-input (assert (string? (:block/title (first args))))
          :logseq.outliner/insert-blocks-input (assert (every? #(string? (:block/title %)) (first args)))
          nil))
      (if (some #(contains? #{:logseq.outliner/save-block-input :logseq.outliner/insert-blocks-input} (first %)) ops)
        (apply-content-ops! conn ops options)
        (outliner-op/apply-ops! conn ops (dissoc options ::parse-options))))))
