(ns frontend.worker.platform-node-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.platform.node :as platform-node]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defn- node-require
  [module-name]
  ((js* "module.require.bind(module)") module-name))

(def ^:private node-module
  (node-require "node:module"))

(defn- install-keytar-loader!
  [fake-keytar]
  (let [original-load (gobj/get node-module "_load")]
    (gobj/set node-module "_load"
              (fn [request parent is-main]
                (if (= request "keytar")
                  fake-keytar
                  (.call original-load node-module request parent is-main))))
    (fn []
      (gobj/set node-module "_load" original-load))))

(defn- node-platform-source
  []
  (let [source-path (node-path/join (.cwd js/process)
                                    "src"
                                    "main"
                                    "frontend"
                                    "worker"
                                    "platform"
                                    "node.cljs")]
    (.toString (fs/readFileSync source-path) "utf8")))

(defn- js-bind
  [pairs]
  (let [bind (js-obj)]
    (doseq [[k v] pairs]
      (gobj/set bind k v))
    bind))

(defn- set-process-platform-arch!
  [platform arch]
  (let [platform-descriptor (js/Object.getOwnPropertyDescriptor js/process "platform")
        arch-descriptor (js/Object.getOwnPropertyDescriptor js/process "arch")]
    (js/Object.defineProperty js/process "platform"
                              #js {:value platform
                                   :enumerable true
                                   :configurable true})
    (js/Object.defineProperty js/process "arch"
                              #js {:value arch
                                   :enumerable true
                                   :configurable true})
    (fn []
      (js/Object.defineProperty js/process "platform" platform-descriptor)
      (js/Object.defineProperty js/process "arch" arch-descriptor))))

(defn- <open-test-db
  []
  (let [root-dir (node-helper/create-tmp-dir "platform-node")
        db-path (node-path/join root-dir "db.sqlite")]
    (p/let [platform (platform-node/node-platform {:root-dir root-dir})
            sqlite (:sqlite platform)
            db ((:open-db sqlite) {:path db-path})]
      {:sqlite sqlite
       :db db})))

(defn- close-db!
  [{:keys [sqlite db]}]
  (when (and sqlite db)
    (try
      ((:close-db sqlite) db)
      (catch :default _ nil))))

(defn- exec!
  ([sqlite db sql]
   ((:exec sqlite) db sql))
  ([sqlite db sql bind row-mode]
   (let [opts (js-obj "sql" sql)]
     (when (some? bind)
       (gobj/set opts "bind" bind))
     (when (some? row-mode)
       (gobj/set opts "rowMode" row-mode))
     ((:exec sqlite) db opts))))

(deftest node-platform-uses-linked-melange-js-api-package
  (let [source (node-platform-source)]
    (is (string/includes? source "@logseq/melange-js-api"))
    (is (not (string/includes? source "./melange-js-api-node.js")))))

(deftest node-platform-disables-vector-embedding-off-macos
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-no-vector-embedding")
          restore! (set-process-platform-arch! "linux" "x64")]
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})]
            (is (nil? (:embedding platform)))
            (is (nil? (:vector platform))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (restore!)
                       (done)))))))

(deftest node-platform-disables-vector-embedding-on-macos-x64
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-vector-embedding-x64")
          restore! (set-process-platform-arch! "darwin" "x64")]
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})]
            (is (nil? (:embedding platform)))
            (is (nil? (:vector platform))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (restore!)
                       (done)))))))

(deftest node-platform-embedding-backend-calls-local-server
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-embedding-text")
          restore-platform! (set-process-platform-arch! "darwin" "arm64")
          original-fetch js/fetch
          calls (atom [])]
      (set! js/fetch
            (fn [url opts]
              (swap! calls conj {:url url
                                 :method (gobj/get opts "method")
                                 :headers (js->clj (gobj/get opts "headers"))
                                 :body (js->clj (js/JSON.parse (gobj/get opts "body"))
                                                :keywordize-keys true)})
              (p/resolved #js {:ok true
                                :status 200
                                :json (fn []
                                        (p/resolved
                                         (clj->js {:data [{:index 1
                                                           :embedding [4 5 6]}
                                                          {:index 0
                                                           :embedding [1 2 3]}]})))})))
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir
                                                         :embedding-endpoint "http://127.0.0.1:8765/v1/embeddings"})
                  embeddings ((get-in platform [:embedding :embed-texts]) ["hello" "world"])]
            (is (= [[1 2 3] [4 5 6]] embeddings))
            (is (= [{:url "http://127.0.0.1:8765/v1/embeddings"
                     :method "POST"
                     :headers {"Content-Type" "application/json"}
                     :body {:model "all-MiniLM-L6-v2"
                            :input ["hello" "world"]}}]
                   @calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! js/fetch original-fetch)
                       (restore-platform!)
                       (done)))))))

(deftest node-platform-env-owner-source-is-propagated
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-owner-source")]
      (-> (p/let [platform-cli (platform-node/node-platform {:root-dir root-dir
                                                              :owner-source :cli})
                  platform-default (platform-node/node-platform {:root-dir root-dir})]
            (is (= :cli (get-in platform-cli [:env :owner-source])))
            (is (= :unknown (get-in platform-default [:env :owner-source]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest node-platform-writes-text-atomically-and-deletes-files
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-text-files")]
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})
                  storage (:storage platform)
                  path "graph-a/mirror/markdown/pages/page.md"
                  _ ((:write-text-atomic! storage) path "mirror")
                  content ((:read-text! storage) path)
                  _ ((:delete-file! storage) path)
                  deleted-content (-> ((:read-text! storage) path)
                                      (p/catch (constantly nil)))]
            (is (= "mirror" content))
            (is (nil? deleted-content))
            (is (empty? (filter #(string/includes? % ".tmp-")
                                (array-seq (fs/readdirSync
                                            (node-path/join root-dir "graphs" "graph-a" "mirror" "markdown" "pages")))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest node-platform-cli-owner-bypasses-keychain-in-cli-e2e-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-cli-secrets")
          process-env (.-env js/process)
          original-cli-e2e-test (gobj/get process-env "CLI_E2E_TEST")
          calls (atom {:save 0 :read 0 :delete 0})
          fake-keytar (js-obj)
          restore-keytar-loader! (install-keytar-loader! fake-keytar)]
      (gobj/set process-env "CLI_E2E_TEST" "1")
      (gobj/set fake-keytar "setPassword" (fn [& _]
                                             (swap! calls update :save inc)
                                             (js/Promise.resolve true)))
      (gobj/set fake-keytar "getPassword" (fn [& _]
                                             (swap! calls update :read inc)
                                             (js/Promise.resolve nil)))
      (gobj/set fake-keytar "deletePassword" (fn [& _]
                                                (swap! calls update :delete inc)
                                                (js/Promise.resolve true)))
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir
                                                         :owner-source :cli})
                  crypto (:crypto platform)
                  kv (:kv platform)
                  _ ((:save-secret-text! crypto) "secret-key" "secret-value")
                  kv-value ((:get kv) "secret-key")
                  secret-value ((:read-secret-text crypto) "secret-key")
                  _ ((:delete-secret-text! crypto) "secret-key")
                  kv-cleared ((:get kv) "secret-key")]
            (is (= "secret-value" kv-value))
            (is (= "secret-value" secret-value))
            (is (nil? kv-cleared))
            (is (= {:save 0 :read 0 :delete 0} @calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (restore-keytar-loader!)
                       (if (some? original-cli-e2e-test)
                         (gobj/set process-env "CLI_E2E_TEST" original-cli-e2e-test)
                         (gobj/remove process-env "CLI_E2E_TEST"))
                       (done)))))))

(deftest node-platform-cli-owner-uses-keychain-when-keychain-present
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-cli-secrets-keychain")
          process-env (.-env js/process)
          original-cli-e2e-test (gobj/get process-env "CLI_E2E_TEST")
          calls (atom {:save 0 :read 0 :delete 0})
          secrets (atom {})
          fake-keytar (js-obj)
          restore-keytar-loader! (install-keytar-loader! fake-keytar)]
      (gobj/remove process-env "CLI_E2E_TEST")
      (gobj/set fake-keytar "setPassword" (fn [_service key value]
                                             (swap! calls update :save inc)
                                             (swap! secrets assoc key value)
                                             (js/Promise.resolve true)))
      (gobj/set fake-keytar "getPassword" (fn [_service key]
                                             (swap! calls update :read inc)
                                             (js/Promise.resolve (get @secrets key))))
      (gobj/set fake-keytar "deletePassword" (fn [_service key]
                                                (swap! calls update :delete inc)
                                                (swap! secrets dissoc key)
                                                (js/Promise.resolve true)))
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir
                                                         :owner-source :cli})
                  crypto (:crypto platform)
                  kv (:kv platform)
                  _ ((:save-secret-text! crypto) "secret-key" "secret-value")
                  kv-value ((:get kv) "secret-key")
                  secret-value ((:read-secret-text crypto) "secret-key")
                  _ ((:delete-secret-text! crypto) "secret-key")
                  deleted-value ((:read-secret-text crypto) "secret-key")]
            (is (nil? kv-value))
            (is (= "secret-value" secret-value))
            (is (nil? deleted-value))
            (is (= {:save 1 :read 2 :delete 1} @calls)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (restore-keytar-loader!)
                       (if (some? original-cli-e2e-test)
                         (gobj/set process-env "CLI_E2E_TEST" original-cli-e2e-test)
                         (gobj/remove process-env "CLI_E2E_TEST"))
                       (done)))))))

(deftest kv-store-preserves-uint8array-values-across-reloads-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store")
          key "rtc-encrypted-aes-key###graph-1"
          value (js/Uint8Array. #js [1 2 3 255])]
      (-> (p/let [platform-a (platform-node/node-platform {:root-dir root-dir})
                  kv-a (:kv platform-a)
                  _ ((:set! kv-a) key value)
                  loaded-a ((:get kv-a) key)
                  platform-b (platform-node/node-platform {:root-dir root-dir})
                  kv-b (:kv platform-b)
                  loaded-b ((:get kv-b) key)]
            (is (instance? js/Uint8Array loaded-a))
            (is (= [1 2 3 255] (vec (js->clj loaded-a))))
            (is (instance? js/Uint8Array loaded-b))
            (is (= [1 2 3 255] (vec (js->clj loaded-b)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest exec-sql-string-creates-schema-and-writes-data
  (async done
    (let [conn* (atom nil)]
      (-> (p/let [{:keys [sqlite db] :as conn} (<open-test-db)
                  _ (reset! conn* conn)
                  _ (exec! sqlite db "create table kvs (addr text primary key, content text);")
                  _ (exec! sqlite db "insert into kvs (addr, content) values ('a', 'payload');")
                  rows (exec! sqlite db "select addr, content from kvs order by addr" nil "array")]
            (is (= [["a" "payload"]]
                   (mapv vec (js->clj rows)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest exec-row-mode-array-returns-index-addressable-rows
  (async done
    (let [conn* (atom nil)]
      (-> (p/let [{:keys [sqlite db] :as conn} (<open-test-db)
                  _ (reset! conn* conn)
                  _ (exec! sqlite db "create table kvs (addr text primary key, content text, addresses text);")
                  _ (exec! sqlite db "insert into kvs (addr, content, addresses) values (?, ?, ?)"
                           #js ["a" "alpha" "[\"x\",\"y\"]"] nil)
                  rows (exec! sqlite db "select content, addresses from kvs where addr = ?"
                             #js ["a"] "array")]
            (is (array? (first rows)))
            (is (= [["alpha" "[\"x\",\"y\"]"]]
                   (mapv vec (js->clj rows)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest exec-accepts-dollar-and-colon-bind-key-styles
  (async done
    (let [conn* (atom nil)]
      (-> (p/let [{:keys [sqlite db] :as conn} (<open-test-db)
                  _ (reset! conn* conn)
                  _ (exec! sqlite db "create table kvs (addr text primary key, content text);")
                  _ (exec! sqlite db "insert into kvs (addr, content) values ($addr, $content)"
                           (js-bind [["$addr" "a"] ["$content" "dollar"]]) nil)
                  _ (exec! sqlite db "insert into kvs (addr, content) values ($addr, $content)"
                           (js-bind [[":addr" "b"] [":content" "colon"]]) nil)
                  rows (exec! sqlite db "select addr, content from kvs order by addr" nil "array")]
            (is (= [["a" "dollar"] ["b" "colon"]]
                   (mapv vec (js->clj rows)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest transaction-commits-on-success
  (async done
    (let [conn* (atom nil)]
      (-> (p/let [{:keys [sqlite db] :as conn} (<open-test-db)
                  _ (reset! conn* conn)
                  _ (exec! sqlite db "create table tx_log (value integer);")
                  _ ((:transaction sqlite) db
                     (fn [tx]
                       (.exec tx #js {:sql "insert into tx_log (value) values (?)"
                                      :bind #js [1]})))
                  rows (exec! sqlite db "select value from tx_log order by value" nil "array")]
            (is (= [[1]]
                   (mapv vec (js->clj rows)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest transaction-rolls-back-when-callback-throws
  (async done
    (let [conn* (atom nil)]
      (-> (p/let [{:keys [sqlite db] :as conn} (<open-test-db)
                  _ (reset! conn* conn)
                  _ (exec! sqlite db "create table tx_log (value integer);")
                  _ (try
                      ((:transaction sqlite) db
                       (fn [tx]
                         (.exec tx #js {:sql "insert into tx_log (value) values (?)"
                                        :bind #js [1]})
                         (throw (ex-info "rollback" {}))))
                      (catch :default _ nil))
                  rows (exec! sqlite db "select count(*) from tx_log" nil "array")]
            (is (= [[0]]
                   (mapv vec (js->clj rows)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest nested-transactions-keep-outer-writes-after-inner-rollback
  (async done
    (let [conn* (atom nil)]
      (-> (p/let [{:keys [sqlite db] :as conn} (<open-test-db)
                  _ (reset! conn* conn)
                  _ (exec! sqlite db "create table tx_log (value integer);")
                  _ ((:transaction sqlite) db
                     (fn [outer]
                       (.exec outer #js {:sql "insert into tx_log (value) values (?)"
                                         :bind #js [1]})
                       (try
                         (.transaction outer
                                       (fn [inner]
                                         (.exec inner #js {:sql "insert into tx_log (value) values (?)"
                                                           :bind #js [2]})
                                         (throw (ex-info "inner rollback" {}))))
                         (catch :default _ nil))
                       (.exec outer #js {:sql "insert into tx_log (value) values (?)"
                                         :bind #js [3]})))
                  rows (exec! sqlite db "select value from tx_log order by value" nil "array")]
            (testing "inner failure does not commit partial write"
              (is (= [[1] [3]]
                     (mapv vec (js->clj rows))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest sqlite-backup-db-creates-importable-copy
  (async done
    (let [conn* (atom nil)
          root-dir (node-helper/create-tmp-dir "platform-node-backup")
          backup-path (node-path/join root-dir "backup" "copy.sqlite")]
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})
                  sqlite (:sqlite platform)
                  db-path (node-path/join root-dir "source.sqlite")
                  db ((:open-db sqlite) {:path db-path})
                  _ (reset! conn* {:sqlite sqlite :db db})
                  _ (exec! sqlite db "create table kvs (addr text primary key, content text);")
                  _ (exec! sqlite db "insert into kvs (addr, content) values (?, ?)" #js ["a" "alpha"] nil)
                  _ ((:backup-db sqlite) db backup-path)
                  backup-db ((:open-db sqlite) {:path backup-path})
                  rows (exec! sqlite backup-db "select addr, content from kvs order by addr" nil "array")
                  _ ((:close-db sqlite) backup-db)]
            (is (= [["a" "alpha"]]
                   (mapv vec (js->clj rows)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (close-db! @conn*)
                       (done)))))))

(deftest storage-list-graphs-ignores-backup-root
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-list-graphs")
          graphs-dir (node-path/join root-dir "graphs")]
      (fs/mkdirSync (node-path/join graphs-dir "alpha") #js {:recursive true})
      (fs/mkdirSync (node-path/join graphs-dir "backup") #js {:recursive true})
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})
                  graphs ((get-in platform [:storage :list-graphs]))]
            (is (= ["alpha"] graphs)))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest remove-vfs-removes-lock-file
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-remove-vfs")
          lock-json "{\"repo\":\"logseq_db_demo\",\"pid\":1,\"host\":\"127.0.0.1\",\"port\":9001}"]
      (-> (p/let [platform (platform-node/node-platform {:root-dir root-dir})
                  storage (:storage platform)
                  pool ((:install-opfs-pool storage) nil "logseq_db_demo")
                  repo-dir (gobj/get pool "repoDir")
                  lock-path (node-path/join repo-dir "db-worker.lock")
                  db-path (node-path/join repo-dir "db.sqlite")
                  nested-path (node-path/join repo-dir "assets" "file.bin")
                  _ (fs/mkdirSync (node-path/dirname nested-path) #js {:recursive true})
                  _ (fs/writeFileSync lock-path lock-json "utf8")
                  _ (fs/writeFileSync db-path "db-bytes" "utf8")
                  _ (fs/writeFileSync nested-path "asset-bytes" "utf8")
                  _ ((:remove-vfs! storage) pool)]
            (is (not (fs/existsSync lock-path)))
            (is (not (fs/existsSync db-path)))
            (is (not (fs/existsSync nested-path))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
