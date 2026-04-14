(ns frontend.handler.user-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- with-mocked-local-storage
  [f]
  (let [old-storage (.-localStorage js/globalThis)
        had-local-storage?
        (.call (.-hasOwnProperty (.-prototype js/Object))
               js/globalThis
               "localStorage")
        mocked-storage #js {:clear (fn [] nil)
                            :setItem (fn [& _] nil)
                            :getItem (fn [& _] nil)
                            :removeItem (fn [& _] nil)}]
    (js/Object.defineProperty js/globalThis
                              "localStorage"
                              #js {:value mocked-storage
                                   :configurable true
                                   :writable true})
    (try
      (f)
      (finally
        (if had-local-storage?
          (js/Object.defineProperty js/globalThis
                                    "localStorage"
                                    #js {:value old-storage
                                         :configurable true
                                         :writable true})
          (js/Reflect.deleteProperty js/globalThis "localStorage"))))))

(deftest logout-clears-e2ee-password-when-db-worker-ready-test
  (testing "logout should request db-worker to clear persisted e2ee password"
    (let [ops* (atom [])
          old-worker @state/*db-worker]
      (reset! state/*db-worker :worker)
      (try
        (with-mocked-local-storage
          (fn []
            (with-redefs [state/<invoke-db-worker (fn [op & _]
                                                    (swap! ops* conj op)
                                                    (p/resolved nil))
                          state/clear-user-info! (fn [] nil)
                          state/pub-event! (fn [& _] nil)
                          user-handler/clear-tokens (fn [] nil)]
              (user-handler/logout)
              (is (= [:thread-api/clear-e2ee-password] @ops*)))))
        (finally
          (reset! state/*db-worker old-worker))))))

(deftest logout-skips-e2ee-password-clear-when-db-worker-missing-test
  (testing "logout should not call db-worker API when db-worker is unavailable"
    (let [invoke-calls* (atom 0)
          old-worker @state/*db-worker]
      (reset! state/*db-worker nil)
      (try
        (with-mocked-local-storage
          (fn []
            (with-redefs [state/<invoke-db-worker (fn [& _]
                                                    (swap! invoke-calls* inc)
                                                    (p/resolved nil))
                          state/clear-user-info! (fn [] nil)
                          state/pub-event! (fn [& _] nil)
                          user-handler/clear-tokens (fn [] nil)]
              (user-handler/logout)
              (is (zero? @invoke-calls*)))))
        (finally
          (reset! state/*db-worker old-worker))))))
