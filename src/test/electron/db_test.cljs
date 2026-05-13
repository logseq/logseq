(ns electron.db-test
  (:require ["node:sqlite" :as node-sqlite]
            [cljs.reader :as reader]
            [cljs.test :refer [async deftest is]]
            [electron.backup-file :as backup-file]
            [electron.db :as electron-db]
            [electron.db-worker :as db-worker]
            [frontend.test.node-helper :as node-helper]
            [goog.object :as gobj]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.cli.transport :as cli-transport]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.sqlite.backup :as sqlite-backup]
            [logseq.db-worker.graph-backup :as graph-backup]
            [promesa.core :as p]
            ["fs-extra" :as fs]
            ["path" :as node-path]))

(defn- resolve-database-sync-ctor
  []
  (or (gobj/get node-sqlite "DatabaseSync")
      (some-> (gobj/get node-sqlite "default")
              (gobj/get "DatabaseSync"))
      (let [default-export (gobj/get node-sqlite "default")]
        (when (fn? default-export)
          default-export))))

(deftest ensure-graph-dir-uses-encoded-directory-name
  (let [graphs-dir (node-helper/create-tmp-dir "electron-db-graph-dir")]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [graph-dir (electron-db/ensure-graph-dir! "logseq_db_foo/bar")]
        (is (= (node-path/join graphs-dir "foo~2Fbar") graph-dir))
        (is (fs/existsSync graph-dir))))))

(deftest read-db-uses-encoded-directory-name
  (let [graphs-dir (node-helper/create-tmp-dir "electron-db-save")
        payload (.from js/Buffer "db-data")
        db-name "logseq_db_foo/bar"]
    (with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)]
      (let [[_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)]
        (fs/ensureDirSync (node-path/dirname db-path))
        (fs/writeFileSync db-path payload))
      (is (fs/existsSync (node-path/join graphs-dir "foo~2Fbar" "db.sqlite")))
      (is (= "db-data"
             (.toString (electron-db/get-db db-name)))))))

(defn- read-edn-file
  [file-path]
  (reader/read-string (fs/readFileSync file-path "utf8")))

(defn- write-backup!
  [graphs-dir repo backup-name source created-at-ms]
  (let [db-path (graph-backup/backup-db-path graphs-dir repo backup-name)
        metadata-path (graph-backup/backup-metadata-path graphs-dir repo backup-name)]
    (fs/ensureDirSync (node-path/dirname db-path))
    (fs/writeFileSync db-path (str "sqlite-" backup-name) "utf8")
    (fs/writeFileSync metadata-path
                      (pr-str {:schema-version 1
                               :name backup-name
                               :repo repo
                               :source source
                               :created-at-ms created-at-ms
                               :db-path db-path})
                      "utf8")
    db-path))

(deftest backup-db-creates-sqlite-copy-from-existing-disk-db
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-backup")
          db-name "logseq_db_foo/bar"
          DatabaseSync (resolve-database-sync-ctor)
          original-get-db-graphs-dir cli-common-graph/get-db-graphs-dir]
      (set! cli-common-graph/get-db-graphs-dir (fn [] graphs-dir))
      (let [[_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)]
        (fs/ensureDirSync (node-path/dirname db-path))
        (let [source-db (new DatabaseSync db-path)]
          (.exec source-db "create table kvs (addr text primary key, content text);")
          (.exec source-db "insert into kvs (addr, content) values ('a', 'alpha')")
          (.close source-db))
        (-> (p/let [_ (electron-db/backup-db! db-name nil)
                    backups (graph-backup/list-backups graphs-dir db-name)
                    backup-path (graph-backup/backup-db-path graphs-dir db-name (:name (first backups)))
                    backup-db (new DatabaseSync backup-path)
                    stmt (.prepare ^js backup-db "select addr, content from kvs order by addr")
                    rows (.all stmt)
                    _ (.close backup-db)]
                (is (= 1 (count backups)))
                (is (= "a" (gobj/get (first rows) "addr")))
                (is (= "alpha" (gobj/get (first rows) "content"))))
            (p/catch (fn [e]
                       (is false (str "unexpected error: " e))))
            (p/finally (fn []
                         (set! cli-common-graph/get-db-graphs-dir original-get-db-graphs-dir)
                         (done))))))))

(deftest backup-db-uses-shared-backup-layout-and-metadata
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-backup-rules")
          db-name "logseq_db_demo"
          [_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)
          sqlite-calls (atom [])
          backup-calls (atom [])]
      (fs/ensureDirSync (node-path/dirname db-path))
      (fs/writeFileSync db-path "seed")
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          sqlite-backup/backup-db-file! (fn [src dst]
                                                          (swap! sqlite-calls conj [src dst])
                                                          (fs/writeFileSync dst "copied")
                                                          (p/resolved nil))
                          backup-file/backup-file (fn [repo dir relative-path ext content & {:as opts}]
                                                    (swap! backup-calls conj {:repo repo
                                                                              :dir dir
                                                                              :relative-path relative-path
                                                                              :ext ext
                                                                              :content (.toString content)
                                                                              :opts opts})
                                                    nil)]
            (p/let [_ (electron-db/backup-db! db-name nil)]
              (is (= 1 (count @sqlite-calls)))
              (is (= db-path (first (first @sqlite-calls))))
              (is (empty? @backup-calls))
              (let [backups (graph-backup/list-backups graphs-dir db-name)
                    backup-name (:name (first backups))
                    backup-db-path (graph-backup/backup-db-path graphs-dir db-name backup-name)
                    metadata (read-edn-file (graph-backup/backup-metadata-path graphs-dir db-name backup-name))]
                (is (= 1 (count backups)))
                (is (= "copied" (fs/readFileSync backup-db-path "utf8")))
                (is (= db-name (:repo metadata)))
                (is (= :electron-auto (:source metadata)))
                (is (= backup-name (:name metadata))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest backup-db-with-sqlite-backup-uses-provided-snapshot-fn
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-backup-custom-snapshot")
          db-name "logseq_db_demo"
          [_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)
          custom-calls (atom [])
          fallback-calls (atom [])
          backup-calls (atom [])]
      (fs/ensureDirSync (node-path/dirname db-path))
      (fs/writeFileSync db-path "seed")
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          sqlite-backup/backup-db-file! (fn [src dst]
                                                          (swap! fallback-calls conj [src dst])
                                                          (p/rejected (ex-info "fallback should not run" {})))
                          backup-file/backup-file (fn [repo _dir _relative-path ext content & {:as opts}]
                                                    (swap! backup-calls conj {:repo repo
                                                                              :ext ext
                                                                              :content (.toString content)
                                                                              :opts opts})
                                                    nil)]
            (p/let [_ (electron-db/backup-db-with-sqlite-backup!
                       db-name
                       {:force-backup? true
                        :sqlite-backup! (fn [src dst]
                                          (swap! custom-calls conj [src dst])
                                          (fs/writeFileSync dst "worker-copy")
                                          (p/resolved nil))})]
              (is (= [[db-path (second (first @custom-calls))]]
                     @custom-calls))
              (is (empty? @fallback-calls))
              (is (empty? @backup-calls))
              (let [backups (graph-backup/list-backups graphs-dir db-name)
                    backup-name (:name (first backups))
                    backup-db-path (graph-backup/backup-db-path graphs-dir db-name backup-name)
                    metadata (read-edn-file (graph-backup/backup-metadata-path graphs-dir db-name backup-name))]
                (is (= 1 (count backups)))
                (is (= "worker-copy" (fs/readFileSync backup-db-path "utf8")))
                (is (= :electron-manual (:source metadata))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest backup-db-via-worker-uses-shared-layout-and-worker-snapshot
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-worker-backup")
          db-name "logseq_db_demo"
          runtime {:runtime true}
          worker-calls (atom [])
          backup-calls (atom [])]
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          db-worker/ensure-runtime! (fn [repo window-id]
                                                      (swap! worker-calls conj [:ensure-runtime repo window-id])
                                                      (p/resolved runtime))
                          cli-transport/invoke (fn [runtime' method args]
                                                 (swap! worker-calls conj [:invoke runtime' method args])
                                                 (fs/writeFileSync (second args) "worker-copy" "utf8")
                                                 (p/resolved {:path (second args)}))
                          backup-file/backup-file (fn [& args]
                                                    (swap! backup-calls conj args)
                                                    (p/resolved nil))]
            (p/let [result (electron-db/backup-db-via-worker! db-name 7 {:force-backup? true})
                    backups (graph-backup/list-backups graphs-dir db-name)
                    backup-name (:name (first backups))
                    final-db-path (graph-backup/backup-db-path graphs-dir db-name backup-name)
                    metadata (read-edn-file (graph-backup/backup-metadata-path graphs-dir db-name backup-name))
                    [_ runtime' method args] (second @worker-calls)
                    [repo snapshot-path] args]
              (is (= true (:created? result)))
              (is (= final-db-path (:path result)))
              (is (= [[:ensure-runtime db-name 7]
                      [:invoke runtime :thread-api/backup-db-sqlite [db-name snapshot-path]]]
                     @worker-calls))
              (is (= runtime runtime'))
              (is (= :thread-api/backup-db-sqlite method))
              (is (= db-name repo))
              (is (not= final-db-path snapshot-path))
              (is (= "worker-copy" (fs/readFileSync final-db-path "utf8")))
              (is (= :electron-manual (:source metadata)))
              (is (empty? @backup-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest automatic-worker-backup-throttles-recent-auto-backups
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-worker-throttle")
          db-name "logseq_db_demo"
          runtime {:runtime true}
          worker-calls (atom [])]
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          db-worker/ensure-runtime! (fn [repo window-id]
                                                      (swap! worker-calls conj [:ensure-runtime repo window-id])
                                                      (p/resolved runtime))
                          cli-transport/invoke (fn [runtime' method args]
                                                 (swap! worker-calls conj [:invoke runtime' method args])
                                                 (fs/writeFileSync (second args) "worker-copy" "utf8")
                                                 (p/resolved {:path (second args)}))]
            (p/let [first-result (electron-db/backup-db-via-worker! db-name 7 {})
                    second-result (electron-db/backup-db-via-worker! db-name 7 {})]
              (is (= true (:created? first-result)))
              (is (= {:backup-name nil
                      :path nil
                      :created? false
                      :reason :too-soon}
                     second-result))
              (is (= 1 (count (filter #(= :invoke (first %)) @worker-calls))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest automatic-worker-backup-retains-only-twelve-auto-backups
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-worker-retention")
          db-name "logseq_db_demo"
          runtime {:runtime true}
          worker-calls (atom [])]
      (doseq [idx (range 12)]
        (write-backup! graphs-dir db-name (str "auto-" idx) :electron-auto idx))
      (write-backup! graphs-dir db-name "manual-old" :electron-manual 0)
      (write-backup! graphs-dir db-name "cli-old" :cli 0)
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          db-worker/ensure-runtime! (fn [repo window-id]
                                                      (swap! worker-calls conj [:ensure-runtime repo window-id])
                                                      (p/resolved runtime))
                          cli-transport/invoke (fn [runtime' method args]
                                                 (swap! worker-calls conj [:invoke runtime' method args])
                                                 (fs/writeFileSync (second args) "worker-copy" "utf8")
                                                 (p/resolved {:path (second args)}))]
            (p/let [result (electron-db/backup-db-via-worker! db-name 7 {})
                    backup-names (set (map :name (graph-backup/list-backups graphs-dir db-name)))]
              (is (= true (:created? result)))
              (is (not (contains? backup-names "auto-0")))
              (is (contains? backup-names "manual-old"))
              (is (contains? backup-names "cli-old"))
              (is (= 14 (count backup-names)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest export-db-via-worker-writes-directly-to-destination-file
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-export-direct")
          export-dir (node-helper/create-tmp-dir "electron-db-export-direct-dst")
          db-name "logseq_db_demo"
          dst-path (node-path/join export-dir "export.sqlite")
          runtime {:runtime true}
          worker-calls (atom [])
          backup-calls (atom [])]
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          db-worker/ensure-runtime! (fn [repo window-id]
                                                      (swap! worker-calls conj [:ensure-runtime repo window-id])
                                                      (p/resolved runtime))
                          cli-transport/invoke (fn [runtime' method args]
                                                 (swap! worker-calls conj [:invoke runtime' method args])
                                                 (fs/writeFileSync dst-path "sqlite-copy")
                                                 (p/resolved {:path dst-path}))
                          backup-file/backup-file (fn [& args]
                                                    (swap! backup-calls conj args)
                                                    (p/resolved nil))]
            (p/let [result (electron-db/export-db-via-worker! db-name 7 dst-path)]
              (is (= {:path dst-path} result))
              (is (= "sqlite-copy" (fs/readFileSync dst-path "utf8")))
              (is (= [[:ensure-runtime db-name 7]
                      [:invoke runtime :thread-api/backup-db-sqlite [db-name dst-path]]]
                     @worker-calls))
              (is (empty? @backup-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest export-db-to-export-dir-via-worker-writes-under-graph-export-dir
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-export-dir")
          db-name "logseq_db_demo"
          runtime {:runtime true}
          worker-calls (atom [])]
      (-> (p/with-redefs [cli-common-graph/get-db-graphs-dir (fn [] graphs-dir)
                          db-worker/ensure-runtime! (fn [repo window-id]
                                                      (swap! worker-calls conj [:ensure-runtime repo window-id])
                                                      (p/resolved runtime))
                          cli-transport/invoke (fn [_runtime method args]
                                                 (swap! worker-calls conj [:invoke method args])
                                                 (p/resolved {:path (second args)}))]
            (p/let [result (electron-db/export-db-to-export-dir-via-worker!
                            db-name 7 "../export.sqlite")]
              (let [expected-path (node-path/join graphs-dir "demo" "export" "export.sqlite")]
                (is (= expected-path (:path result)))
                (is (= [[:ensure-runtime db-name 7]
                        [:invoke :thread-api/backup-db-sqlite [db-name expected-path]]]
                       @worker-calls)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest auto-backup-tracker-runs-hourly-for-active-repos
  (async done
    (let [set-interval-calls (atom [])
          clear-interval-calls (atom [])
          backup-calls (atom [])
          timer-id #js {:id 1}
          original-set-interval js/setInterval
          original-clear-interval js/clearInterval]
      (electron-db/reset-auto-backup!)
      (set! js/setInterval (fn [f ms]
                             (swap! set-interval-calls conj [f ms])
                             timer-id))
      (set! js/clearInterval (fn [id]
                               (swap! clear-interval-calls conj id)))
      (-> (p/with-redefs [electron-db/backup-db-via-worker! (fn [repo window-id _]
                                                              (swap! backup-calls conj [repo window-id])
                                                              (p/resolved nil))]
            (p/let [_ (electron-db/sync-auto-backup-repo! 1 "logseq_db_demo")
                    _ (electron-db/sync-auto-backup-repo! 2 "logseq_db_demo")
                    _ ((ffirst @set-interval-calls))
                    _ (electron-db/sync-auto-backup-repo! 1 nil)
                    _ (electron-db/sync-auto-backup-repo! 2 nil)]
              (is (= 1 (count @set-interval-calls)))
              (is (= [timer-id] @clear-interval-calls))
              (is (= [3600000] (mapv second @set-interval-calls)))
              (is (= [["logseq_db_demo" 1]] @backup-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally (fn []
                       (set! js/setInterval original-set-interval)
                       (set! js/clearInterval original-clear-interval)
                       (electron-db/reset-auto-backup!)
                       (done)))))))
