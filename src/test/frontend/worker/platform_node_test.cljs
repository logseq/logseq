(ns frontend.worker.platform-node-test
  (:require ["fs" :as fs]
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
  (let [data-dir (node-helper/create-tmp-dir "platform-node")
        db-path (node-path/join data-dir "db.sqlite")]
    (p/let [platform (platform-node/node-platform {:data-dir data-dir})
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

(deftest node-platform-env-owner-source-is-propagated
  (async done
    (let [data-dir (node-helper/create-tmp-dir "platform-node-owner-source")]
      (-> (p/let [platform-cli (platform-node/node-platform {:data-dir data-dir
                                                              :owner-source :cli})
                  platform-default (platform-node/node-platform {:data-dir data-dir})]
            (is (= :cli (get-in platform-cli [:env :owner-source])))
            (is (= :unknown (get-in platform-default [:env :owner-source]))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest kv-store-preserves-uint8array-values-across-reloads-test
  (async done
    (let [data-dir (node-helper/create-tmp-dir "platform-node-kv-store")
          key "rtc-encrypted-aes-key###graph-1"
          value (js/Uint8Array. #js [1 2 3 255])]
      (-> (p/let [platform-a (platform-node/node-platform {:data-dir data-dir})
                  kv-a (:kv platform-a)
                  _ ((:set! kv-a) key value)
                  loaded-a ((:get kv-a) key)
                  platform-b (platform-node/node-platform {:data-dir data-dir})
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
