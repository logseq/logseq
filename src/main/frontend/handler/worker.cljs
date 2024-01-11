(ns frontend.handler.worker
  "Handle messages received from the db worker"
  (:require [cljs-bean.core :as bean]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [clojure.edn :as edn]
            [frontend.state :as state]
            [promesa.core :as p]))

(defmulti handle identity)

(defmethod handle :write-files [_ ^js worker data]
  (let [{:keys [request-id page-id repo files]} (edn/read-string data)]
    (p/let [_ (file-handler/alter-files repo files {})]
      (.page-file-saved worker request-id page-id))))

(defmethod handle :notification [_ _worker data]
  (apply notification/show! (edn/read-string data)))

(defmethod handle :add-repo [_ _worker data]
  (state/add-repo! {:url (:repo (edn/read-string data))}))

(defmethod handle :rtc-sync-state [_ _worker data]
  (let [state (edn/read-string data)]
    (state/pub-event! [:rtc/sync-state state])))

(defmethod handle :sync-db-changes [_ _worker data]
  (let [data (edn/read-string data)]
    (state/pub-event! [:db/sync-changes data])))

(defmethod handle :default [_ _worker data]
  (prn :debug "Worker data not handled: " data))

(defn handle-message!
  [^js worker wrapped-worker]
  (assert worker "worker doesn't exists")
  (set! (.-onmessage worker)
        (fn [event]
          (let [data (.-data event)]
            (when-not (= (.-type data) "RAW")
              (let [[e payload] (bean/->clj data)]
                (handle (keyword e) wrapped-worker payload)))))))
