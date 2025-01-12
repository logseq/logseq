(ns frontend.worker.rtc.exception
  "Exception list"
  (:require [logseq.common.defkeywords :refer [defkeywords]]))

(defkeywords
  :rtc.exception/remote-graph-not-exist {:doc "Remote exception. e.g. push client-updates to a deleted graph."}
  :rtc.exception/remote-graph-not-ready {:doc "Remote exception. Remote graph is still creating."}
  :rtc.exception/remote-graph-lock-missing {:doc "
Remote exception. Failed to remote graph lock isn't exist.
It's a server internal error, shouldn't happen."}
  :rtc.exception/not-rtc-graph {:doc "Local exception. Trying to start rtc loop on a local-graph."}
  :rtc.exception/lock-failed {:doc "
Local exception.
Trying to start rtc loop but there's already one running, need to cancel that one first."}
  :rtc.exception/not-found-db-conn {:doc "Local exception. Cannot find db-conn by repo"}
  :rtc.exception/get-s3-object-failed {:doc "
Failed to fetch response from s3.
When response from remote is too huge(> 32KB),
the server will put it to s3 and return its presigned-url to clients."}
  :rtc.exception/different-graph-skeleton {:doc "remote graph skeleton data is different from local's."}
  :rtc.exception/bad-request-body {:doc "bad request body, rejected by server-schema"}
  :rtc.exception/not-allowed {:doc "this api-call is not allowed"}
  :rtc.exception/ws-timeout {:doc "websocket timeout"})

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

(defn ->map
  [e]
  (when-let [data (ex-data e)]
    {:ex-data data
     :ex-message (ex-message e)}))
