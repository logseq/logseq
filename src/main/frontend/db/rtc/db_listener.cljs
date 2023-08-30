(ns frontend.db.rtc.db-listener
  "listen datascript changes, infer operations from the db tx-report"
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.rtc.op :as op]
            [frontend.util :as util]))



(defn- gen-block-ops
  [repo same-entity-datoms]
  (when (seq same-entity-datoms)
    (let [ops (reduce (fn [r [_e a v _t add?]]
                        (cond
                          (and add? (contains? #{:block/left :block/parent} a))
                          (conj r :move)

                          (and (not add?) (contains? #{:block/content} a))
                          (conj r :update)

                          (and (not add?) (= :block/uuid a))
                          (reduced #{{:remove v}})

                          :else r))
                      #{} same-entity-datoms)]
      (when (seq ops)
        (if-let [removed-block-uuid (:remove (first ops))]
          [["remove" {:block-uuids [(str removed-block-uuid)]}]]
          (let [e (ffirst same-entity-datoms)]
            (when-let [block-uuid (:block/uuid (db/entity repo e))]
              (mapv (fn [op]
                      (case op
                        :move ["move" {:block-uuid (str block-uuid)}]
                        :update ["update" {:block-uuid (str block-uuid)}])) ops))))))))

(defn- gen-page-ops
  [repo same-entity-datoms]
  (let [r (reduce (fn [r [_e a v _t add?]]
                    (cond
                      (and (= a :block/uuid) add?)
                      (reduced (assoc r :block/uuid v))

                      (and (= a :block/name) add?)
                      (assoc r :block/name v)

                      (and (= a :block/uuid) (not add?))
                      (assoc r :block/uuid v :remove? true)

                      :else r))
                  {:block/name nil :block/uuid nil :remove? false}
                  same-entity-datoms)
        block-uuid (or (:block/uuid r)
                       (and (:block/name r)
                            (:block/uuid (db/entity repo [:block/name (:block/name r)]))))]
    (when block-uuid
      (if (:remove? r)
        [["remove-page" {:block-uuid (str block-uuid)}]]
        [["update-page" {:block-uuid (str block-uuid)}]]
        ))))

(defn dispatch-gen-ops-handler
  [repo datoms]
  (let [same-entity-datoms-coll (->> datoms
                                     (map vec)
                                     (group-by first)
                                     vals)
        ops
        (loop [ops-coll []
               [same-entity-datoms & same-entity-datoms-coll*] same-entity-datoms-coll]
          (if-not same-entity-datoms
            (apply concat ops-coll)
            (let [ops (loop [[datom & others] same-entity-datoms]
                        (when-let [[_e a _v _t _add?] datom]
                          (cond
                            (contains? #{:block/parent :block/left :block/content} a)
                            (gen-block-ops repo same-entity-datoms)

                            (contains? #{:block/name} a)
                            (gen-page-ops repo same-entity-datoms)

                            :else
                            (recur others))))]
              (recur (conj ops-coll ops) same-entity-datoms-coll*))))]
    (prn :ops ops)
    ))


(defn listen-db-to-generate-ops
  [repo conn]
  (d/listen! conn :gen-ops
             (fn [{:keys [tx-data tx-meta]}]
               (when (:persist-op? tx-meta true)
                 (dispatch-gen-ops-handler repo tx-data)))))
