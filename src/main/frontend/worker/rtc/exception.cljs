(ns frontend.worker.rtc.exception
  "Exception list"
  (:require [frontend.common.schema-register :as sr]))

(sr/defkeyword :rtc.exception/remote-graph-not-exist
  "Remote exception. e.g. push client-updates to a deleted graph.")

(sr/defkeyword :rtc.exception/remote-graph-not-ready
  "Remote exception. Remote graph is still creating.")

(sr/defkeyword :rtc.exception/remote-graph-lock-missing
  "Remote exception. Failed to remote graph lock isn't exist.
It's a server internal error, shouldn't happen.")

(sr/defkeyword :rtc.exception/not-rtc-graph
  "Local exception. Trying to start rtc loop on a local-graph.")

(sr/defkeyword :rtc.exception/lock-failed
  "Local exception.
Trying to start rtc loop but there's already one running, need to cancel that one first.")

(sr/defkeyword :rtc.exception/not-found-db-conn
  "Local exception. Cannot find db-conn by repo")

(sr/defkeyword :rtc.exception/get-s3-object-failed
  "Failed to fetch response from s3.
When response from remote is too huge(> 32KB),
the server will put it to s3 and return its presigned-url to clients.")

(sr/defkeyword :rtc.exception/different-graph-skeleton
  "remote graph skeleton data is different from local's.")

(def ex-remote-graph-not-exist
  (ex-info "remote graph not exist" {:type :rtc.exception/remote-graph-not-exist}))

(def ex-remote-graph-not-ready
  (ex-info "remote graph still creating" {:type :rtc.exception/remote-graph-not-ready}))

(def ex-remote-graph-lock-missing
  (ex-info "remote graph lock missing(server internal error)"
           {:type :rtc.exception/remote-graph-lock-missing}))

(def ex-local-not-rtc-graph
  (ex-info "RTC is not supported for this local-graph" {:type :rtc.exception/not-rtc-graph}))

(def ex-unknown-server-error
  (ex-info "Unknown server error" {:type :rtc.exception/unknown-server-error}))


(defn ->map
  [e]
  (when-let [data (ex-data e)]
    {:ex-data data
     :ex-message (ex-message e)}))
