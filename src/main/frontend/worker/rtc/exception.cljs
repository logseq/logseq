(ns frontend.worker.rtc.exception
  "Exception list"
  (:require [logseq.common.defkeywords :refer [defkeywords]])
  (:import [missionary Cancelled]))

(defkeywords
  :rtc.exception/ws-already-disconnected {:doc "Remote exception. current websocket conn is already disconnected and deleted by remote."}
  :rtc.exception/remote-graph-not-exist {:doc "Remote exception. e.g. push client-updates to a deleted graph."}
  :rtc.exception/remote-graph-not-ready {:doc "Remote exception. Remote graph is still creating."}
  :rtc.exception/remote-graph-lock-missing {:doc "
Remote exception. Failed to remote graph lock isn't exist.
It's a server internal error, shouldn't happen."}
  :rtc.exception/invalid-token {:doc "Local exception"}
  :rtc.exception/not-rtc-graph {:doc "Local exception. Trying to start rtc loop on a local-graph."}
  :rtc.exception/lock-failed {:doc "Local exception.
Trying to start rtc loop but there's already one running, need to cancel that one first."}
  :rtc.exception/not-found-db-conn {:doc "Local exception. Cannot find db-conn by repo"}
  :rtc.exception/not-found-schema-version {:doc "Local exception. graph doesn't have :logseq.kv/schema-version value"}
  :rtc.exception/not-found-remote-schema-version {:doc "Local exception.
graph doesn't have :logseq.kv/remote-schema-version value"}
  :rtc.exception/major-schema-version-mismatched {:doc "Local exception.
local-schema-version, remote-schema-version, app-schema-version are not equal, cannot start rtc"}
  :rtc.exception/get-s3-object-failed {:doc "Failed to fetch response from s3.
When response from remote is too huge(> 32KB),
the server will put it to s3 and return its presigned-url to clients."}
  :rtc.exception/bad-request-body {:doc "bad request body, rejected by server-schema"}
  :rtc.exception/not-allowed {:doc "this api-call is not allowed"}
  :rtc.exception/ws-timeout {:doc "websocket timeout"}

  :rtc.exception/fetch-user-rsa-key-pair-error {:doc "Failed to fetch user RSA key pair from server"}
  :rtc.exception/fetch-graph-aes-key-error {:doc "Failed to fetch graph AES key from server"}
  :rtc.exception/upload-graph-encrypted-aes-key-error {:doc "Failed to upload graph encrypted AES key to server"}
  :rtc.exception/upload-user-rsa-key-pair-error {:doc "Failed to upload user RSA key pair to server"}
  )

(def ex-ws-already-disconnected
  (ex-info "websocket conn is already disconnected" {:type :rtc.exception/ws-already-disconnected}))

(def ex-remote-graph-not-exist
  (ex-info "remote graph not exist" {:type :rtc.exception/remote-graph-not-exist}))

(def ex-remote-graph-not-ready
  (ex-info "remote graph still creating" {:type :rtc.exception/remote-graph-not-ready}))

(def ex-remote-graph-lock-missing
  (ex-info "remote graph lock missing(server internal error)"
           {:type :rtc.exception/remote-graph-lock-missing}))

(def ex-local-not-rtc-graph
  (ex-info "RTC is not supported for this local-graph" {:type :rtc.exception/not-rtc-graph}))

(def ex-bad-request-body
  (ex-info "bad request body" {:type :rtc.exception/bad-request-body}))

(def ex-not-allowed
  (ex-info "not allowed" {:type :rtc.exception/not-allowed}))

(def ex-unknown-server-error
  (ex-info "Unknown server error" {:type :rtc.exception/unknown-server-error}))

(defn e->ex-info
  [e]
  (cond
    (instance? Cancelled e) (ex-info "missionary.Cancelled" {:message (.-message e)})
    (instance? js/CloseEvent e) (ex-info "js/CloseEvent" {:type (.-type e)})

    ;; m/race-failure
    (and (instance? ExceptionInfo e)
         (contains? (ex-data e) :missionary.core/errors))
    (ex-info (ex-message e) (update (ex-data e) :missionary.core/errors (fn [errors] (map e->ex-info errors))))

    :else e))
