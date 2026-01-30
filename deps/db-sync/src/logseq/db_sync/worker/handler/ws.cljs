(ns logseq.db-sync.worker.handler.ws
  (:require [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.presence :as presence]
            [logseq.db-sync.worker.ws :as ws]))

(defn handle-ws-message! [^js self ^js ws raw]
  (let [message (-> raw protocol/parse-message ws/coerce-ws-client-message)]
    (if-not (map? message)
      (ws/send! ws {:type "error" :message "invalid request"})
      (case (:type message)
        "hello"
        (ws/send! ws {:type "hello" :t (sync-handler/t-now self)})

        "ping"
        (ws/send! ws {:type "pong"})

        "presence"
        (let [editing-block-uuid (:editing-block-uuid message)
              user (presence/get-user self ws)]
          (presence/update-presence! self ws {:editing-block-uuid editing-block-uuid})
          (ws/broadcast! self nil {:type "presence"
                                   :editing-block-uuid editing-block-uuid
                                   :user-id (:user-id user)}))

        "pull"
        (let [raw-since (:since message)
              since (if (some? raw-since) (sync-handler/parse-int raw-since) 0)]
          (if (or (and (some? raw-since) (not (number? since))) (neg? since))
            (ws/send! ws {:type "error" :message "invalid since"})
            (ws/send! ws (sync-handler/pull-response self since))))

        ;; "snapshot"
        ;; (send! ws (snapshot-response self))

        "tx/batch"
        (let [txs (:txs message)
              t-before (sync-handler/parse-int (:t-before message))]
          (if (string? txs)
            (ws/send! ws (sync-handler/handle-tx-batch! self ws txs t-before))
            (ws/send! ws {:type "tx/reject" :reason "invalid tx"})))

        (ws/send! ws {:type "error" :message "unknown type"})))))

(defn handle-ws [^js self request]
  (let [pair (js/WebSocketPair.)
        client (aget pair 0)
        server (aget pair 1)
        state (.-state self)]
    (.acceptWebSocket state server)
    (let [token (auth/token-from-request request)
          claims (auth/unsafe-jwt-claims token)
          user (presence/claims->user claims)]
      (when user
        (presence/add-presence! self server user))
      (presence/broadcast-online-users! self))
    (js/Response. nil #js {:status 101 :webSocket client})))
