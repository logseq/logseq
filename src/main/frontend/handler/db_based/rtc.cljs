(ns frontend.handler.db-based.rtc
  "RTC handler"
  (:require [frontend.state :as state]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.config :as config]))

(defn <rtc-create-graph!
  [repo]
  (let [token (state/get-auth-id-token)
        ^js worker @state/*db-worker]
    (.rtc-upload-graph worker repo token)))

(defn <rtc-start!
  [repo]
  (let [token (state/get-auth-id-token)
        ^object worker @state/*db-worker]
    (.rtc-start worker repo token
                (and config/dev?
                     (state/sub [:ui/developer-mode?])))))

;; TODO: rtc-get-graphs should be using HTTP GET instead of websocket,
;; because the user may not create any remote graph yet.
;; FIXME: missing graph name
(defn <get-remote-graphs
  []
  (let [repo (state/get-current-repo)
        token (state/get-auth-id-token)
        ^object worker @state/*db-worker]
    (p/let [result (.rtc-get-graphs worker repo token)
            graph-list (bean/->clj result)]
      graph-list
      ;; (swap! debug-state assoc
      ;;        :remote-graphs
      ;;        (map
      ;;         #(select-keys % [:graph-uuid :graph-status])
      ;;         graph-list))
      )))
