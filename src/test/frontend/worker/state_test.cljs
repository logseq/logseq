(ns frontend.worker.state-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]))

(defn- with-online-event
  [value]
  (assoc @worker-state/*state :thread-atom/online-event (atom value)))

(deftest online?-uses-thread-atom-in-non-node-runtime
  (let [state-prev @worker-state/*state]
    (try
      (with-redefs [platform/current (fn []
                                       {:env {:runtime :web}})]
        (reset! worker-state/*state (with-online-event true))
        (testing "web runtime stays compatible with main-thread online-event"
          (is (true? (worker-state/online?))))
        (reset! worker-state/*state (with-online-event false))
        (is (false? (worker-state/online?))))
      (finally
        (reset! worker-state/*state state-prev)))))

(deftest online?-node-runtime-does-not-require-main-thread-online-event
  (let [state-prev @worker-state/*state]
    (try
      (with-redefs [platform/current (fn []
                                       {:env {:runtime :node}})]
        (reset! worker-state/*state (with-online-event nil))
        (testing "node runtime should provide its own online detection"
          (is (true? (worker-state/online?)))))
      (finally
        (reset! worker-state/*state state-prev)))))
