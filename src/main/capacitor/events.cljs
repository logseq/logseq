(ns capacitor.events
  (:require [cljs.core.async :as async]
            [frontend.db.transact :as db-transact]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
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

;(defn- graph-switch
;  ([graph]
;   (graph-switch graph false))
;  ([graph skip-ios-check?]
;   (let [db-based? (config/db-based-graph? graph)]
;     (if (and (mobile-util/native-ios?) (not skip-ios-check?))
;       (state/pub-event! [:validate-appId graph-switch graph])
;       (do
;         (state/set-current-repo! graph)
;         (page-handler/init-commands!)
;         ;; load config
;         (repo-config-handler/restore-repo-config! graph)
;         (when-not (= :draw (state/get-current-route))
;           (route-handler/redirect-to-home!))
;         (when-not db-based?
;           ;; graph-switch will trigger a rtc-start automatically
;           ;; (rtc-handler/<rtc-start! graph)
;           (file-sync-restart!))
;         (when-let [dir-name (and (not db-based?) (config/get-repo-dir graph))]
;           (fs/watch-dir! dir-name))
;         (graph-handler/settle-metadata-to-local! {:last-seen-at (js/Date.now)}))))))

(defn- graph-switch-on-persisted
  "graph: the target graph to switch to"
  [graph opts]
  (p/do!
    (repo-handler/restore-and-setup-repo! graph {:ignore-style? true})
    (state/set-current-repo! graph)))

(defmethod handle :graph/switch [[_ graph opts]]
  (state/set-state! :db/async-queries {})

  (p/let [writes-finished? (state/<invoke-db-worker :thread-api/file-writes-finished? (state/get-current-repo))]
    (if (not writes-finished?)
      (notification/show!
        "Please wait seconds until all changes are saved for the current graph."
        :warning)
      (graph-switch-on-persisted graph opts))))

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
