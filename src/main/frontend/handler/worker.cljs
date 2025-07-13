(ns frontend.handler.worker
  "Handle messages received from the db worker"
  (:require [cljs-bean.core :as bean]
            [frontend.handler.file-based.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defmulti handle identity)

(defmethod handle :write-files [_ _worker data]
  (let [{:keys [request-id page-id repo files]} data]
    (->
     (p/let [_ (file-handler/alter-files repo files {})]
       (state/<invoke-db-worker :thread-api/page-file-saved request-id page-id))
     (p/catch (fn [error]
                (notification/show!
                 [:div
                  [:p "Write file failed, please copy the changes to other editors in case of losing data."]
                  "Error: " (str (.-stack error))]
                 :error)
                (state/<invoke-db-worker :thread-api/page-file-saved request-id page-id))))))

(defmethod handle :notification [_ _worker data]
  (apply notification/show! data))

(defmethod handle :log [_ _worker [name level data]]
  (log/log name level data))

(defmethod handle :add-repo [_ _worker data]
  (state/add-repo! {:url (:repo data)})
  (state/pub-event! [:graph/switch (:repo data) {:rtc-download? true}]))

(defmethod handle :rtc-sync-state [_ _worker data]
  (let [state data]
    (state/pub-event! [:rtc/sync-state state])))

(defmethod handle :sync-db-changes [_ _worker data]
  (state/pub-event! [:db/sync-changes data]))

(defmethod handle :rtc-log [_ _worker log]
  (state/pub-event! [:rtc/log log]))

(defmethod handle :export-current-db [_]
  (state/pub-event! [:db/export-sqlite]))

(defmethod handle :capture-error [_ _worker data]
  (state/pub-event! [:capture-error data]))

(defmethod handle :backup-file [_ _worker data]
  (state/pub-event! [:graph/backup-file data]))

(defmethod handle :notify-existing-file  [_ _worker data]
  (state/pub-event! [:graph/notify-existing-file data]))

(defmethod handle :remote-graph-gone []
  (state/pub-event! [:rtc/remote-graph-gone]))

(defmethod handle :default [_ _worker data]
  (prn :debug "Worker data not handled: " data))

(defn handle-message!
  [^js worker wrapped-worker]
  (assert worker "worker doesn't exists")
  (set! (.-onmessage worker)
        (fn [event]
          (let [data (.-data event)]
            (if (= data "keepAliveResponse")
              (.postMessage worker "keepAliveRequest")
              (when-not (contains? #{"RAW" "APPLY" "RELEASE"} (.-type data))
                ;; Log thrown exceptions from comlink
                ;; https://github.com/GoogleChromeLabs/comlink/blob/dffe9050f63b1b39f30213adeb1dd4b9ed7d2594/src/comlink.ts#L223-L236
                (if (and (= "HANDLER" (.-type data)) (= "throw" (.-name data)))
                  (if (.-isError (.-value data))
                    (do (js/console.error "Unexpected webworker error:" (-> data bean/->clj (get-in [:value :value])))
                        (js/console.log (get-in (bean/->clj data) [:value :value :stack])))
                    (js/console.error "Unexpected webworker error :" data))
                  (if (string? data)
                    (let [[e payload] (ldb/read-transit-str data)]
                      (handle (keyword e) wrapped-worker payload))
                    (js/console.error "Worker received invalid data from worker: " data)))))))))
