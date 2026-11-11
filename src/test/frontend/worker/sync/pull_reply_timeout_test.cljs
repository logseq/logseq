(ns frontend.worker.sync.pull-reply-timeout-test
  "A pull whose reply never comes on a socket that stays open stops blocking the
  next pull from the same t after the reply timeout (a field report on #13909:
  local t stuck for 20 minutes with the socket open and no error)."
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.handle-message :as sync-handle-message]
            [frontend.worker.shared-service :as shared-service]
            [promesa.core :as p]))

(def ^:private test-repo "test-pull-reply-timeout")

(defn- capture-ws
  [*sent]
  (doto (js-obj)
    (aset "readyState" 1)
    (aset "send" (fn [raw]
                   (swap! *sent conj (js->clj (js/JSON.parse raw) :keywordize-keys true))))))

(defn- client-with-pending-pull
  [ws since sent-at]
  {:repo test-repo
   :graph-id "graph-1"
   :ws ws
   :send-queue (atom (p/resolved nil))
   :pending-pull-since (atom since)
   :pending-pull-sent-at (atom sent-at)
   :inflight (atom [])
   :online-users (atom [])
   :ws-state (atom :open)})

(defn- changed! [client t]
  (p/with-redefs [shared-service/broadcast-to-clients! (fn [& _] nil)
                  sync-handle-message/sync-counts (constantly {})
                  client-op/get-local-tx (constantly 10)]
    (sync-handle-message/handle-message! test-repo client (js/JSON.stringify (clj->js {:type "changed" :t t})))
    @(:send-queue client)))

(deftest a-pull-unanswered-past-the-timeout-is-sent-again-test
  (testing "an open socket whose pull reply was lost 31 s ago pulls again"
    (async done
           (let [*sent (atom [])
                 client (client-with-pending-pull (capture-ws *sent) 10 (- (js/Date.now) 31000))]
             (-> (changed! client 12)
                 (p/then (fn [_]
                           (is (= [{:type "pull" :since 10}] @*sent))
                           (is (= 10 @(:pending-pull-since client)))
                           (is (> @(:pending-pull-sent-at client) (- (js/Date.now) 1000))
                               "the resend restarts the reply timeout")))
                 (p/catch (fn [error] (is nil (str error))))
                 (p/finally done))))))

(deftest a-pull-still-awaiting-its-reply-is-not-sent-twice-test
  (testing "within the timeout the pending pull still suppresses a duplicate"
    (async done
           (let [*sent (atom [])
                 client (client-with-pending-pull (capture-ws *sent) 10 (- (js/Date.now) 1000))]
             (-> (changed! client 12)
                 (p/then (fn [_] (is (= [] @*sent))))
                 (p/catch (fn [error] (is nil (str error))))
                 (p/finally done))))))
