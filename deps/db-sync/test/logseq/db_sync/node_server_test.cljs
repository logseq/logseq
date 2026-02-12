(ns logseq.db-sync.node-server-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.db-sync.node.server :as node-server]
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
