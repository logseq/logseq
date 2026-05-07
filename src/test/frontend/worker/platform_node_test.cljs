(ns frontend.worker.platform-node-test
  (:require ["fs" :as fs]
            ["keytar" :as keytar]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.platform.node :as platform-node]
            [goog.object :as gobj]
            [promesa.core :as p]))

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

(deftest node-platform-runtime-dependency-is-node-sqlite
  (let [source (node-platform-source)]
    (is (string/includes? source "\"node:sqlite\""))
    (is (not (string/includes? source "\"better-sqlite3\"")))))

(deftest node-platform-backup-uses-shared-sqlite-backup-implementation
  (let [source (node-platform-source)]
    (is (string/includes? source "logseq.db.sqlite.backup"))
    (is (string/includes? source "sqlite-backup/backup-connection!"))))

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
          original-save (gobj/get keytar "setPassword")
          original-read (gobj/get keytar "getPassword")
          original-delete (gobj/get keytar "deletePassword")]
      (gobj/set process-env "CLI_E2E_TEST" "1")
      (gobj/set keytar "setPassword" (fn [& _]
                                        (swap! calls update :save inc)
                                        (js/Promise.resolve true)))
      (gobj/set keytar "getPassword" (fn [& _]
                                        (swap! calls update :read inc)
                                        (js/Promise.resolve nil)))
      (gobj/set keytar "deletePassword" (fn [& _]
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
                       (gobj/set keytar "setPassword" original-save)
                       (gobj/set keytar "getPassword" original-read)
                       (gobj/set keytar "deletePassword" original-delete)
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
          original-save (gobj/get keytar "setPassword")
          original-read (gobj/get keytar "getPassword")
          original-delete (gobj/get keytar "deletePassword")]
      (gobj/remove process-env "CLI_E2E_TEST")
      (gobj/set keytar "setPassword" (fn [_service key value]
                                        (swap! calls update :save inc)
                                        (swap! secrets assoc key value)
                                        (js/Promise.resolve true)))
      (gobj/set keytar "getPassword" (fn [_service key]
                                        (swap! calls update :read inc)
                                        (js/Promise.resolve (get @secrets key))))
      (gobj/set keytar "deletePassword" (fn [_service key]
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
                       (gobj/set keytar "setPassword" original-save)
                       (gobj/set keytar "getPassword" original-read)
                       (gobj/set keytar "deletePassword" original-delete)
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
