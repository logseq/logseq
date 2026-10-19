(ns logseq.e2e.sync-server
  "Local db-sync server management for RTC e2e tests.

  Starts deps/db-sync's node adapter (worker/dist/node-adapter.js) on a free
  port through cli-e2e/scripts/db_sync_server.py, with
  DB_SYNC_ALLOW_UNVERIFIED_JWT_CLAIMS=true, so tests sync against localhost
  instead of api.logseq.io and Cognito.

  The server accepts any well-formed, non-expired JWT: the configured JWKS URL
  points back at the local server itself (no /jwks.json route -> 'jwks' error,
  which is non-recoverable), so auth falls back to unverified claims. The
  token's `iss`/`aud` must still match the server's COGNITO_ISSUER /
  COGNITO_CLIENT_ID env, which are fixed constants shared with `test-login`."
  (:require [jsonista.core :as json])
  (:import [java.net ServerSocket]
           [java.nio.charset StandardCharsets]
           [java.nio.file Files]
           [java.util Base64]))

(def ^:private cognito-issuer "https://e2e-cognito.logseq.local")
(def ^:private cognito-client-id "e2e-client-id")

(def ^:private test-user-sub "e2e00000-0000-4000-8000-000000000001")
(def ^:private test-username "e2etest")
(def ^:private test-email "e2etest@logseq.com")

;; Token expiry is one day out: the app's `restore-tokens-from-localstorage`
;; only refreshes when the id-token expires within the hour, so this keeps the
;; tests off Cognito's refresh endpoint too.
(def ^:private token-ttl-s (* 24 60 60))

(defonce ^:private *server (atom nil))

(defn- repo-root
  []
  (.getCanonicalPath (java.io.File. "..")))

(defn- db-sync-script
  []
  (str (repo-root) "/cli-e2e/scripts/db_sync_server.py"))

(defn- free-port
  []
  (with-open [socket (ServerSocket. 0)]
    (.getLocalPort socket)))

(defn- create-tmp-dir
  []
  (str (Files/createTempDirectory "logseq-e2e-db-sync-" (into-array java.nio.file.attribute.FileAttribute []))))

(defn- run-process!
  "Run a command synchronously and return its exit code. Used instead of
  clojure.java.shell/sh because the shutdown hook runs after the agent pool
  backing shell/sh's future is already terminated."
  [& cmd]
  (let [process (.start (ProcessBuilder. ^"[Ljava.lang.String;" (into-array String cmd)))]
    (.waitFor process)))

(defn ensure-started!
  "Start the shared local db-sync server (once per test JVM).
  Returns {:port :http-base :ws-url :log-file}."
  []
  (if-let [server @*server]
    server
    (locking *server
      (if-let [server @*server]
        server
        (let [port (free-port)
              dir (create-tmp-dir)
              pid-file (str dir "/db-sync-server.pid")
              log-file (str dir "/db-sync-server.log")
              data-dir (str dir "/db-sync-server-data")
              exit (run-process!
                    "python3" (db-sync-script) "start"
                    "--repo-root" (repo-root)
                    "--pid-file" pid-file
                    "--log-file" log-file
                    "--data-dir" data-dir
                    "--host" "127.0.0.1"
                    "--port" (str port)
                    "--startup-timeout-s" "60"
                    ;; no auth.json on e2e machines; issuer/client-id/jwks
                    ;; come from the explicit flags below
                    "--auth-path" ""
                    "--cognito-issuer" cognito-issuer
                    "--cognito-client-id" cognito-client-id
                    "--cognito-jwks-url" (str "http://127.0.0.1:" port "/jwks.json"))]
          (when-not (zero? exit)
            (throw (ex-info "local db-sync server failed to start"
                            {:exit exit :log-file log-file})))
          (.addShutdownHook (Runtime/getRuntime)
                            (Thread. ^Runnable
                                     (fn [] (run-process! "python3" (db-sync-script) "stop"
                                                          "--pid-file" pid-file))))
          (reset! *server
                  {:port port
                   :http-base (str "http://127.0.0.1:" port)
                   :ws-url (str "ws://127.0.0.1:" port "/sync/%s")
                   :log-file log-file}))))))

(defn- base64url
  [^String s]
  (.encodeToString (.withoutPadding (Base64/getUrlEncoder))
                   (.getBytes s StandardCharsets/UTF_8)))

(defn- test-jwt
  [now-s]
  (let [header {"alg" "none" "typ" "JWT"}
        payload {"sub" test-user-sub
                 "cognito:username" test-username
                 "preferred_username" test-username
                 "username" test-username
                 "name" "E2E Test"
                 "email" test-email
                 "email_verified" true
                 "iss" cognito-issuer
                 "aud" cognito-client-id
                 "client_id" cognito-client-id
                 "token_use" "id"
                 "iat" now-s
                 "exp" (+ now-s token-ttl-s)}]
    (str (base64url (json/write-value-as-string header)) "."
         (base64url (json/write-value-as-string payload)) "."
         "e2e-signature")))

(defn test-login
  "Auth artifacts for the local db-sync server, to be written to localStorage
  before the app boots: sync-server-url plus id/access/refresh tokens."
  []
  (let [server (ensure-started!)
        now-s (quot (System/currentTimeMillis) 1000)
        jwt (test-jwt now-s)]
    {:http-base (:http-base server)
     :id-token jwt
     :access-token jwt
     :refresh-token "e2e-refresh-token"}))

(defn- post-json!
  [url token payload]
  (let [request (-> (java.net.http.HttpRequest/newBuilder (java.net.URI/create url))
                    (.header "authorization" (str "Bearer " token))
                    (.header "content-type" "application/json")
                    (.POST (java.net.http.HttpRequest$BodyPublishers/ofString
                            (json/write-value-as-string payload)))
                    (.build))
        ;; HTTP/1.1 explicitly: the default HTTP_2 client sends an h2c upgrade
        ;; that the node adapter resets
        client (-> (java.net.http.HttpClient/newBuilder)
                   (.version java.net.http.HttpClient$Version/HTTP_1_1)
                   (.build))
        response (.send client request
                        (java.net.http.HttpResponse$BodyHandlers/ofString))]
    (when-not (<= 200 (.statusCode response) 299)
      (throw (ex-info "POST failed"
                      {:url url :status (.statusCode response) :body (.body response)})))))

(defn seed-remote-graph!
  "Create one remote graph owned by the test user. The all-graphs page only
  renders its Refresh button when the account already has remote graphs, and
  tests wait on that button — the prod e2etest account always had some. `sync`
  is the map from `test-login`."
  [{:keys [http-base id-token]}]
  (post-json! (str http-base "/graphs") id-token
              {"graph-name" "e2e-seed-graph"
               "schema-version" "65.34"
               "graph-e2ee?" false
               "graph-ready-for-use?" true}))
