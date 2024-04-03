(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [datascript.core :as d]))


(defn- entity-datoms=>attr->datom
  [entity-datoms]
  (reduce
   (fn [m datom]
     (let [[_e a _v t add?] datom]
       (if-let [[_e _a _v old-t old-add?] (get m a)]
         (cond
           (and (= old-t t)
                (true? add?)
                (false? old-add?))
           (assoc m a datom)

           (< old-t t)
           (assoc m a datom)

           :else
           m)
         (assoc m a datom))))
   {} entity-datoms))


(defmulti listen-db-changes
  (fn [listen-key & _] listen-key))

(defn listen-db-changes!
  [repo conn]
  (let [handlers (methods listen-db-changes)]
    (prn :listen-db-changes! (keys handlers))
    (d/unlisten! conn ::listen-db-changes!)
    (d/listen! conn ::listen-db-changes!
               (fn [{:keys [tx-data] :as args}]
                 (let [datom-vec-coll (map vec tx-data)
                       id->same-entity-datoms (group-by first datom-vec-coll)
                       id-order (distinct (map first datom-vec-coll))
                       same-entity-datoms-coll (map id->same-entity-datoms id-order)
                       id->attr->datom (update-vals id->same-entity-datoms entity-datoms=>attr->datom)]
                   (doseq [[k handler-fn] handlers]
                     (handler-fn k (assoc args
                                          :repo repo
                                          :id->attr->datom id->attr->datom
                                          :same-entity-datoms-coll same-entity-datoms-coll))))))))
