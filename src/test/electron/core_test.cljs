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

(deftest before-quit-prevents-default-and-waits-for-teardown-before-exit
  (async done
    (let [events (atom [])
          teardown-done (p/deferred)
          quit-state (atom :idle)
          event #js {:defaultPrevented false}]
      (lifecycle/<handle-before-quit!
       {:event event
        :quit-state quit-state
        :prevent-default! (fn [_]
                            (swap! events conj :prevent-default))
        :teardown! (fn []
                     (swap! events conj :teardown-start)
                     teardown-done)
        :quit! (fn []
                 (swap! events conj :exit))})
      (-> (p/let [_ (p/delay 0)]
            (is (= [:prevent-default :teardown-start] @events))
            (is (= :stopping @quit-state))
            (p/resolve! teardown-done true)
            (p/delay 0))
          (p/then (fn [_]
                    (is (= [:prevent-default :teardown-start :exit] @events))))
          (p/finally (fn []
                       (p/resolve! teardown-done true)
                       (done)))))))

(deftest before-quit-is-idempotent-while-teardown-runs
  (async done
    (let [events (atom [])
          teardown-done (p/deferred)
          quit-state (atom :idle)
          opts {:event #js {}
                :quit-state quit-state
                :prevent-default! (fn [_]
                                    (swap! events conj :prevent-default))
                :teardown! (fn []
                             (swap! events conj :teardown)
                             teardown-done)}
          resume-quit (fn []
                        (swap! events conj :exit)
                        (lifecycle/<handle-before-quit! opts))]
      (lifecycle/<handle-before-quit! (assoc opts :quit! resume-quit))
      (lifecycle/<handle-before-quit! opts)
      (-> (p/let [_ (p/delay 0)]
            (is (= [:prevent-default :prevent-default :teardown] @events))
            (p/resolve! teardown-done true)
            (p/delay 0))
          (p/then (fn [_]
                    (is (= [:prevent-default :prevent-default :teardown :exit] @events))))
          (p/finally (fn []
                       (p/resolve! teardown-done true)
                       (done)))))))

(deftest before-quit-logs-teardown-errors-then-exits
  (async done
    (let [events (atom [])
          quit-state (atom :idle)]
      (lifecycle/<handle-before-quit!
       {:event #js {}
        :quit-state quit-state
        :prevent-default! (fn [_]
                            (swap! events conj :prevent-default))
        :on-error! (fn [error]
                     (swap! events conj [:error (ex-message error)]))
        :teardown! (fn []
                     (swap! events conj :teardown)
                     (throw (ex-info "teardown boom" {})))
        :quit! (fn []
                 (swap! events conj :exit))})
      (-> (p/delay 0)
          (p/then (fn [_]
                    (is (= [:prevent-default :teardown [:error "teardown boom"] :exit]
                           @events))))
          (p/finally done)))))
