(ns logseq.db-sync.security-test
  "Regression tests for the db-sync server security review: third-party OAuth
  tokens are confined to the semantic API surface, graph deletion takes a
  manager, client-supplied graph ids are ignored, internal Durable Object
  routes are unreachable through the public sync path, and error responses
  carry no internal details."
  (:require [cljs.test :refer [async deftest is]]
            [clojure.string :as string]
            [logseq.db-sync.node.server :as node-server]
            [logseq.db-sync.worker.auth :as auth]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [promesa.core :as p]))

(defn- b64url-encode [obj]
  (-> (js/btoa (js/JSON.stringify obj))
      (string/replace "+" "-")
      (string/replace "/" "_")
      (string/replace #"=+$" "")))

(defn- test-jwt [claims]
  (str "x." (b64url-encode claims) ".y"))

;; ---------------------------------------------------------------------------
;; Unit: the graph id comes from the sync path, never from the client

(deftest graph-id-from-request-ignores-client-supplied-graph-id-test
  (let [upgrade-request (js/Request. "http://localhost/sync/graph-real?graph-id=graph-fake"
                                     #js {:headers #js {"x-graph-id" "graph-fake-2"}})
        path-only-request (js/Request. "http://localhost/sync/graph-real"
                                       #js {:headers #js {"x-graph-id" "graph-fake"}})
        param-request (js/Request. "http://localhost/pull?graph-id=graph-param"
                                   #js {:headers #js {"x-graph-id" "graph-fake"}})]
    (is (= "graph-real" (sync-handler/graph-id-from-request upgrade-request)))
    (is (= "graph-real" (sync-handler/graph-id-from-request path-only-request)))
    (is (= "graph-param" (sync-handler/graph-id-from-request param-request)))))

;; ---------------------------------------------------------------------------
;; Unit: the DO routes the path exactly as received

(deftest handle-http-does-not-strip-a-second-sync-prefix-test
  ;; `/sync/<g>/sync/<x>/semantic/pages` must not resolve to the internal
  ;; `/semantic/pages` route: the path is routed exactly as received.
  (let [nested (sync-handler/handle-http #js {}
                                         (js/Request. "http://localhost/sync/x/semantic/pages"
                                                      #js {:method "GET"}))
        health (sync-handler/handle-http #js {}
                                         (js/Request. "http://localhost/health"
                                                      #js {:method "GET"}))]
    (is (= 404 (.-status nested)))
    (is (= 200 (.-status health)))))

(deftest handle-http-closes-the-sockets-of-the-given-user-test
  (async done
         (let [closed (atom [])
               bob-ws #js {:readyState 1
                          :send (fn [& _])
                          :close (fn [code reason]
                                   (swap! closed conj ["bob" code reason]))}
               alice-ws #js {:readyState 1
                             :send (fn [& _])
                             :close (fn [_code _reason]
                                      (swap! closed conj ["alice"]))}
               self #js {:state #js {:getWebSockets (fn [] (to-array [bob-ws alice-ws]))}
                         :presence (atom {bob-ws {:user-id "bob"}
                                          alice-ws {:user-id "alice"}})}
               request (js/Request. "http://localhost/internal/close-sockets?user-id=bob"
                                    #js {:method "POST"})]
           (-> (p/let [response (sync-handler/handle-http self request)
                       text (.text response)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                 (is (= 200 (.-status response)))
                 (is (= {:ok true} body))
                 (is (= [["bob" 1000 "membership revoked"]] @closed)))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

;; ---------------------------------------------------------------------------
;; End to end against a real node server: only token verification is stubbed
;; (the bearer token's payload is the claims).

(defn- test-claims [request _env]
  (let [token (auth/token-from-request request)
        claims (auth/unsafe-jwt-claims token)]
    (p/resolved (or claims (when (string? token) #js {"sub" token})))))

(defn- req [base user method path body]
  (js/fetch (str base path)
            (clj->js (cond-> {:method method :headers {"authorization" (str "Bearer " user) "content-type" "application/json"}}
                       body (assoc :body (js/JSON.stringify (clj->js body)))))))

(defn- json-body [response]
  (p/let [text (.text response)]
    (try (js->clj (js/JSON.parse text) :keywordize-keys true)
         (catch :default _ nil))))

(deftest node-server-security-test
  (async done
    (let [stop (atom nil)
          scoped-token (test-jwt #js {"sub" "bob" "scope" "logseq/read" "client_id" "chatgpt-client"})
          malformed-token "!.e30.x"]
      (-> (p/with-redefs [auth/auth-claims test-claims
                          auth/semantic-auth-claims test-claims]
            (p/let [{:keys [base-url stop!]} (node-server/start! {:port 0
                                                                  :data-dir (str "tmp/db-sync-security-test/" (random-uuid))})
                    _ (reset! stop stop!)
                    created (req base-url "alice" "POST" "/graphs" {:graph-name "alice's graph" :graph-e2ee? false})
                    created-body (.json created)
                    graph-id (aget created-body "graph-id")
                    added (req base-url "alice" "POST" (str "/graphs/" graph-id "/members") {:user-id "bob" :role "member"})
                    ;; H2: a plain member must not delete the graph.
                    member-deletes (req base-url "bob" "DELETE" (str "/graphs/" graph-id) nil)
                    ;; H2: the DO-internal admin reset is hidden without the admin token.
                    member-resets (req base-url "bob" "DELETE" (str "/sync/" graph-id "/admin/reset") nil)
                    ;; H1: a third-party OAuth token is confined to the semantic API.
                    scoped-pull (req base-url scoped-token "GET" (str "/sync/" graph-id "/pull") nil)
                    scoped-body (json-body scoped-pull)
                    ;; M3: a nested sync path does not resolve to internal semantic routes.
                    nested-semantic (req base-url "alice" "GET" (str "/sync/" graph-id "/sync/x/semantic/pages") nil)
                    ;; L1: a malformed token is a plain 401 without internal details.
                    malformed (req base-url malformed-token "GET" "/graphs" nil)
                    malformed-body (json-body malformed)
                    ;; The owner (a manager) can still delete the graph.
                    owner-deletes (req base-url "alice" "DELETE" (str "/graphs/" graph-id) nil)]
              (is (= 200 (.-status created)))
              (is (= 200 (.-status added)))
              (is (= 403 (.-status member-deletes)) "a plain member must not delete the graph")
              (is (= 404 (.-status member-resets)) "admin reset is hidden without the admin token")
              (is (= 403 (.-status scoped-pull)) "a third-party OAuth token must not reach /sync")
              (is (= "insufficient scope" (:error scoped-body)))
              (is (= 404 (.-status nested-semantic)) "a nested sync path must not reach internal semantic routes")
              (is (= 401 (.-status malformed)))
              (is (= {:error "unauthorized"} malformed-body))
              (is (not (string/includes? (str malformed-body) "debug")))
              (is (= 200 (.-status owner-deletes)))))
          (p/catch (fn [e] (is false (str e))))
          (p/finally (fn [] (if-let [s @stop] (-> (s) (p/finally done)) (done))))))))
