(ns frontend.handler.worker
  "Handle messages received from the webworkers"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.context.i18n :as i18n]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]))

(defmulti handle identity)

(defn- normalize-notification-payload
  [[content status clear? uid timeout extra]]
  (let [i18n-data (when (and (map? extra) (contains? extra :i18n-key))
                    extra)
        close-cb (when (fn? extra) extra)]
    {:content content
     :status status
     :clear? clear?
     :uid uid
     :timeout timeout
     :close-cb close-cb
     :i18n-data i18n-data}))

(defmethod handle :notification [_ _worker data]
  (let [{:keys [content status clear? uid timeout close-cb i18n-data]}
        (normalize-notification-payload data)
        translated-content (if-let [i18n-key (:i18n-key i18n-data)]
                             (apply i18n/t i18n-key (or (:i18n-args i18n-data) []))
                             content)]
    (notification/show! translated-content status clear? uid timeout close-cb)))

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

(defmethod handle :record-worker-client-id [_ _worker data]
  (when-let [client-id (:client-id data)]
    (state/set-db-worker-client-id! client-id)))

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
                  (if (.-isError (.-value ^js data))
                    (do (js/console.error "Unexpected webworker error:" (-> data bean/->clj (get-in [:value :value])))
                        (js/console.log (get-in (bean/->clj data) [:value :value :stack])))
                    (js/console.error "Unexpected webworker error :" data))
                  (if (string? data)
                    (let [[e payload] (ldb/read-transit-str data)]
                      (handle (keyword e) wrapped-worker payload))
                    (when-not (string/starts-with? (.-type data) "MP_")
                      (js/console.error "Worker received invalid data from worker: " data))))))))))
