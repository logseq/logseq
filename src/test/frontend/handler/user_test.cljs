(ns frontend.handler.user-test
  (:require [cljs.core.async :as a]
            [cljs.test :refer [async deftest is testing]]
            [electron.ipc :as ipc]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn- with-mocked-local-storage
  ([f]
   (with-mocked-local-storage {} f))
  ([items f]
   (let [old-storage (.-localStorage js/globalThis)
         had-local-storage?
         (.call (.-hasOwnProperty (.-prototype js/Object))
                js/globalThis
                "localStorage")
         mocked-storage #js {:clear (fn [] nil)
                             :setItem (fn [& _] nil)
                             :getItem (fn [k] (get items k))
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
           (js/Reflect.deleteProperty js/globalThis "localStorage")))))))

(defn- jwt
  [payload]
  (str "header."
       (js/btoa (js/JSON.stringify (clj->js (merge {:cognito:username ""} payload))))
       ".sig"))

(deftest set-tokens-persists-auth-json-with-latest-token-values-test
  (let [writes* (atom [])
        old-state @state/state]
    (state/replace-state! (assoc-in old-state [:system/info :home-dir] "/tmp/home"))
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
        (state/replace-state! old-state)))))

(deftest set-tokens-without-refresh-token-persists-existing-refresh-token-test
  (let [writes* (atom [])
        old-state @state/state]
    (state/replace-state! (-> old-state
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
        (state/replace-state! old-state)))))

(deftest restore-tokens-preserves-refresh-token-before-refreshing-expired-id-token-test
  (async done
    (let [old-state @state/state
          old-refresh user-handler/<refresh-id-token&access-token
          old-pub-event! state/pub-event!
          refresh-called (a/chan)
          expired-id-token (jwt {:exp 0})
          refresh-token "refresh-token-from-local-storage"
          restore! (fn []
                     (reset! state/state old-state)
                     (set! user-handler/<refresh-id-token&access-token old-refresh)
                     (set! state/pub-event! old-pub-event!))]
      (reset! state/state (assoc old-state
                                 :auth/id-token nil
                                 :auth/access-token nil
                                 :auth/refresh-token nil))
      (set! user-handler/<refresh-id-token&access-token
            (fn []
              (a/put! refresh-called :called)
              (a/go nil)))
      (set! state/pub-event! (fn [& _] nil))
      (try
        (with-mocked-local-storage
          {"id-token" expired-id-token
           "access-token" "access-token-from-local-storage"
           "refresh-token" refresh-token}
          (fn []
            (user-handler/restore-tokens-from-localstorage)
            (is (= refresh-token (state/get-auth-refresh-token)))))
        (a/go
          (let [[value] (a/alts! [refresh-called (a/timeout 1000)])]
            (is (= :called value))
            (restore!)
            (done)))
        (catch :default e
          (is false (str "unexpected error: " e))
          (restore!)
          (done))))))

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
