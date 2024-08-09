(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [clojure.core.async :as async]
            [clojure.core.async.interop :refer [p->c]]
            [promesa.core :as p]
            [frontend.common.async-util :include-macros true :refer [<?]]))

(defonce *request-id (atom 0))
(defonce requests (async/chan 1000))
(defonce *unfinished-request-ids (atom #{}))

(defn request-finished?
  "Whether any DB transaction request has been finished"
  []
  (empty? @*unfinished-request-ids))

(defn get-next-request-id
  []
  (swap! *request-id inc))

(defn add-request!
  [request-id request-f]
  (let [resp (p/deferred)
        new-request {:id request-id
                     :request request-f
                     :response resp}]
    (swap! *unfinished-request-ids conj request-id)
    (async/go (async/>! requests new-request))
    resp))

(defn remove-request!
  [request-id]
  (swap! *unfinished-request-ids disj request-id))

(defn listen-for-requests []
  (async/go-loop []
    (when-let [{:keys [id request response]} (async/<! requests)]
      (try
        (let [result (<? (p->c (request)))]
          (if (:ex-data result)
            (do
              (js/console.error (:ex-message result) (:ex-data result))
              (p/reject! response result))
            (p/resolve! response result))
          (remove-request! id))
        (catch :default e
          (p/reject! response e)
          (remove-request! id)))
      (recur))))

(defn transact [worker-transact repo tx-data tx-meta]
  (let [request-id (get-next-request-id)
        tx-meta' (assoc tx-meta
                        :request-id request-id
                        ;; not from remote(rtc)
                        :local-tx? true)]
    (add-request! request-id (fn async-request []
                                   (worker-transact repo tx-data tx-meta')))))
