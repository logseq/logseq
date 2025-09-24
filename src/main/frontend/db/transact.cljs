(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [promesa.core :as p]))

(defonce *request-id (atom 0))

(defonce *db-transact-requests (atom {}))

(defn get-next-request-id
  []
  (swap! *request-id inc))

(defn get-resp
  [request-id]
  (get @*db-transact-requests request-id))

(defn remove-request!
  [request-id]
  (swap! *db-transact-requests dissoc request-id))

(defn add-request!
  [request-id request-f]
  (->
   (let [ui-db-transacted-promise (p/deferred)]
     (swap! *db-transact-requests assoc request-id ui-db-transacted-promise)
     (p/let [reply (request-f)]
       ui-db-transacted-promise
       reply))
   (p/finally
     (fn []
       (remove-request! request-id)))))

(defn transact [worker-transact repo tx-data tx-meta]
  (let [request-id (get-next-request-id)
        tx-meta' (assoc tx-meta
                        :request-id request-id
                        ;; not from remote (rtc)
                        :local-tx? true)]
    (add-request! request-id (fn async-request []
                               (worker-transact repo tx-data tx-meta')))))
