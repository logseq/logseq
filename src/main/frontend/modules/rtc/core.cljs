(ns frontend.modules.rtc.core
  (:require [cljs.spec.alpha :as s]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.spec :as spec :refer-macros [valid?]]
            [frontend.modules.outliner.core2 :as outliner-core]
            [clojure.set :as set]
            [taoensso.encore :refer [cond]]))

;;; specs
(s/def ::prev-block (s/or :block-uuid int?
                          :just-after-page-node nil?))

(s/def ::block-pos (s/cat :page-name string?
                          :prev-block ::prev-block
                          :sibling? boolean?))

(s/def ::operated-block-uuids (s/coll-of int? :kind vector? :distinct true))

;; TODO insert-blocks-op
(s/def ::insert-block-op (s/cat :op-name #{:insert-block-op}
                                :blocks-pos (s/coll-of ::block-pos)
                                :operated-block-uuids ::operated-block-uuids
                                :data string?))
;; TODO update-blocks-op
(s/def ::update-block-op (s/cat :op-name #{:update-block-op}
                                :blocks-pos (s/coll-of ::block-pos)
                                :operated-block-uuids ::operated-block-uuids
                                :data string?))

(s/def ::delete-blocks-op (s/cat :op-name #{:delete-blocks-op}
                                 :operated-block-uuids ::operated-block-uuids))

(s/def ::move-blocks-op (s/cat :op-name #{:move-blocks-op}
                               :block-pos (s/tuple ::block-pos)
                               :operated-block-uuids ::operated-block-uuids))

(s/def ::op (s/or :insert-block-op ::insert-block-op
                  :update-block-op ::update-block-op
                  :delete-blocks-op ::delete-blocks-op
                  :move-blocks-op ::move-blocks-op))


;;; utils

(defn- block-exists? [block-uuid db]
  (some? (d/datoms db :avet :block/uuid block-uuid)))

(defn- find-prev-exist-block
  "return nil when no prev-block"
  [block-uuid server-db client-db _page-name]
  (loop [block-uuid block-uuid]
    (if (block-exists? block-uuid server-db)
      block-uuid
      (let [block (d/entity client-db [:block/uuid block-uuid])
            prev-block-entity (outliner-core/get-prev block client-db)]
        (when-not (outliner-core/page-node? prev-block-entity client-db)
          (recur (:block/uuid prev-block-entity)))))))

(defn- get-target-node-by-block-pos
  [block-pos db]
  {:post [(some? %)]}
  (let [prev-block (:prev-block block-pos)]
    (case (first prev-block)
      :block-uuid
      (d/entity db [:block/uuid (second prev-block)])
      :just-after-page-node
      (d/entity db [:block/name (:page-name block-pos)]))))


;;; utils ends


;;; apply-op: (pure) return transact-data


(comment
  ;; defmulti macro use defonce, so re-eval do nothing,
  ;; use ns-unmap to undefine apply-op, then re-define it
  (ns-unmap 'frontend.modules.rtc.core 'apply-op))

(defmulti apply-op (fn [op _] (first op)))

(defmethod apply-op :insert-block-op [op db]
  {:pre  [(valid? ::insert-block-op op)]}
  (let [op (s/conform ::insert-block-op op)
        block-pos (first (:blocks-pos op))
        target-entity (get-target-node-by-block-pos block-pos db)
        siblings? (:sibling? block-pos)
        block-uuid (first (:operated-block-uuids op))]
    (outliner-core/insert-nodes [{:data (:data op) :block/uuid block-uuid :level 1}]
                                db
                                target-entity
                                siblings?)))

(defmethod apply-op :update-block-op [op _db]
  {:pre [(valid? ::update-block-op op)]}
  (let [op (s/conform ::update-block-op op)
        block-uuid (first (:operated-block-uuids op))]
    [{:data (:data op) :block/uuid block-uuid}]))

(defmethod apply-op :delete-blocks-op [op db]
  {:pre [(valid? ::delete-blocks-op op)]}
  (let [op (s/conform ::delete-blocks-op op)
        block-uuids (:operated-block-uuids op)]
    (outliner-core/delete-nodes
     (map #(d/entity db [:block/uuid %])
          block-uuids)
     db)))

(defmethod apply-op :move-blocks-op [op db]
  {:pre [(valid? ::move-blocks-op op)]}
  (let [op (s/conform ::move-blocks-op op)
        block-pos (first (:block-pos op))
        block-uuids (:operated-block-uuids op)
        target-entity (get-target-node-by-block-pos block-pos db)
        siblings? (:sibling? block-pos)]
    (outliner-core/move-nodes
     (map #(d/entity db [:block/uuid %]) block-uuids) db target-entity siblings?)))

(defmulti apply-op-on-altered-db (fn [op _ _] (first op)))

(defmethod apply-op-on-altered-db :insert-block-op
  [op server-db client-db]
  {:pre  [(valid? ::insert-block-op op)]
   :post [(valid? (s/coll-of ::op) %)]}
  (let [op* (s/conform ::insert-block-op op)
        block-pos (first (:blocks-pos op*))
        prev-block (:prev-block block-pos)]
    (case (first prev-block)
      :block-uuid
      (let [prev-block-uuid (second prev-block)
            prev-block-uuid* ;; maybe nil, means page-node
            (find-prev-exist-block prev-block-uuid server-db client-db nil)
            blocks-pos*
            [(assoc block-pos :prev-block
                    (if (nil? prev-block-uuid*)
                      [:just-after-page-node nil]
                      [:block-uuid prev-block-uuid*]))]]
        [(s/unform ::insert-block-op
                   (assoc op* :blocks-pos blocks-pos*))])
      :just-after-page-node
      [op])))

(defmethod apply-op-on-altered-db :update-block-op
  [op server-db client-db]
  {:pre  [(valid? ::update-block-op op)]
   :post [(valid? (s/coll-of ::op) %)]}
  (let [op* (s/conform ::update-block-op op)
        block-pos (first (:blocks-pos op*))
        prev-block (:prev-block block-pos)
        operated-block-uuid (first (:operated-block-uuids op*))
        block-pos*
        (case (first prev-block)
          :block-uuid
          (let [prev-block-uuid (second prev-block)
                prev-block-uuid*
                (find-prev-exist-block
                 prev-block-uuid server-db client-db nil)]
            (assoc block-pos :prev-block
                   (if (nil? prev-block-uuid*)
                     [:just-after-page-node nil]
                     [:block-uuid prev-block-uuid*])))
          :just-after-page-node
          block-pos)]
    (if (block-exists? operated-block-uuid server-db)
      [(s/unform ::update-block-op
                 (assoc op* :blocks-pos [block-pos*]))]
      [[:insert-block-op
        [(s/unform ::block-pos block-pos*)]
        (:operated-block-uuids op*)
        (:data op*)]])))

(defmethod apply-op-on-altered-db :delete-blocks-op
  [op server-db _client-db]
  {:pre  [(valid? ::delete-blocks-op op)]
   :post [(valid? (s/coll-of ::op) %)]}
  (let [op* (s/conform ::delete-blocks-op op)
        block-uuids (:operated-block-uuids op*)
        block-uuids*
        (->> block-uuids
             (filterv #(block-exists? % server-db))
             (mapv #(d/entity server-db [:block/uuid %]))
             (#(outliner-core/with-children-nodes % server-db))
             (mapv :block/uuid))]
    (if (empty? block-uuids*)
      []
      [(s/unform ::delete-blocks-op
                 (assoc op* :operated-block-uuids block-uuids*))])))

(defn- split&complete-move-blocks-op
  "operated-block-uuids of MOVE-OP may not consecutive and complete(nodes with its all children) in server-db,
  because MOVE-OP is generated based on client-db.
  this fn split MOVE-OP into a sequence of move-ops.
  Example:
  server-db:
  - 1
    - 2
      - 3
    - 4
    - 6
      - 7
  operated-block-uuids: [6 2 3]
  return: [{:move-blocks-op <pos> [2 3]} {:move-blocks-op <after 2 as sibling> [6 7]}]
  NOTE: MOVE-OP is `s/conform`ed"
  [move-op server-db]
  (let [block-pos (first (:block-pos move-op))
        operated-block-uuids (:operated-block-uuids move-op)
        t-ops (transient [])
        seen (volatile! #{})]
    (loop [block-pos block-pos
           [block-uuid & tail] operated-block-uuids]
      (when block-uuid
        (cond
          (contains? @seen block-uuid)
          (recur block-pos tail)

          :let [node (d/entity server-db [:block/uuid block-uuid])]
          (nil? node)
          (recur block-pos tail)

          :else
          (let [nodes (outliner-core/get-children-nodes node server-db)
                block-uuids (mapv :block/uuid nodes)]
            (if (seq (set/intersection (set block-uuids) @seen))
              (recur block-pos tail)
              (do
                (conj! t-ops [:move-blocks-op
                              [(s/unform ::block-pos block-pos)]
                              block-uuids])
                (vreset! seen (set/union @seen (set block-uuids)))
                (recur (assoc block-pos
                              :prev-block [:block-uuid (first block-uuids)]
                              :sibling? true)
                       tail)))))))
    (persistent! t-ops)))

(defmethod apply-op-on-altered-db :move-blocks-op
  [op server-db client-db]
  {:pre  [(valid? ::move-blocks-op op)]
   :post [(valid? (s/coll-of ::op) %)]}
  (let [op* (s/conform ::move-blocks-op op)
        block-pos (first (:block-pos op*))
        prev-block (:prev-block block-pos)
        block-pos*
        (case (first prev-block)
          :block-uuid
          (let [prev-block-uuid (second prev-block)
                prev-block-uuid*
                (find-prev-exist-block prev-block-uuid server-db client-db nil)]
            (assoc block-pos :prev-block
                   (if (nil? prev-block-uuid*)
                     [:just-after-page-node nil]
                     [:block-uuid prev-block-uuid*])))
          :just-after-page-node
          (assoc block-pos :prev-block [:just-after-page-node nil]))
        r (split&complete-move-blocks-op (assoc op* :block-pos [block-pos*]) server-db)
        block-pos-block-uuid (-> block-pos* :prev-block second)
        all-block-uuids-set (into #{}
                                  (comp
                                   (map #(:operated-block-uuids (s/conform ::move-blocks-op %)))
                                   cat) r)]
    (if (and block-pos-block-uuid
             (contains? all-block-uuids-set block-pos-block-uuid))
      ;; return empty ops when move blocks to target which is the member of these blocks
      []
      r)))
