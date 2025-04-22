(ns capacitor.events
  (:require [cljs.core.async :as async]
            [frontend.modules.outliner.pipeline :as pipeline]
            [frontend.state :as state]
            [logseq.db :as ldb]
            [frontend.db :as db]
            [datascript.core :as d]
            [frontend.handler.page :as page-handler]
            [promesa.core :as p]))

(defmulti handle first)

(defmethod handle :db/sync-changes [[_ data]]
  (let [retract-datoms (filter (fn [d] (and (= :block/uuid (:a d)) (false? (:added d)))) (:tx-data data))
        retracted-tx-data (map (fn [d] [:db/retractEntity (:e d)]) retract-datoms)
        tx-data (concat (:tx-data data) retracted-tx-data)]
    (pipeline/invoke-hooks (assoc data :tx-data tx-data))

    nil))

(defmethod handle :default [[k]]
  (prn "[skip handle] " k))

(defn run!
  []
  (let [chan (state/get-events-chan)]
    (async/go-loop []
      (let [[payload d] (async/<! chan)]
        (->
          (try
            (p/resolved (handle payload))
            (catch :default error
              (p/rejected error)))
          (p/then (fn [result]
                    (p/resolve! d result)))
          (p/catch (fn [error]
                     (let [type :handle-system-events/failed]
                       (state/pub-event! [:capture-error {:error error
                                                          :payload {:type type
                                                                    :payload payload}}])
                       (p/reject! d error))))))
      (recur))
    chan))
