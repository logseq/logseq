(ns frontend.modules.crdt.outliner
  (:require [frontend.db :as db]
            [frontend.modules.outliner.core :as outliner-core]))

(defn- find-left-target
  [upserts target-block]
  (def upserts upserts)
  (def target-block target-block)
  (let [upserts-m (zipmap (map (juxt :block/parent :block/left) upserts)
                          upserts)]
    (loop [target target-block]
      (if-let [next-target (get upserts-m [(:block/parent target)
                                           [:block/uuid (:block/uuid target)]])]
        (recur next-target)
        target))))

(defn- ensure-no-parent-left-conflicts
  [graph tx]
  (let [db (db/get-db graph)
        upserts (remove vector? tx)
        delete-ids (->> (filter vector? tx)
                        (map second)
                        (set))]
    (if (seq upserts)
      ;; Find blocks that have the same parent && left with upserts and fix them
      (concat tx
              (keep (fn [b]
                      (let [result (outliner-core/get-by-parent-&-left
                                    (second (:block/parent b))
                                    (second (:block/left b)))]
                        (when (and result
                                   ;; same block
                                   (not= (:block/uuid result) (:block/uuid b))

                                   ;; result was deleted
                                   (not (contains? delete-ids (:db/id result)))

                                   ;; result's left has been changed
                                   (not (some (fn [b']
                                                (and (= (:block/uuid b') (:block/uuid result))
                                                     (not= (:block/left b') (:block/uuid result)))) upserts)))
                          (when-let [left-target (find-left-target upserts b)]
                            {:db/id (:db/id result)
                             :block/left [:block/uuid (:block/uuid left-target)]})))) upserts))
      tx)))

;; TODO: random concurrent operations to find all the edge cases
(defn merge-remote-changes!
  "Merge remote changes from either the server or clients.
  Notice that `:db/id` need to be changed to `:block/uuid` in `changes`."
  [graph changes yjs-event]
  (prn {:graph graph
        :changes changes})
  (let [tx (keep
            (fn [{:keys [action] :as data}]
              (let [ent (db/entity graph [:block/uuid (:block-id data)])]
                (case action
                  :delete
                  (when (:db/id ent)
                    [:db/retractEntity (:db/id ent)])

                  :upsert
                  (let [data' (dissoc (:block data) :db/id)]
                    (if (:db/id ent)
                      ;; update
                      data'

                      ;; insert
                      data')))))
            changes)
        tx' (ensure-no-parent-left-conflicts graph tx)
        skip-remote-sync? (= tx tx')]
    (db/transact! graph tx {:skip-remote-sync? skip-remote-sync?})))
