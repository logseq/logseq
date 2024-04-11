(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.search :as search]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [promesa.core :as p]))


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

(defmethod listen-db-changes :sync-db-to-main-thread
  [_ {:keys [tx-meta repo conn] :as tx-report}]
  (let [{:keys [pipeline-replace? from-disk?]} tx-meta]
    (when-not pipeline-replace?
      (let [result (worker-pipeline/invoke-hooks repo conn tx-report (worker-state/get-context))
            tx-report' (:tx-report result)]
        (when result
          (let [data (merge
                      {:request-id (:request-id tx-meta)
                       :repo repo
                       :tx-data (:tx-data tx-report')
                       :tx-meta tx-meta}
                      (dissoc result :tx-report))]
            (worker-util/post-message :sync-db-changes data))

          (when-not from-disk?
            (p/do!
             (let [{:keys [blocks-to-remove-set blocks-to-add]} (search/sync-search-indice repo tx-report')
                   ^js wo (worker-state/get-worker-object)]
               (when wo
                 (when (seq blocks-to-remove-set)
                   (.search-delete-blocks wo repo (bean/->js blocks-to-remove-set)))
                 (when (seq blocks-to-add)
                   (.search-upsert-blocks wo repo (bean/->js blocks-to-add))))))))))))


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
                       id->attr->datom (update-vals id->same-entity-datoms entity-datoms=>attr->datom)
                       args* (assoc args
                                    :repo repo
                                    :conn conn
                                    :id->attr->datom id->attr->datom
                                    :same-entity-datoms-coll same-entity-datoms-coll)]
                   (doseq [[k handler-fn] handlers]
                     (handler-fn k args*)))))))
