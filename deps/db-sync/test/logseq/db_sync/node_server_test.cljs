(ns logseq.db-sync.node-server-test
  (:require ["ws" :as ws]
            [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.db-sync.node.server :as node-server]
            [logseq.db-sync.platform.node :as platform-node]
            [logseq.db-sync.worker.auth :as auth]
            [promesa.core :as p]))

(defn- fetch-with-timeout [url timeout-ms]
  (let [timeout-sentinel ::timeout]
    {:sentinel timeout-sentinel
     :promise (js/Promise.
               (fn [resolve reject]
                 (let [controller (js/AbortController.)
                       timeout-id (js/setTimeout
                                   (fn []
                                     (.abort controller))
                                   timeout-ms)]
                   (-> (js/fetch url #js {:method "GET"
                                          :headers #js {"authorization" "Bearer test.token.sig"}
                                          :signal (.-signal controller)})
                       (.then (fn [response]
                                (js/clearTimeout timeout-id)
                                (resolve response)))
                       (.catch (fn [error]
                                 (js/clearTimeout timeout-id)
                                 (if (= "AbortError" (.-name error))
                                   (resolve timeout-sentinel)
                                   (reject error))))))))}))

(defn- ws-upgrade-outcome
  "Opens a websocket to `path` with `token`; resolves :open, [:status n] for an
  HTTP answer, :closed when the server drops the socket, :timeout after timeout-ms."
  [base-url path token timeout-ms]
  (js/Promise.
   (fn [resolve]
     (let [url (str (string/replace base-url #"^http" "ws") path)
           ^js client (new (.-WebSocket ws) url #js {:headers #js {"authorization" (str "Bearer " token)}})
           settled (atom false)
           settle! (fn [outcome]
                     (when (compare-and-set! settled false true)
                       (resolve outcome)))
           timer (js/setTimeout #(do (settle! :timeout) (.terminate client)) timeout-ms)]
       (.on client "open" (fn [] (js/clearTimeout timer) (settle! :open) (.close client)))
       (.on client "unexpected-response" (fn [_req ^js res]
                                           (js/clearTimeout timer)
                                           (settle! [:status (.-statusCode res)])
                                           (.destroy (.-socket res))))
       (.on client "error" (fn [_error] (js/clearTimeout timer) (settle! :closed)))
       (.on client "close" (fn [& _] (js/clearTimeout timer) (settle! :closed)))))))

(deftest node-server-answers-ws-upgrade-when-auth-claims-rejects-test
  (async done
         (let [stop-server! (atom nil)]
           (-> (p/with-redefs [auth/auth-claims
                               (fn [_request _env]
                                 (p/rejected (ex-info "jwks" {})))]
                 (p/let [{:keys [base-url stop!]} (node-server/start! {:port 0
                                                                       :data-dir (str "tmp/db-sync-node-server-test/" (random-uuid))})
                         _ (reset! stop-server! stop!)
                         outcome (ws-upgrade-outcome base-url "/sync/graph-x" "test.token.sig" 1500)]
                   (is (= [:status 500] outcome)
                       "an upgrade whose auth fails is answered, not left open")))
               (p/catch (fn [error] (is false (str error))))
               (p/finally (fn []
                            ;; stop! only when the socket was answered: an open
                            ;; one keeps the server from closing
                            (if-let [stop! @stop-server!]
                              (-> (stop!) (p/finally done))
                              (done))))))))

(deftest node-server-env-passes-the-admin-token-test
  (let [penv (.-env js/process)
        before (aget penv "DB_SYNC_ADMIN_TOKEN")]
    (try
      (aset penv "DB_SYNC_ADMIN_TOKEN" "test-admin-token")
      (is (= "test-admin-token"
             (aget (#'node-server/make-env {} nil nil) "DB_SYNC_ADMIN_TOKEN")))
      (finally
        (if (some? before)
          (aset penv "DB_SYNC_ADMIN_TOKEN" before)
          (js-delete penv "DB_SYNC_ADMIN_TOKEN"))))))

(deftest node-server-returns-500-when-auth-claims-rejects-test
  (async done
         (let [stop-server! (atom nil)
               test-url (atom nil)]
           (-> (p/with-redefs [auth/auth-claims
                               (fn [_request _env]
                                 (p/rejected (ex-info "jwks" {})))]
                 (p/let [{:keys [base-url stop!]} (node-server/start! {:port 0
                                                                       :data-dir (str "tmp/db-sync-node-server-test/" (random-uuid))})
                         _ (reset! stop-server! stop!)
                         _ (reset! test-url (str base-url "/graphs"))
                         {:keys [promise sentinel]} (fetch-with-timeout @test-url 1200)
                         response promise]
                   (if (identical? response sentinel)
                     (is false "request timed out")
                     (p/let [body (.json response)]
                       (is (= 500 (.-status response)))
                       (is (= "server error" (aget body "error")))))))
               (p/then
                (fn []
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/then (fn [] (done)))
                        (p/catch (fn [error]
                                   (is false (str error))
                                   (done))))
                    (done))))
               (p/catch
                (fn [error]
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/then (fn []
                                  (is false (str error))
                                  (done)))
                        (p/catch (fn [stop-error]
                                   (is false (str error))
                                   (is false (str stop-error))
                                   (done))))
                    (do
                      (is false (str error))
                      (done)))))))))

(deftest node-server-request-origin-uses-configured-base-url-host-test
  (async done
         (let [stop-server! (atom nil)
               request-opts (atom [])
               original-request-from-node platform-node/request-from-node]
           (-> (p/with-redefs [platform-node/request-from-node
                               (fn [req opts]
                                 (swap! request-opts conj opts)
                                 (original-request-from-node req opts))]
                 (p/let [{:keys [port stop!]} (node-server/start! {:port 0
                                                                   :base-url "https://sync.example.test:9443"
                                                                   :data-dir (str "tmp/db-sync-node-server-base-url-test/" (random-uuid))})
                         _ (reset! stop-server! stop!)
                         response (js/fetch (str "http://localhost:" port "/health"))]
                   (is (= 200 (.-status response)))
                   (is (some #(= {:scheme "https"
                                  :host "sync.example.test:9443"}
                                %)
                             @request-opts))))
               (p/then
                (fn []
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/then (fn [] (done)))
                        (p/catch (fn [error]
                                   (is false (str error))
                                   (done))))
                    (done))))
               (p/catch
                (fn [error]
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/then (fn []
                                  (is false (str error))
                                  (done)))
                        (p/catch (fn [stop-error]
                                   (is false (str error))
                                   (is false (str stop-error))
                                   (done))))
                    (do
                      (is false (str error))
                      (done)))))))))

(deftest node-server-logs-request-failed-marker-when-auth-claims-rejects-test
  (async done
         (let [stop-server! (atom nil)
               original-console-error (.-error js/console)
               logged-errors (atom [])]
           (aset js/console
                 "error"
                 (fn [& args]
                   (swap! logged-errors conj args)))
           (-> (p/with-redefs [auth/auth-claims
                               (fn [_request _env]
                                 (p/rejected (ex-info "jwks" {})))]
                 (p/let [{:keys [base-url stop!]} (node-server/start! {:port 0
                                                                       :data-dir (str "tmp/db-sync-node-server-log-test/" (random-uuid))})
                         _ (reset! stop-server! stop!)
                         _ (reset! logged-errors [])
                         {:keys [promise sentinel]} (fetch-with-timeout (str base-url "/graphs") 1200)
                         response promise]
                   (if (identical? response sentinel)
                     (is false "request timed out")
                     (do
                       (is (= 500 (.-status response)))
                       (is (some #(= ":db-sync/node-request-failed" (first %))
                                 @logged-errors))))))
               (p/then
                (fn []
                  (aset js/console "error" original-console-error)
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/then (fn [] (done)))
                        (p/catch (fn [error]
                                   (is false (str error))
                                   (done))))
                    (done))))
               (p/catch
                (fn [error]
                  (aset js/console "error" original-console-error)
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/then (fn []
                                  (is false (str error))
                                  (done)))
                        (p/catch (fn [stop-error]
                                   (is false (str error))
                                   (is false (str stop-error))
                                   (done))))
                    (do
                      (is false (str error))
                      (done)))))))))
