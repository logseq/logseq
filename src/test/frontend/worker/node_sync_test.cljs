(ns frontend.worker.node-sync-test
  (:require
   [cljs.test :refer [async deftest is]]
   [frontend.worker.platform :as platform]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync :as db-sync]
   [promesa.core :as p]))

(def ^:private test-repo "test-db-sync-repo")

(deftest resolve-ws-token-cli-owner-source-reads-state-token-test
  (async done
         (let [refresh-calls (atom 0)
               config-prev @worker-state/*db-sync-config
               state-prev @worker-state/*state
               main-thread-prev @worker-state/*main-thread]
           (reset! worker-state/*db-sync-config {:ws-url "wss://example.com/sync/%s"})
           (reset! worker-state/*state (assoc state-prev :auth/id-token "state-token"))
           (reset! worker-state/*main-thread
                   (fn [qkw & _args]
                     (when (= qkw :thread-api/ensure-id&access-token)
                       (swap! refresh-calls inc))
                     (p/resolved {:id-token "refreshed-token"})))
           (with-redefs [platform/current (fn [] {:env {:runtime :node
                                                        :owner-source :cli}})
                         db-sync/id-token-expired? (fn [_token] true)]
             (-> (#'db-sync/<resolve-ws-token)
                 (p/then (fn [token]
                           (is (= 0 @refresh-calls))
                           (is (= "state-token" token))
                           (is (= "state-token" (worker-state/get-id-token)))
                           (reset! worker-state/*main-thread main-thread-prev)
                           (reset! worker-state/*db-sync-config config-prev)
                           (reset! worker-state/*state state-prev)
                           (done)))
                 (p/catch (fn [error]
                            (reset! worker-state/*main-thread main-thread-prev)
                            (reset! worker-state/*db-sync-config config-prev)
                            (reset! worker-state/*state state-prev)
                            (is nil (str error))
                            (done))))))))

(deftest connect-uses-platform-websocket-adapter-test
  (let [ws-ctor-prev js/WebSocket
        state-prev @worker-state/*state
        platform-map {:runtime :test}
        ws-calls (atom [])
        attach-calls (atom [])]
    (set! js/WebSocket (js* "(function(_url){ this.readyState = 1; })"))
    (reset! worker-state/*state (assoc state-prev :auth/id-token "token-123"))
    (try
      (with-redefs [platform/current (fn [] platform-map)
                    platform/websocket-connect (fn [platform' url]
                                                 (swap! ws-calls conj {:platform platform' :url url})
                                                 (js-obj))
                    db-sync/attach-ws-handlers! (fn [repo _client ws url]
                                                  (swap! attach-calls conj {:repo repo :ws ws :url url}))]
        (let [connected (#'db-sync/connect! test-repo {:repo test-repo} "wss://example.com/sync/graph-1")
              ws (:ws connected)]
          (is (= [{:platform platform-map
                   :url "wss://example.com/sync/graph-1?token=token-123"}]
                 @ws-calls))
          (is (= [{:repo test-repo
                   :ws ws
                   :url "wss://example.com/sync/graph-1"}]
                 @attach-calls))))
      (finally
        (reset! worker-state/*state state-prev)
        (set! js/WebSocket ws-ctor-prev)))))
