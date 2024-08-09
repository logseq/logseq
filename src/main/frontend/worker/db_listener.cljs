(ns frontend.worker.db-listener
  "Db listeners for worker-db."
  (:require [cljs-bean.core :as bean]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.search :as search]
            [frontend.worker.state :as worker-state]
            [frontend.worker.util :as worker-util]
            [promesa.core :as p]
            [logseq.outliner.batch-tx :as batch-tx]
            [frontend.common.schema-register :as sr]))


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

(defn- entity-datoms=>a->add?->v->t
  [entity-datoms]
  (reduce
   (fn [m datom]
     (let [[_e a v t add?] datom]
       (assoc-in m [a add? v] t)))
   {} entity-datoms))


(defmulti listen-db-changes
  (fn [listen-key & _] listen-key))

(sr/defkeyword :sync-db-to-main-thread
  "DB-listener key.
sync worker-db changes to main-thread")

(sr/defkeyword :gen-rtc-ops
  "DB-listener key.
generate rtc ops.")

(sr/defkeyword :gen-undo-ops
  "DB-listener key.
generate undo ops.")

(sr/defkeyword :gen-asset-change-events
  "DB-listener key.
generate asset-change events.")

(defmethod listen-db-changes :sync-db-to-main-thread
  [_ {:keys [tx-meta repo conn] :as tx-report}]
  (let [{:keys [from-disk?]} tx-meta
        result (worker-pipeline/invoke-hooks repo conn tx-report (worker-state/get-context))
        tx-report' (:tx-report result)]
    (when (and result (not (:rtc-download-graph? tx-meta)))
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
                (.search-upsert-blocks wo repo (bean/->js blocks-to-add))))))))))


(defn listen-db-changes!
  [repo conn & {:keys [handler-keys]}]
  (let [handlers (if (seq handler-keys)
                   (select-keys (methods listen-db-changes) handler-keys)
                   (methods listen-db-changes))]
    (d/unlisten! conn ::listen-db-changes!)
    (prn :listen-db-changes! (keys handlers))
    (d/listen! conn ::listen-db-changes!
               (fn [{:keys [tx-data _db-before _db-after tx-meta] :as tx-report}]
                 (let [tx-meta (merge (batch-tx/get-batch-opts) tx-meta)
                       pipeline-replace? (:pipeline-replace? tx-meta)
                       in-batch-tx-mode? (:batch-tx/batch-tx-mode? tx-meta)]
                   (batch-tx/set-batch-opts (dissoc tx-meta :pipeline-replace?))
                   (when-not pipeline-replace?
                     (if (and in-batch-tx-mode?
                              (not (:batch-tx/exit? tx-meta)))
                       (batch-tx/conj-batch-txs! tx-data)
                       (let [db-before (if in-batch-tx-mode?
                                         (batch-tx/get-batch-db-before)
                                         (:db-before tx-report))
                             tx-data (if in-batch-tx-mode?
                                       (batch-tx/get-batch-txs)
                                       tx-data)
                             tx-meta (dissoc tx-meta :batch-tx/batch-tx-mode? :batch-tx/exit?)
                             tx-report (assoc tx-report
                                              :tx-meta tx-meta
                                              :tx-data tx-data
                                              :db-before db-before)
                             ;; TODO: move to RTC because other modules do not need these
                             datom-vec-coll (map vec tx-data)
                             id->same-entity-datoms (group-by first datom-vec-coll)
                             id-order (distinct (map first datom-vec-coll))
                             same-entity-datoms-coll (map id->same-entity-datoms id-order)
                             id->attr->datom (update-vals id->same-entity-datoms entity-datoms=>attr->datom)
                             e->a->add?->v->t (update-vals
                                               id->same-entity-datoms
                                               entity-datoms=>a->add?->v->t)
                             args* (assoc tx-report
                                          :repo repo
                                          :conn conn
                                          :id->attr->datom id->attr->datom
                                          :e->a->add?->v->t e->a->add?->v->t
                                          :same-entity-datoms-coll same-entity-datoms-coll)]
                         (doseq [[k handler-fn] handlers]
                           (handler-fn k args*))))))))))
