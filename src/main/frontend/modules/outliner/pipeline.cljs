(ns frontend.modules.outliner.pipeline
  (:require [frontend.modules.datascript-report.core :as ds-report]
            [frontend.modules.outliner.file :as file]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.db :as db]
            [clojure.set :as set]))

(defn updated-page-hook
  [tx-report page]
  (when-not (get-in tx-report [:tx-meta :created-from-journal-template?])
    (file/sync-to-file page (:outliner-op (:tx-meta tx-report)))))

;; TODO: it'll be great if we can calculate the :block/path-refs before any
;; outliner transaction, this way we can group together the real outliner tx
;; and the new path-refs changes, which makes both undo/redo and
;; react-query/refresh! easier.

;; TODO: also need to consider whiteboard transactions

;; Steps:
;; 1. For each changed block, new-refs = its page + :block/refs + parents :block/refs
;; 2. Its children' block/path-refs might need to be updated too.
(defn compute-block-path-refs
  [{:keys [tx-meta]} blocks]
  (let [repo (state/get-current-repo)
        blocks (remove :block/name blocks)]
    (when (:outliner-op tx-meta)
      (when (react/path-refs-need-recalculated? tx-meta)
        (let [*computed-ids (atom #{})]
          (mapcat (fn [block]
                    (when (and (not (@*computed-ids (:block/uuid block))) ; not computed yet
                               (not (:block/name block)))
                      (let [parents (db-model/get-block-parents repo (:block/uuid block))
                            parents-refs (->> (mapcat :block/path-refs parents)
                                              (map :db/id))
                            old-refs (set (map :db/id (:block/path-refs block)))
                            new-refs (set (util/concat-without-nil
                                           [(:db/id (:block/page block))]
                                           (map :db/id (:block/refs block))
                                           parents-refs))
                            refs-changed? (not= old-refs new-refs)
                            children (db-model/get-block-children-ids repo (:block/uuid block))
                            children-refs (map (fn [id]
                                                 (let [entity (db/entity [:block/uuid id])]
                                                   {:db/id (:db/id entity)
                                                    :block/path-refs (concat
                                                                      (map :db/id (:block/path-refs entity))
                                                                      new-refs)})) children)]
                        (swap! *computed-ids set/union (set (cons (:block/uuid block) children)))
                        (util/concat-without-nil
                         [(when (and (seq new-refs)
                                     refs-changed?)
                            {:db/id (:db/id block)
                             :block/path-refs new-refs})]
                         children-refs))))
                  blocks))))))

(defn invoke-hooks
  [tx-report]
  (let [tx-meta (:tx-meta tx-report)]
    (when (and (not (:from-disk? tx-meta))
               (not (:new-graph? tx-meta))
               (not (:compute-new-refs? tx-meta)))
      (let [{:keys [pages blocks]} (ds-report/get-blocks-and-pages tx-report)
            repo (state/get-current-repo)
            refs-tx (util/profile
                     "Compute path refs: "
                     (set (compute-block-path-refs tx-report blocks)))
            truncate-refs-tx (map (fn [m] [:db/retract (:db/id m) :block/path-refs]) refs-tx)
            tx (util/concat-without-nil truncate-refs-tx refs-tx)
            tx-report' (if (seq tx)
                         (let [refs-tx-data' (:tx-data (db/transact! repo tx {:outliner/transact? true
                                                                              :compute-new-refs? true}))]
                           ;; merge
                           (assoc tx-report :tx-data (concat (:tx-data tx-report) refs-tx-data')))
                         tx-report)
            importing? (:graph/importing @state/state)]

        (when-not importing?
          (react/refresh! repo tx-report'))

        (when-not (:delete-files? tx-meta)
          (doseq [p (seq pages)]
            (updated-page-hook tx-report p)))

        (when (and state/lsp-enabled?
                   (seq blocks)
                   (not importing?)
                   (<= (count blocks) 1000))
          (state/pub-event! [:plugin/hook-db-tx
                             {:blocks  blocks
                              :tx-data (:tx-data tx-report)
                              :tx-meta (:tx-meta tx-report)}]))))))
