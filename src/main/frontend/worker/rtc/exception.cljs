(ns frontend.worker.rtc.exception
  "Exception list")

(def ex-remote-graph-not-exist
  (ex-info "remote graph not exist" {:type ::remote-graph-not-exist}))

(def ex-remote-graph-not-ready
  (ex-info "remote graph still creating" {:type ::remote-graph-not-ready}))

(def ex-remote-graph-lock-missing
  (ex-info "remote graph lock missing(server error)" {:type ::remote-graph-lock-missing}))



(def ex-local-not-rtc-graph
  (ex-info "RTC is not supported for this graph" {:type ::not-rtc-graph}))
