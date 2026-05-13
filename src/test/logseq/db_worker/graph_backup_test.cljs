(ns logseq.db-worker.graph-backup-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.db-worker.graph-backup :as graph-backup]
            [promesa.core :as p]))

(defn- read-edn-file
  [file-path]
  (reader/read-string (.toString (fs/readFileSync file-path) "utf8")))

(defn- write-backup!
  ([graphs-dir repo backup-name]
   (write-backup! graphs-dir repo backup-name nil))
  ([graphs-dir repo backup-name metadata]
   (let [db-path (graph-backup/backup-db-path graphs-dir repo backup-name)
         metadata-path (graph-backup/backup-metadata-path graphs-dir repo backup-name)]
     (fs/mkdirSync (node-path/dirname db-path) #js {:recursive true})
     (fs/writeFileSync db-path (str "sqlite-" backup-name) "utf8")
     (when metadata
       (fs/writeFileSync metadata-path (pr-str metadata) "utf8"))
     db-path)))

(deftest backup-paths-use-canonical-graph-backup-layout
  (let [graphs-dir "/tmp/logseq-graphs"
        repo "logseq_db_foo/bar"
        backup-name "daily:name/with space"
        encoded-graph (graph-dir/repo->encoded-graph-dir-name repo)
        encoded-backup (graph-dir/graph-dir-key->encoded-dir-name backup-name)
        backup-root (node-path/join graphs-dir encoded-graph "backup")
        backup-dir (node-path/join backup-root encoded-backup)]
    (is (= backup-root
           (graph-backup/backup-root-path graphs-dir repo)))
    (is (= encoded-backup
           (graph-backup/backup-dir-name backup-name)))
    (is (= backup-dir
           (graph-backup/backup-dir-path graphs-dir repo backup-name)))
    (is (= (node-path/join backup-dir "db.sqlite")
           (graph-backup/backup-db-path graphs-dir repo backup-name)))
    (is (= (node-path/join backup-dir "metadata.edn")
           (graph-backup/backup-metadata-path graphs-dir repo backup-name)))))

(deftest backup-paths-reject-directory-traversal-names
  (is (thrown-with-msg? js/Error
                        #"invalid graph directory path"
                        (graph-backup/backup-root-path "/tmp/logseq-graphs" "logseq_db_..")))
  (is (thrown-with-msg? js/Error
                        #"invalid backup directory path"
                        (graph-backup/backup-dir-path "/tmp/logseq-graphs" "logseq_db_demo" "..")))
  (is (thrown-with-msg? js/Error
                        #"invalid backup directory path"
                        (graph-backup/backup-dir-path "/tmp/logseq-graphs" "logseq_db_demo" "."))))

(deftest build-backup-name-preserves-cli-shape
  (is (= "demo-20260101T000000Z"
         (graph-backup/build-backup-name "logseq_db_demo" nil "20260101T000000Z")))
  (is (= "demo-nightly-20260101T000000Z"
         (graph-backup/build-backup-name "logseq_db_demo" " nightly " "20260101T000000Z"))))

(deftest next-backup-target-appends-numeric-suffix
  (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-next-target")
        repo "logseq_db_demo"
        base-name "demo-nightly"
        existing-dir (graph-backup/backup-dir-path graphs-dir repo base-name)]
    (fs/mkdirSync existing-dir #js {:recursive true})
    (is (= {:backup-name "demo-nightly-1"
            :dir-path (graph-backup/backup-dir-path graphs-dir repo "demo-nightly-1")
            :db-path (graph-backup/backup-db-path graphs-dir repo "demo-nightly-1")}
           (graph-backup/next-backup-target graphs-dir repo base-name)))))

(deftest list-backups-only-returns-directories-with-sqlite-files
  (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-list")
        repo "logseq_db_demo"
        valid-name "demo-nightly"
        incomplete-name "demo-incomplete"
        root-path (graph-backup/backup-root-path graphs-dir repo)
        incomplete-dir (graph-backup/backup-dir-path graphs-dir repo incomplete-name)]
    (write-backup! graphs-dir repo valid-name)
    (fs/mkdirSync incomplete-dir #js {:recursive true})
    (fs/writeFileSync (node-path/join root-path "not-a-directory") "ignored" "utf8")
    (is (= [valid-name]
           (mapv :name (graph-backup/list-backups graphs-dir repo))))))

(deftest list-backups-includes-source-when-metadata-exists
  (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-list-source")
        repo "logseq_db_demo"]
    (write-backup! graphs-dir repo "demo-auto"
                   {:schema-version 1
                    :name "demo-auto"
                    :repo repo
                    :source :electron-auto
                    :created-at-ms 1770000000000
                    :db-path (graph-backup/backup-db-path graphs-dir repo "demo-auto")})
    (write-backup! graphs-dir repo "demo-cli"
                   {:schema-version 1
                    :name "demo-cli"
                    :repo repo
                    :source :cli
                    :created-at-ms 1770000001000
                    :db-path (graph-backup/backup-db-path graphs-dir repo "demo-cli")})
    (write-backup! graphs-dir repo "demo-legacy")
    (is (= [{:name "demo-auto"
             :source :electron-auto}
            {:name "demo-cli"
             :source :cli}
            {:name "demo-legacy"}]
           (mapv #(select-keys % [:name :source])
                 (graph-backup/list-backups graphs-dir repo))))))

(deftest create-backup-snapshots-to-temp-file-before-publishing
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-create")
          repo "logseq_db_demo"
          backup-name "demo-nightly"
          snapshot-calls (atom [])
          final-db-path (graph-backup/backup-db-path graphs-dir repo backup-name)
          final-visible-during-snapshot? (atom nil)]
      (-> (p/let [result (graph-backup/<create-backup!
                           {:graphs-dir graphs-dir
                            :repo repo
                            :backup-name backup-name
                            :source :cli
                            :now-ms 1770000000000
                            :snapshot! (fn [tmp-db-path]
                                         (reset! final-visible-during-snapshot?
                                                 (fs/existsSync final-db-path))
                                         (swap! snapshot-calls conj tmp-db-path)
                                         (fs/writeFileSync tmp-db-path "sqlite-copy" "utf8")
                                         (p/resolved {:path tmp-db-path}))})]
            (is (= {:backup-name backup-name
                    :path final-db-path
                    :created? true}
                   result))
            (is (= 1 (count @snapshot-calls)))
            (is (false? @final-visible-during-snapshot?))
            (is (= (node-path/dirname final-db-path)
                   (node-path/dirname (first @snapshot-calls))))
            (is (not= final-db-path (first @snapshot-calls)))
            (is (= "sqlite-copy" (fs/readFileSync final-db-path "utf8")))
            (let [metadata (read-edn-file (graph-backup/backup-metadata-path graphs-dir repo backup-name))]
              (is (= {:schema-version 1
                      :name backup-name
                      :repo repo
                      :source :cli
                      :created-at-ms 1770000000000
                      :db-path final-db-path}
                     metadata))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest failed-snapshot-removes-reserved-backup-directory
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-failed-create")
          repo "logseq_db_demo"
          backup-name "demo-failure"
          target-dir (graph-backup/backup-dir-path graphs-dir repo backup-name)]
      (-> (graph-backup/<create-backup!
           {:graphs-dir graphs-dir
            :repo repo
            :backup-name backup-name
            :source :cli
            :snapshot! (fn [tmp-db-path]
                         (fs/writeFileSync tmp-db-path "partial" "utf8")
                         (p/rejected (ex-info "snapshot failed"
                                              {:code :snapshot-failed})))})
          (p/then (fn [_]
                    (is false "expected snapshot failure")))
          (p/catch (fn [e]
                     (is (= :snapshot-failed (:code (ex-data e))))
                     (is (not (fs/existsSync target-dir)))
                     (is (= [] (graph-backup/list-backups graphs-dir repo)))))
          (p/finally done)))))

(deftest cli-backups-do-not-use-desktop-automatic-throttling
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-cli-no-throttle")
          repo "logseq_db_demo"
          now-ms 1770000000000
          snapshot-calls (atom [])]
      (write-backup! graphs-dir repo "demo-auto-recent"
                     {:schema-version 1
                      :name "demo-auto-recent"
                      :repo repo
                      :source :electron-auto
                      :created-at-ms (- now-ms 1000)
                      :db-path (graph-backup/backup-db-path graphs-dir repo "demo-auto-recent")})
      (-> (p/let [result (graph-backup/<create-backup!
                           {:graphs-dir graphs-dir
                            :repo repo
                            :backup-name "demo-cli"
                            :source :cli
                            :now-ms now-ms
                            :snapshot! (fn [tmp-db-path]
                                         (swap! snapshot-calls conj tmp-db-path)
                                         (fs/writeFileSync tmp-db-path "cli" "utf8")
                                         (p/resolved nil))})]
            (is (= true (:created? result)))
            (is (= 1 (count @snapshot-calls)))
            (is (= #{"demo-auto-recent" "demo-cli"}
                   (set (map :name (graph-backup/list-backups graphs-dir repo))))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest desktop-automatic-backup-skips-when-recent-auto-backup-exists
  (async done
    (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-auto-throttle")
          repo "logseq_db_demo"
          now-ms 1770000000000
          snapshot-calls (atom [])]
      (write-backup! graphs-dir repo "demo-auto-recent"
                     {:schema-version 1
                      :name "demo-auto-recent"
                      :repo repo
                      :source :electron-auto
                      :created-at-ms (- now-ms 60000)
                      :db-path (graph-backup/backup-db-path graphs-dir repo "demo-auto-recent")})
      (-> (p/let [result (graph-backup/<create-backup!
                           {:graphs-dir graphs-dir
                            :repo repo
                            :backup-name "demo-auto-current"
                            :source :electron-auto
                            :now-ms now-ms
                            :throttle-ms 3600000
                            :snapshot! (fn [tmp-db-path]
                                         (swap! snapshot-calls conj tmp-db-path)
                                         (p/resolved nil))})]
            (is (= {:backup-name nil
                    :path nil
                    :created? false
                    :reason :too-soon}
                   result))
            (is (empty? @snapshot-calls))
            (is (not (fs/existsSync (graph-backup/backup-dir-path graphs-dir repo "demo-auto-current")))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest automatic-retention-only-prunes-explicit-auto-backups
  (let [graphs-dir (node-helper/create-tmp-dir "graph-backup-auto-retention")
        repo "logseq_db_demo"
        metadata (fn [backup-name source created-at-ms]
                   {:schema-version 1
                    :name backup-name
                    :repo repo
                    :source source
                    :created-at-ms created-at-ms
                    :db-path (graph-backup/backup-db-path graphs-dir repo backup-name)})]
    (write-backup! graphs-dir repo "auto-old" (metadata "auto-old" :electron-auto 1000))
    (write-backup! graphs-dir repo "auto-middle" (metadata "auto-middle" :electron-auto 2000))
    (write-backup! graphs-dir repo "auto-new" (metadata "auto-new" :electron-auto 3000))
    (write-backup! graphs-dir repo "manual-old" (metadata "manual-old" :electron-manual 1))
    (write-backup! graphs-dir repo "cli-old" (metadata "cli-old" :cli 1))
    (write-backup! graphs-dir repo "unknown-old")
    (is (= ["auto-old"]
           (mapv :name (graph-backup/prune-backups! {:graphs-dir graphs-dir
                                                     :repo repo
                                                     :source :electron-auto
                                                     :keep-versions 2}))))
    (is (not (fs/existsSync (graph-backup/backup-dir-path graphs-dir repo "auto-old"))))
    (is (= #{"auto-middle" "auto-new" "manual-old" "cli-old" "unknown-old"}
           (set (map :name (graph-backup/list-backups graphs-dir repo)))))))
