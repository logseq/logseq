(ns frontend.db.transact
  "Provides async transact for use with ldb/transact!"
  (:require [clojure.core.async :as async]
            [clojure.core.async.interop :refer [p->c]]
            [frontend.common.async-util :include-macros true :refer [<?]]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

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

(defn- capture-error
  [error]
  (state/pub-event! [:capture-error
                     {:error error
                      :payload {:type :worker-request-failed}}]))

(defn listen-for-requests []
  (prn "[debug] setup listen for worker request!")
  (async/go-loop []
    (when-let [{:keys [id request response]} (async/<! requests)]
      (try
        (let [result (<? (p->c (request)))]
          (if (:ex-data result)
            (do
              (log/error :worker-request-failed result)
              (p/reject! response result)
              (capture-error result))
            (p/resolve! response result))
          (remove-request! id))
        (catch :default e
          (log/error :worker-request-failed e)
          (p/reject! response e)
          (capture-error e)
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
