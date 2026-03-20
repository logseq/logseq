(ns logseq.cli.integration-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is async]]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.auth :as cli-auth]
            [logseq.cli.main :as cli-main]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

;; NOTE: Non-sync CLI integration coverage moved to cli-e2e shell tests.
;; Keep this namespace focused on auth and sync integration coverage only.
;; See `cli-e2e/spec/non_sync_cases.edn` and run `bb dev:cli-e2e` for non-sync e2e coverage.

(defn- run-cli
  [args data-dir cfg-path]
  (let [args (vec args)
        output-idx (.indexOf args "--output")
        [args output-args] (if (and (>= output-idx 0)
                                    (< (inc output-idx) (count args)))
                             [(vec (concat (subvec args 0 output-idx)
                                           (subvec args (+ output-idx 2))))
                              ["--output" (nth args (inc output-idx))]]
                             [args []])
        output-args (if (seq output-args)
                      output-args
                      ["--output" "json"])
        global-opts ["--data-dir" data-dir "--config" cfg-path]
        final-args (vec (concat global-opts output-args args))]
    (-> (cli-main/run! final-args {:exit? false})
        (p/then (fn [result]
                  (let [res (if (map? result)
                              result
                              (js->clj result :keywordize-keys true))]
                    res))))))

(defn- parse-json-output
  [result]
  (try
    (js->clj (js/JSON.parse (:output result)) :keywordize-keys true)
    (catch :default e
      (throw (ex-info "json parse failed"
                      {:output (:output result)}
                      e)))))

(defn- parse-json-output-safe
  [result label]
  (try
    (parse-json-output result)
    (catch :default e
      (throw (ex-info (str "json parse failed: " label)
                      {:label label
                       :output (:output result)}
                      e)))))

(defn- stop-repo!
  [data-dir cfg-path repo]
  (p/let [result (run-cli ["server" "stop" "--graph" repo] data-dir cfg-path)]
    (parse-json-output result)))

(defn- sample-auth
  ([]
   (sample-auth {}))
  ([overrides]
   (merge {:provider "cognito"
           :id-token "id-token-1"
           :access-token "access-token-1"
           :refresh-token "refresh-token-1"
           :expires-at (+ (js/Date.now) 3600000)
           :sub "user-123"
           :email "user@example.com"
           :updated-at 1735686000000}
          overrides)))

(deftest ^:long test-cli-login-integration
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-login-data")
               cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
               auth-path (node-path/join (node-helper/create-tmp-dir "cli-auth") "auth.json")
               open-calls (atom [])
               auth-data (sample-auth)]
           (fs/writeFileSync cfg-path "{:output-format :json}")
           (let [promise
                 (p/with-redefs [cli-auth/default-auth-path (fn [] auth-path)
                                 cli-auth/open-browser! (fn [authorize-url]
                                                          (swap! open-calls conj authorize-url)
                                                          (let [parsed (js/URL. authorize-url)
                                                                redirect-uri (.get (.-searchParams parsed) "redirect_uri")
                                                                state (.get (.-searchParams parsed) "state")]
                                                            (-> (js/fetch (str redirect-uri "?code=integration-code&state=" state))
                                                                (p/then (fn [_]
                                                                          {:opened? true})))))
                                 cli-auth/exchange-code-for-auth! (fn [_opts payload]
                                                                    (is (= "integration-code" (:code payload)))
                                                                    (p/resolved auth-data))]
                   (p/let [result (run-cli ["login"] data-dir cfg-path)
                           payload (parse-json-output-safe result "login")
                           stored (cli-auth/read-auth-file {:auth-path auth-path})]
                     (is (= 0 (:exit-code result)))
                     (is (= "ok" (:status payload)))
                     (is (= auth-path (get-in payload [:data :auth-path])))
                     (is (= "user@example.com" (get-in payload [:data :email])))
                     (is (= 1 (count @open-calls)))
                     (is (= auth-data stored))
                     (is (fs/existsSync auth-path))))]
             (-> promise
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (done))))))))

(deftest ^:long test-cli-logout-integration
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-logout-data")
               cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
               auth-path (node-path/join (node-helper/create-tmp-dir "cli-auth") "auth.json")
               open-calls (atom [])]
           (fs/writeFileSync cfg-path "{:output-format :json}")
           (cli-auth/write-auth-file! {:auth-path auth-path} (sample-auth))
           (let [promise
                 (p/with-redefs [cli-auth/default-auth-path (fn [] auth-path)
                                 cli-auth/open-browser! (fn [url]
                                                          (swap! open-calls conj url)
                                                          (let [parsed (js/URL. url)
                                                                logout-uri (.get (.-searchParams parsed) "logout_uri")]
                                                            (-> (js/fetch logout-uri)
                                                                (p/then (fn [_]
                                                                          {:opened? true})))))]
                   (p/let [result (run-cli ["logout"] data-dir cfg-path)
                           payload (parse-json-output-safe result "logout")]
                     (is (= 0 (:exit-code result)))
                     (is (= "ok" (:status payload)))
                     (is (= 1 (count @open-calls)))
                     (is (= auth-path (get-in payload [:data :auth-path])))
                     (is (= true (get-in payload [:data :deleted?])))
                     (is (= true (get-in payload [:data :opened?])))
                     (is (= true (get-in payload [:data :logout-completed?])))
                     (is (not (fs/existsSync auth-path)))))]
             (-> promise
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (done))))))))

(deftest ^:long test-cli-sync-remote-graphs-refreshes-auth-file-and-injects-runtime-token
  (async done
         (let [data-dir (node-helper/create-tmp-dir "cli-sync-auth")
               cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
               auth-path (node-path/join (node-helper/create-tmp-dir "cli-auth") "auth.json")
               invoke-calls (atom [])
               expired-auth (sample-auth {:id-token "expired-token"
                                          :access-token "expired-access-token"
                                          :expires-at 0})
               refreshed-auth (sample-auth {:id-token "fresh-token"
                                            :access-token "fresh-access-token"
                                            :expires-at (+ (js/Date.now) 7200000)
                                            :updated-at 1735689600000})]
           (fs/writeFileSync cfg-path "{:output-format :json}")
           (cli-auth/write-auth-file! {:auth-path auth-path} expired-auth)
           (let [promise
                 (p/with-redefs [cli-auth/default-auth-path (fn [] auth-path)
                                 cli-auth/refresh-auth! (fn [_opts _auth-data]
                                                          (p/resolved refreshed-auth))
                                 cli-server/list-graphs (fn [_config]
                                                          ["demo"])
                                 cli-server/ensure-server! (fn [config _repo]
                                                             (p/resolved (assoc config :base-url "http://example")))
                                 transport/invoke (fn [_ method direct-pass? args]
                                                    (swap! invoke-calls conj [method direct-pass? args])
                                                    (case method
                                                      :thread-api/set-db-sync-config
                                                      (p/resolved nil)
                                                      :thread-api/db-sync-list-remote-graphs
                                                      (p/resolved [])
                                                      (p/resolved nil)))]
                   (p/let [result (run-cli ["sync" "remote-graphs"] data-dir cfg-path)
                           payload (parse-json-output-safe result "sync remote-graphs")
                           stored (cli-auth/read-auth-file {:auth-path auth-path})]
                     (is (= 0 (:exit-code result)))
                     (is (= "ok" (:status payload)))
                     (is (= :thread-api/set-db-sync-config (ffirst @invoke-calls)))
                     (is (= "fresh-token" (get-in (nth @invoke-calls 0) [2 0 :auth-token])))
                     (is (= "fresh-token" (:id-token stored)))
                     (is (= "fresh-access-token" (:access-token stored)))))]
             (-> promise
                 (p/catch (fn [e]
                            (is false (str "unexpected error: " e))))
                 (p/finally (fn []
                              (done))))))))

(deftest ^:long test-cli-sync-download-and-start-readiness-with-mocked-sync
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-sync-cli")
               download-repo "sync-download-graph"
               start-repo "sync-start-graph"
               invoke-calls (atom [])
               status-calls (atom 0)]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json :e2ee-password \"pw\"}")
                       create-result (run-cli ["graph" "create" "--graph" start-repo] data-dir cfg-path)
                       create-payload (parse-json-output-safe create-result "graph create")
                       _ (is (= 0 (:exit-code create-result)))
                       _ (is (= "ok" (:status create-payload)))
                       [download-result start-result]
                       (p/with-redefs [cli-auth/resolve-auth-token! (fn [_config]
                                                                      (p/resolved "runtime-token"))
                                       cli-server/ensure-server! (fn [config _repo]
                                                                   (p/resolved (assoc config :base-url "http://example")))
                                       transport/invoke (fn [_ method _direct-pass? args]
                                                          (swap! invoke-calls conj [method args])
                                                          (case method
                                                            :thread-api/set-db-sync-config
                                                            (p/resolved nil)

                                                            :thread-api/db-sync-list-remote-graphs
                                                            (p/resolved [{:graph-id "remote-graph-id"
                                                                          :graph-name download-repo
                                                                          :graph-e2ee? true}])

                                                            :thread-api/db-sync-download-graph-by-id
                                                            (p/resolved {:repo "logseq_db_sync_integration_graph"
                                                                         :graph-id "remote-graph-id"
                                                                         :remote-tx 22
                                                                         :graph-e2ee? true
                                                                         :row-count 3})

                                                            :thread-api/db-sync-start
                                                            (p/resolved nil)

                                                            :thread-api/db-sync-status
                                                            (let [idx (swap! status-calls inc)]
                                                              (p/resolved {:repo "logseq_db_sync_integration_graph"
                                                                           :ws-state (if (= idx 1) :connecting :open)
                                                                           :pending-local 0
                                                                           :pending-asset 0
                                                                           :pending-server 0}))

                                                            :thread-api/q
                                                            (p/resolved 0)

                                                            (p/resolved nil)))]
                         (p/let [download-result (run-cli ["--graph" download-repo "sync" "download"] data-dir cfg-path)
                                 start-result (run-cli ["--graph" start-repo "sync" "start"] data-dir cfg-path)]
                           [download-result start-result]))
                       download-payload (parse-json-output-safe download-result "sync download")
                       start-payload (parse-json-output-safe start-result "sync start")]
                 (is (some #(= :thread-api/db-sync-download-graph-by-id (first %)) @invoke-calls))
                 (is (some #(= :thread-api/q (first %)) @invoke-calls))
                 (is (some #(= :thread-api/db-sync-status (first %)) @invoke-calls))
                 (is (= 0 (:exit-code download-result)))
                 (is (= "ok" (:status download-payload)))
                 (is (= "remote-graph-id" (get-in download-payload [:data :graph-id])))
                 (is (= 22 (get-in download-payload [:data :remote-tx])))
                 (is (= 0 (:exit-code start-result)))
                 (is (= "ok" (:status start-payload))
                     (pr-str start-payload))
                 (is (contains? #{"open" :open}
                                (get-in start-payload [:data :ws-state])))
                 (stop-repo! data-dir cfg-path start-repo)
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest ^:long test-cli-sync-upload-with-mocked-worker-bootstrap
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-sync-upload-cli")
               upload-repo "sync-upload-graph"
               invoke-calls (atom [])]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" upload-repo] data-dir cfg-path)
                       create-payload (parse-json-output-safe create-result "graph create")
                       _ (is (= 0 (:exit-code create-result)))
                       _ (is (= "ok" (:status create-payload)))
                       upload-result (p/with-redefs
                                      [cli-auth/resolve-auth-token! (fn [_config]
                                                                      (p/resolved "runtime-token"))
                                       cli-server/ensure-server! (fn [config _repo]
                                                                   (p/resolved (assoc config :base-url "http://example")))
                                       transport/invoke (fn [_ method _direct-pass? args]
                                                          (swap! invoke-calls conj [method args])
                                                          (case method
                                                            :thread-api/set-db-sync-config
                                                            (p/resolved nil)

                                                            :thread-api/db-sync-upload-graph
                                                            (p/resolved {:graph-id "created-graph-id"})

                                                            (p/resolved nil)))]
                                       (run-cli ["--graph" upload-repo "sync" "upload"] data-dir cfg-path))
                       upload-payload (parse-json-output-safe upload-result "sync upload")]
                 (is (= 0 (:exit-code upload-result)))
                 (is (= "ok" (:status upload-payload)))
                 (is (= "created-graph-id" (get-in upload-payload [:data :graph-id])))
                 (is (= [[:thread-api/set-db-sync-config [{:ws-url "wss://api.logseq.io/sync/%s"
                                                           :http-base "https://api.logseq.io"
                                                           :auth-token "runtime-token"
                                                           :e2ee-password nil}]]
                         [:thread-api/db-sync-upload-graph ["logseq_db_sync-upload-graph"]]]
                        @invoke-calls))
                 (stop-repo! data-dir cfg-path upload-repo))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

(deftest ^:long test-cli-sync-upload-followed-by-graph-info-shows-graph-uuid-test
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-sync-upload-info-cli")
               upload-repo "sync-upload-graph-info"
               uploaded-graph-id "0f64b4a9-6f31-4f35-a83c-6b16f9ddf1ff"
               invoke-calls (atom [])]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--graph" upload-repo] data-dir cfg-path)
                       create-payload (parse-json-output-safe create-result "graph create")
                       _ (is (= 0 (:exit-code create-result)))
                       _ (is (= "ok" (:status create-payload)))
                       [upload-result info-result]
                       (p/with-redefs [cli-auth/resolve-auth-token! (fn [_config]
                                                                      (p/resolved "runtime-token"))
                                       cli-server/ensure-server! (fn [config _repo]
                                                                   (p/resolved (assoc config :base-url "http://example")))
                                       transport/invoke (fn [_ method _direct-pass? args]
                                                          (swap! invoke-calls conj [method args])
                                                          (case method
                                                            :thread-api/set-db-sync-config
                                                            (p/resolved nil)

                                                            :thread-api/db-sync-upload-graph
                                                            (p/resolved {:graph-id uploaded-graph-id})

                                                            :thread-api/q
                                                            (p/resolved [[:logseq.kv/graph-uuid uploaded-graph-id]
                                                                         [:logseq.kv/schema-version "65"]])

                                                            (p/resolved nil)))]
                         (p/let [upload-result (run-cli ["--graph" upload-repo "sync" "upload"] data-dir cfg-path)
                                 info-result (run-cli ["--graph" upload-repo "graph" "info"] data-dir cfg-path)]
                           [upload-result info-result]))
                       upload-payload (parse-json-output-safe upload-result "sync upload")
                       info-payload (parse-json-output-safe info-result "graph info after upload")
                       q-call (some (fn [[method args]]
                                      (when (= :thread-api/q method)
                                        args))
                                    @invoke-calls)]
                 (is (= 0 (:exit-code upload-result)))
                 (is (= "ok" (:status upload-payload)))
                 (is (= uploaded-graph-id (get-in upload-payload [:data :graph-id])))
                 (is (= 0 (:exit-code info-result)))
                 (is (= "ok" (:status info-payload)))
                 (is (= uploaded-graph-id
                        (get-in info-payload [:data :kv :logseq.kv/graph-uuid])))
                 (is (= "logseq_db_sync-upload-graph-info" (first q-call)))
                 (stop-repo! data-dir cfg-path upload-repo))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))))
               (p/finally done)))))

