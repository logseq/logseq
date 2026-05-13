(ns frontend.handler.user-test
  (:require [cljs.test :refer [deftest is testing]]
            [electron.ipc :as ipc]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
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

(deftest set-tokens-persists-auth-json-with-latest-token-values-test
  (let [writes* (atom [])
        old-state @state/state]
    (reset! state/state (assoc-in old-state [:system/info :home-dir] "/tmp/home"))
    (try
      (with-mocked-local-storage
        (fn []
          (with-redefs [util/electron? (constantly true)
                        ipc/ipc (fn [op _repo path content]
                                  (is (= "writeFile" op))
                                  (swap! writes* conj {:path path
                                                       :content content})
                                  (p/resolved nil))]
            (#'user-handler/set-tokens! "id-token-v1" "access-token-v1" "refresh-token-v1")
            (is (= 1 (count @writes*)))
            (is (= "/tmp/home/logseq/auth.json" (:path (first @writes*))))
            (is (= {:id-token "id-token-v1"
                    :access-token "access-token-v1"
                    :refresh-token "refresh-token-v1"}
                   (select-keys (js->clj (js/JSON.parse (:content (first @writes*))) :keywordize-keys true)
                                [:id-token :access-token :refresh-token]))))))
      (finally
        (reset! state/state old-state)))))

(deftest set-tokens-without-refresh-token-persists-existing-refresh-token-test
  (let [writes* (atom [])
        old-state @state/state]
    (reset! state/state (-> old-state
                            (assoc :auth/refresh-token "refresh-token-existing")
                            (assoc-in [:system/info :home-dir] "/tmp/home")))
    (try
      (with-mocked-local-storage
        (fn []
          (with-redefs [util/electron? (constantly true)
                        ipc/ipc (fn [op _repo path content]
                                  (is (= "writeFile" op))
                                  (swap! writes* conj {:path path
                                                       :content content})
                                  (p/resolved nil))]
            (#'user-handler/set-tokens! "id-token-v2" "access-token-v2")
            (is (= 1 (count @writes*)))
            (is (= "/tmp/home/logseq/auth.json" (:path (first @writes*))))
            (is (= {:id-token "id-token-v2"
                    :access-token "access-token-v2"
                    :refresh-token "refresh-token-existing"}
                   (select-keys (js->clj (js/JSON.parse (:content (first @writes*))) :keywordize-keys true)
                                [:id-token :access-token :refresh-token]))))))
      (finally
        (reset! state/state old-state)))))

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
