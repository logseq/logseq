(ns frontend.handler.worker
  "Handle messages received from the webworkers"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.context.i18n :as i18n]
            [frontend.handler.e2ee :as e2ee-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [promesa.core :as p]))

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

(defmethod handle :rtc-asset-upload-download-progress [_ _worker {:keys [repo asset-id progress]}]
  (when (and (seq repo) (seq asset-id) (map? progress))
    (state/update-state!
     :rtc/asset-upload-download-progress
     (fn [m] (assoc-in m [repo asset-id] progress)))))

(defmethod handle :asset-file-write-finish [_ _worker {:keys [repo asset-id ts]}]
  (when (and (seq repo) (seq asset-id))
    (state/update-state!
     :assets/asset-file-write-finish
     (fn [m] (assoc-in m [repo asset-id] (or ts (.now js/Date)))))))

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

(defn- <invoke-worker-thread-api
  [wrapped-worker qkw & args]
  (apply wrapped-worker qkw false args))

(defn- ui-request-error->payload
  [error]
  (let [data (ex-data error)]
    (merge {:code (or (:code data) :ui-request-failed)
            :message (or (ex-message error) (str error))}
           (when (seq data)
             {:data data}))))

(defn- <db-worker-ui-action
  [action payload]
  (case action
    :request-e2ee-password
    (p/let [password-promise (state/pub-event! [:rtc/request-e2ee-password payload])
            password password-promise]
      {:password password})

    :decrypt-user-e2ee-private-key
    (let [encrypted-private-key (:encrypted-private-key payload)]
      (p/let [private-key-promise (state/pub-event! [:rtc/decrypt-user-e2ee-private-key encrypted-private-key])
              private-key private-key-promise]
        (crypt/<export-private-key private-key)))

    :native-save-e2ee-password
    (let [{:keys [key encrypted-text]} payload]
      (if-not (and (string? key) (string? encrypted-text))
        (p/rejected (ex-info "invalid native-save-e2ee-password payload"
                             {:code :invalid-ui-action-payload
                              :action action
                              :payload payload}))
        (if-not (e2ee-handler/native-storage-supported?)
          (p/resolved {:supported? false})
          (p/let [_ (e2ee-handler/<native-save-secret! key encrypted-text)]
            {:supported? true}))))

    :native-get-e2ee-password
    (let [{:keys [key]} payload]
      (if-not (string? key)
        (p/rejected (ex-info "invalid native-get-e2ee-password payload"
                             {:code :invalid-ui-action-payload
                              :action action
                              :payload payload}))
        (if-not (e2ee-handler/native-storage-supported?)
          (p/resolved {:supported? false})
          (p/let [encrypted-text (e2ee-handler/<native-get-secret key)]
            {:supported? true
             :encrypted-text encrypted-text}))))

    :native-delete-e2ee-password
    (let [{:keys [key]} payload]
      (if-not (string? key)
        (p/rejected (ex-info "invalid native-delete-e2ee-password payload"
                             {:code :invalid-ui-action-payload
                              :action action
                              :payload payload}))
        (if-not (e2ee-handler/native-storage-supported?)
          (p/resolved {:supported? false})
          (p/let [_ (e2ee-handler/<native-delete-secret! key)]
            {:supported? true}))))

    (p/rejected (ex-info "unsupported db-worker ui action"
                         {:code :unsupported-ui-action
                          :action action
                          :payload payload}))))

(defn- <handle-db-worker-ui-request
  [wrapped-worker {:keys [request-id action payload]}]
  (if (and (string? request-id) (keyword? action))
    (-> (<db-worker-ui-action action payload)
        (p/then (fn [result]
                  (<invoke-worker-thread-api wrapped-worker
                                             :thread-api/resolve-ui-request
                                             request-id
                                             result)))
        (p/catch (fn [error]
                   (log/warn :db-worker/ui-request-failed
                             {:request-id request-id
                              :action action
                              :error error})
                   (<invoke-worker-thread-api wrapped-worker
                                              :thread-api/reject-ui-request
                                              request-id
                                              (ui-request-error->payload error)))))
    (log/error :db-worker/ui-request-invalid
               {:request-id request-id
                :action action
                :payload payload})))

(defmethod handle :db-worker/ui-request [_ wrapped-worker data]
  (<handle-db-worker-ui-request wrapped-worker data))

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
