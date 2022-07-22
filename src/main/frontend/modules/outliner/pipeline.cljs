(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.db.model :as db-model]
            [frontend.db :as db]
            [clojure.set :as set]))

(defn updated-page-hook
  [_tx-report page]
  (file/sync-to-file page))

(defn compute-block-refs
  [tx-meta blocks]
  (let [repo (state/get-current-repo)
        blocks (remove :block/name blocks)]
    (when-let [outliner-op (:outliner-op tx-meta)]
      (when (and (not (contains? #{:collapse-expand-blocks :delete-blocks} outliner-op))
                 ;; ignore move up/down since it doesn't affect the refs for any blocks
                 (not (contains? #{:move-blocks-up-down} (:move-op tx-meta))))
        (let [*computed-ids (atom #{})
              tx (mapcat (fn [block]
                           (when-not (@*computed-ids (:db/id block)) ; not computed yet
                             (let [parents (db-model/get-block-parents repo (:block/uuid block))
                                   parents-refs (->> (mapcat :block/refs parents)
                                                     (map :db/id))
                                   old-refs (set (map :db/id (:block/refs block)))
                                   new-refs (set (concat old-refs
                                                         [(:db/id (:block/page block))]
                                                         parents-refs))
                                   refs-changed? (not= old-refs new-refs)
                                   children (db-model/get-block-children-ids repo (:block/uuid block))
                                   children-refs (map (fn [id]
                                                        {:db/id id
                                                         :block/refs (concat (map :db/id (:refs (db/entity id)))
                                                                             new-refs)}) children)]
                               (swap! *computed-ids set/union (set (cons (:db/id block) children)))
                               (util/concat-without-nil
                                [(when (and refs-changed? (seq new-refs))
                                   {:db/id (:db/id block)
                                    :block/refs new-refs})]
                                children-refs))))
                         blocks)]
          (prn "refs tx: " tx)
          tx)))))

(defn invoke-hooks
  [tx-report]
  (when (and (not (:from-disk? (:tx-meta tx-report)))
             (not (:new-graph? (:tx-meta tx-report))))
    (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
          repo (state/get-current-repo)
          refs-tx (set (compute-block-refs (:tx-meta tx-report) blocks))]
      (when (seq refs-tx)
        (db/transact! repo refs-tx {:outliner/transact? true
                                    :compute-new-refs? true}))
      (doseq [p (seq pages)]
        (updated-page-hook tx-report p))
      (when (and state/lsp-enabled? (seq blocks))
        (state/pub-event! [:plugin/hook-db-tx
                           {:blocks  blocks
                            :tx-data (:tx-data tx-report)
                            :tx-meta (:tx-meta tx-report)}])))))
