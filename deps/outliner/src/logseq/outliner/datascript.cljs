(ns logseq.outliner.datascript
  "Provides fns related to wrapping datascript's transact!"
  (:require [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.property :as gp-property]
            [datascript.core :as d]
            [clojure.string :as string]
            [logseq.db :as ldb]))

(defn new-outliner-txs-state [] (atom []))

(defn outliner-txs-state?
  [state]
  (and
   (instance? cljs.core/Atom state)
   (coll? @state)))

(defn- remove-nil-from-transaction
  [txs]
  (some->> (common-util/remove-nils txs)
           (map (fn [x]
                  (if (map? x)
                    (update-vals x (fn [v]
                                     (if (vector? v)
                                       (remove nil? v)
                                       v)))
                    x)))))

(defn- update-refs-and-macros
  "When a block is deleted, refs are updated and macros associated with the block are deleted"
  [txs db repo opts set-state-fn]
  (if (= :delete-blocks (:outliner-op opts))
    (let [retracted-block-ids (->> (keep (fn [tx]
                                           (when (and (vector? tx)
                                                      (= :db.fn/retractEntity (first tx)))
                                             (second tx))) txs))
          retracted-blocks (map #(d/entity db %) retracted-block-ids)
          retracted-tx (->> (for [block retracted-blocks]
                              (let [refs (:block/_refs block)]
                                (map (fn [ref]
                                       (let [id (:db/id ref)
                                             block-content (gp-property/remove-properties
                                                            (:block/format block) (:block/content block))
                                             new-content (some-> (:block/content ref)
                                                                 (string/replace (re-pattern (common-util/format "(?i){{embed \\(\\(%s\\)\\)\\s?}}" (str (:block/uuid block))))
                                                                                 block-content)
                                                                 (string/replace (block-ref/->block-ref (str (:block/uuid block)))
                                                                                 block-content))
                                             tx (cond->
                                                 [[:db/retract (:db/id ref) :block/refs (:db/id block)]
                                                  [:db/retract (:db/id ref) :block/path-refs (:db/id block)]]
                                                  new-content
                                                  (conj [:db/add id :block/content new-content]))
                                             revert-tx (cond->
                                                        [[:db/add (:db/id ref) :block/refs (:db/id block)]
                                                         [:db/add (:db/id ref) :block/path-refs (:db/id block)]]
                                                         (:block/content ref)
                                                         (conj [:db/add id :block/content (:block/content ref)]))]
                                         {:tx tx :revert-tx revert-tx})) refs)))
                            (apply concat))
          retracted-tx' (mapcat :tx retracted-tx)
          revert-tx (mapcat :revert-tx retracted-tx)
          macros-tx (mapcat (fn [b]
                              ;; Only delete if last reference
                              (keep #(when (<= (count (:block/_macros (d/entity db (:db/id %))))
                                               1)
                                       (when (:db/id %) (vector :db.fn/retractEntity (:db/id %))))
                                    (:block/macros b)))
                            retracted-blocks)]
      (when (and (seq retracted-tx') (fn? set-state-fn))
        (set-state-fn [:editor/last-replace-ref-content-tx repo]
                      {:retracted-block-ids retracted-block-ids
                       :revert-tx revert-tx}))
      (concat txs retracted-tx' macros-tx))
    txs))

(defn transact!
  [txs tx-meta {:keys [repo conn set-state-fn]}]
  (let [txs (map (fn [m]
                   (if (map? m)
                     (dissoc m :block/children :block/meta :block/top? :block/bottom? :block/anchor
                             :block/title :block/body :block/level :block/container :db/other-tx
                             :block/unordered)
                     m)) txs)
        txs (remove-nil-from-transaction txs)
        txs (cond-> txs
              (= :delete-blocks (:outliner-op tx-meta))
              (update-refs-and-macros @conn repo tx-meta set-state-fn)

              true
              (distinct))]

    (when (seq txs)

      ;; (prn :debug "DB transact")
      ;; (cljs.pprint/pprint txs)

      (try
        (ldb/transact! conn txs (assoc tx-meta :outliner/transact? true))
        (catch :default e
          (js/console.error e)
          (throw e))))))
