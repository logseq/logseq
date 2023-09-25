(ns frontend.db.rtc.db-listener
  "listen datascript changes, infer operations from the db tx-report"
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.rtc.op :as op]
            [clojure.set :as set]))


(defn- entity-datoms=>attr->datom
  [entity-datoms]
  (reduce
   (fn [m datom]
     (let [[_e a _v t _add?] datom]
       (if-let [[_e _a _v old-t _old-add?] (get m a)]
         (if (< old-t t)
           (assoc m a datom)
           m)
         (assoc m a datom))))
   {} entity-datoms))

(defn- entity-datoms=>ops
  [repo entity-datoms]
  (let [attr->datom (entity-datoms=>attr->datom entity-datoms)]
    (when (seq attr->datom)
      (let [updated-key-set (set (keys attr->datom))
            e (some-> attr->datom first second first)
            {[_e _a block-uuid _t add1?] :block/uuid
             [_e _a _v _t add2?]  :block/name
             [_e _a _v _t add3?]  :block/parent
             [_e _a _v _t add4?]  :block/left
             [_e _a _v _t _add5?] :block/alias
             [_e _a _v _t _add6?] :block/type
             [_e _a _v _t _add7?] :block/schema
             [_e _a _v _t _add8?] :block/content} attr->datom
            ops (cond
                  (and (not add1?) block-uuid
                       (not add2?) (contains? updated-key-set :block/name))
                  [[:remove-page block-uuid]]

                  (and (not add1?) block-uuid)
                  [[:remove block-uuid]]

                  :else
                  (cond-> []
                    (or add3? add4?)
                    (conj [:move])

                    (seq (set/intersection updated-key-set #{:block/alias :block/type :block/schema :block/content}))
                    (conj [:update])

                    (and (contains? updated-key-set :block/name) add2?)
                    (conj [:update-page])))
            ops* (keep (fn [op]
                         (when-let [block-uuid (some-> (db/entity repo e) :block/uuid str)]
                           (case (first op)
                             :move ["move" {:block-uuids [block-uuid]}]
                             :update ["update" {:block-uuid block-uuid}]
                             :remove ["remove" {:block-uuids [(str (second op))]}]
                             :update-page ["update-page" {:block-uuid block-uuid}]
                             :remove-page ["remove-page" {:block-uuid (str (second op))}])))
                       ops)]
        (prn ::ops ops* attr->datom)
        ops*))))

(defn- rtc-ops-handler
  [repo datoms]
  (let [same-entity-datoms-coll (->> datoms
                                     (map vec)
                                     (group-by first)
                                     vals)
        ops (mapcat (partial entity-datoms=>ops repo) same-entity-datoms-coll)]
    (op/<add-ops! repo ops)))


(defn listen-db-to-generate-ops
  [repo conn]
  (d/listen! conn :gen-ops
             (fn [{:keys [tx-data tx-meta]}]
               (when (:persist-op? tx-meta true)
                 (rtc-ops-handler repo tx-data)))))
