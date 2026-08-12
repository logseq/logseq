(ns electron.core-test
  (:require [cljs.test :refer [async deftest is]]
            [electron.lifecycle :as lifecycle]
            [promesa.core :as p]))

(deftest start-waits-for-asynchronous-teardown
  (async done
    (let [events (atom [])
          teardown-done (p/deferred)
          lifecycle-op (volatile! (p/resolved nil))]
      (lifecycle/enqueue! lifecycle-op
                          #(do
                             (swap! events conj :teardown)
                             teardown-done))
      (lifecycle/enqueue! lifecycle-op #(swap! events conj :setup))
      (-> (p/let [_ (p/delay 0)]
            (is (= [:teardown] @events))
            (p/resolve! teardown-done true)
            (p/delay 0))
          (p/then (fn [_]
                    (is (= [:teardown :setup] @events))))
          (p/finally (fn []
                       (p/resolve! teardown-done true)
                       (done)))))))

(deftest start-continues-after-teardown-failure
  (async done
    (let [events (atom [])
          lifecycle-op (volatile! (p/resolved nil))]
      (lifecycle/enqueue! lifecycle-op
                          #(do
                             (swap! events conj :teardown)
                             (p/rejected (ex-info "teardown failed" {}))))
      (lifecycle/enqueue! lifecycle-op #(swap! events conj :setup))
      (-> (p/let [_ (p/delay 0)]
            (is (= [:teardown :setup] @events)))
          (p/finally (fn []
                       (done)))))))
