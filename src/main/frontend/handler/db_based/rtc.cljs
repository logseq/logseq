(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [frontend.state :as state]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]))

(defn <rtc-create-graph!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-upload-graph worker repo token)))))

(defn <rtc-download-graph!
  [repo graph-uuid]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-download-graph worker repo token graph-uuid)))))

(defn <rtc-start!
  [repo]
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [token (state/get-auth-id-token)]
       (.rtc-start worker repo token
                   (and config/dev?
                        (state/sub [:ui/developer-mode?])))))))

;; TODO: shared graphs need `shared-by`, user name
(defn <get-remote-graphs
  []
  (when-let [^js worker @state/*db-worker]
    (user-handler/<wrap-ensure-id&access-token
     (let [repo (state/get-current-repo)
           token (state/get-auth-id-token)]
       (p/let [result (.rtc-get-graphs worker repo token)
               graphs (bean/->clj result)
               result (mapv (fn [graph]
                              {:GraphName (str (:graph-uuid graph)) ; FIXME: update when our server supports name
                               :GraphUUID (:graph-uuid graph)
                               :rtc-graph? true})
                            graphs)]
         (state/set-state! :rtc/graphs result))))))
