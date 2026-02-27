(ns logseq.sync.node-server-test
  (:require [cljs.test :refer [async deftest is]]
            [logseq.sync.node.server :as node-server]
            [promesa.core :as p]))

(defn- fetch-with-timeout [url timeout-ms token]
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
                                          :headers #js {"authorization" (str "Bearer " token)}
                                          :signal (.-signal controller)})
                       (.then (fn [response]
                                (js/clearTimeout timeout-id)
                                (resolve response)))
                       (.catch (fn [error]
                                 (js/clearTimeout timeout-id)
                                 (if (= "AbortError" (.-name error))
                                   (resolve timeout-sentinel)
                                   (reject error))))))))}))

(defn- base64url-encode [text]
  (-> (.from js/Buffer text "utf8")
      (.toString "base64")
      (.replace #"/" "_")
      (.replace #"\+" "-")
      (.replace #"=+$" "")))

(defn- invalid-jwks-token []
  (let [header (base64url-encode "{\"alg\":\"RS256\",\"kid\":\"k1\"}")
        payload (base64url-encode "{\"iss\":\"iss\",\"aud\":\"aud\",\"exp\":4070908800}")]
    (str header "." payload ".sig")))

(deftest node-server-returns-500-when-auth-claims-rejects-test
  (async done
         (let [stop-server! (atom nil)
               token (invalid-jwks-token)]
           (-> (p/let [{:keys [base-url stop!]} (node-server/start! {:port 0
                                                                     :data-dir (str "tmp/db-sync-node-server-test/" (random-uuid))
                                                                     :cognito-issuer "iss"
                                                                     :cognito-client-id "aud"
                                                                     :cognito-jwks-url "http://127.0.0.1:1/.well-known/jwks.json"})
                       _ (reset! stop-server! stop!)
                       {:keys [promise sentinel]} (fetch-with-timeout (str base-url "/graphs") 1200 token)
                       response promise]
                 (if (identical? response sentinel)
                   (is false "request timed out")
                   (p/let [body (.json response)]
                     (is (= 500 (.-status response)))
                     (is (= "server error" (aget body "error"))))))
               (p/catch
                (fn [error]
                  (is false (str error))))
               (p/then
                (fn []
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/catch (fn [error]
                                   (is false (str error)))))
                    nil)))
               (p/then
                (fn []
                  (done)))))))

(deftest node-server-logs-request-failed-marker-when-auth-claims-rejects-test
  (async done
         (let [stop-server! (atom nil)
               original-console-error (.-error js/console)
               logged-errors (atom [])
               token (invalid-jwks-token)]
           (aset js/console
                 "error"
                 (fn [& args]
                   (swap! logged-errors conj args)))
           (-> (p/let [{:keys [base-url stop!]} (node-server/start! {:port 0
                                                                     :data-dir (str "tmp/db-sync-node-server-log-test/" (random-uuid))
                                                                     :cognito-issuer "iss"
                                                                     :cognito-client-id "aud"
                                                                     :cognito-jwks-url "http://127.0.0.1:1/.well-known/jwks.json"})
                       _ (reset! stop-server! stop!)
                       _ (reset! logged-errors [])
                       {:keys [promise sentinel]} (fetch-with-timeout (str base-url "/graphs") 1200 token)
                       response promise]
                 (if (identical? response sentinel)
                   (is false "request timed out")
                   (do
                     (is (= 500 (.-status response)))
                     (is (some #(= ":db-sync/node-request-failed" (first %))
                               @logged-errors)))))
               (p/catch
                (fn [error]
                  (aset js/console "error" original-console-error)
                  (is false (str error))))
               (p/then
                (fn []
                  (aset js/console "error" original-console-error)
                  (if-let [stop! @stop-server!]
                    (-> (stop!)
                        (p/catch (fn [error]
                                   (is false (str error)))))
                    nil)))
               (p/then
                (fn []
                  (done)))))))
