(ns electron.db-test
  (:require ["node:sqlite" :as node-sqlite]
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

(deftest backup-db-creates-sqlite-copy-from-existing-disk-db
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-backup")
          db-name "logseq_db_foo/bar"
          DatabaseSync (resolve-database-sync-ctor)
          original-get-db-graphs-dir cli-common-graph/get-db-graphs-dir]
      (set! cli-common-graph/get-db-graphs-dir (fn [] graphs-dir))
      (let [[_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)
            backups-path (common-sqlite/get-db-backups-path graphs-dir db-name)]
        (fs/ensureDirSync (node-path/dirname db-path))
        (let [source-db (new DatabaseSync db-path)]
          (.exec source-db "create table kvs (addr text primary key, content text);")
          (.exec source-db "insert into kvs (addr, content) values ('a', 'alpha')")
          (.close source-db))
        (-> (p/with-redefs [backup-file/backup-file (fn [_repo _dir _relative-path _ext content & {:keys [backups-dir]}]
                                                      (fs/ensureDirSync backups-dir)
                                                      (fs/writeFileSync (node-path/join backups-dir "copy.sqlite") content))]
              (p/let [_ (electron-db/backup-db! db-name nil)
                    backup-files (vec (fs/readdirSync backups-path))
                    backup-path (node-path/join backups-path (first backup-files))
                    backup-db (new DatabaseSync backup-path)
                    stmt (.prepare ^js backup-db "select addr, content from kvs order by addr")
                    rows (.all stmt)
                    _ (.close backup-db)]
                (is (= 1 (count backup-files)))
                (is (= "a" (gobj/get (first rows) "addr")))
                (is (= "alpha" (gobj/get (first rows) "content")))))
            (p/catch (fn [e]
                       (is false (str "unexpected error: " e))))
            (p/finally (fn []
                         (set! cli-common-graph/get-db-graphs-dir original-get-db-graphs-dir)
                         (done))))))))

(deftest backup-db-uses-backup-file-rules
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-backup-rules")
          db-name "logseq_db_demo"
          [_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)
          backups-path (common-sqlite/get-db-backups-path graphs-dir db-name)
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
              (is (= 1 (count @backup-calls)))
              (let [{:keys [repo dir relative-path ext content opts]} (first @backup-calls)]
                (is (= db-name repo))
                (is (= nil dir))
                (is (= nil relative-path))
                (is (= ".sqlite" ext))
                (is (= "copied" content))
                (is (= backups-path (:backups-dir opts)))
                (is (= 12 (:keep-versions opts)))
                (is (contains? opts :force-backup?))
                (is (nil? (:force-backup? opts))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest backup-db-with-sqlite-backup-uses-provided-snapshot-fn
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "electron-db-backup-custom-snapshot")
          db-name "logseq_db_demo"
          [_ db-path] (common-sqlite/get-db-full-path graphs-dir db-name)
          backups-path (common-sqlite/get-db-backups-path graphs-dir db-name)
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
              (is (= 1 (count @backup-calls)))
              (let [{:keys [repo ext content opts]} (first @backup-calls)]
                (is (= db-name repo))
                (is (= ".sqlite" ext))
                (is (= "worker-copy" content))
                (is (= backups-path (:backups-dir opts)))
                (is (= true (:force-backup? opts))))))
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
