(ns logseq.db-worker.server-list-test
  (:require ["fs" :as fs]
            [cljs.test :refer [deftest is]]
            [frontend.test.node-helper :as node-helper]
            [logseq.db-worker.server-list :as server-list]))

(deftest path-derives-server-list-from-root-dir
  (is (= "/tmp/logseq-root/server-list"
         (server-list/path "/tmp/logseq-root"))))

(deftest path-rejects-missing-root-dir
  (is (thrown-with-msg? js/Error
                        #"root-dir is required"
                        (server-list/path nil))))

(deftest server-list-lock-path-derives-sibling-lock-file
  (is (= "/tmp/logseq-root/server-list.lock"
         (server-list/lock-path "/tmp/logseq-root/server-list"))))

(deftest read-entries-ignores-server-list-lock
  (let [root-dir (node-helper/create-tmp-dir "server-list-read-lock-free")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)]
    (fs/writeFileSync file-path "123 456\n" "utf8")
    (fs/writeFileSync lock-file "locked" "utf8")
    (is (= [{:pid 123 :port 456}]
           (server-list/read-entries file-path)))
    (is (fs/existsSync lock-file))
    (is (= "locked"
           (.toString (fs/readFileSync lock-file) "utf8")))))

(deftest append-entry-deduplicates-valid-entry-under-update
  (let [root-dir (node-helper/create-tmp-dir "server-list-append-dedupe")
        file-path (server-list/path root-dir)
        entry {:pid 123 :port 456}]
    (is (= entry (server-list/append-entry! file-path entry)))
    (is (= entry (server-list/append-entry! file-path entry)))
    (is (= "123 456\n"
           (.toString (fs/readFileSync file-path) "utf8")))
    (is (= [entry]
           (server-list/read-entries file-path)))))

(deftest remove-entry-preserves-unrelated-current-entry
  (let [root-dir (node-helper/create-tmp-dir "server-list-remove-preserve")
        file-path (server-list/path root-dir)]
    (server-list/rewrite-entries! file-path [{:pid 111 :port 222}
                                             {:pid 333 :port 444}])
    (server-list/remove-entry! file-path {:pid 111 :port 222})
    (is (= "333 444\n"
           (.toString (fs/readFileSync file-path) "utf8")))
    (is (= [{:pid 333 :port 444}]
           (server-list/read-entries file-path)))))

(deftest append-entry-repairs-stale-server-list-lock
  (let [root-dir (node-helper/create-tmp-dir "server-list-stale-lock")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)]
    (fs/writeFileSync lock-file
                      (js/JSON.stringify (clj->js {:pid 999999
                                                    :lock-id "stale-lock"}))
                      "utf8")
    (server-list/append-entry! file-path {:pid 123 :port 456})
    (is (= [{:pid 123 :port 456}]
           (server-list/read-entries file-path)))
    (is (not (fs/existsSync lock-file)))))

(deftest lock-stale-treats-malformed-and-unreadable-locks-as-stale
  (is (true? (#'server-list/lock-stale? {:parse-error (js/Error. "bad")})))
  (is (true? (#'server-list/lock-stale? {:read-error (js/Error. "EPERM")})))
  (is (true? (#'server-list/lock-stale? {:raw "" :metadata nil})))
  (is (true? (#'server-list/lock-stale? {:metadata {}})))
  (is (true? (#'server-list/lock-stale? {:metadata {:pid "12"}})))
  (is (true? (#'server-list/lock-stale? {:metadata {:pid 0}})))
  (is (true? (#'server-list/lock-stale? {:metadata {:pid 999999}})))
  (is (false? (#'server-list/lock-stale? {:metadata {:pid (.-pid js/process)}}))))

(deftest append-entry-repairs-malformed-server-list-lock
  (doseq [[label contents] [["empty" ""]
                            ["garbage" "not-json"]
                            ["missing-pid" "{\"lock-id\":\"x\"}"]
                            ["non-int-pid" "{\"pid\":\"abc\"}"]]]
    (let [root-dir (node-helper/create-tmp-dir (str "server-list-malformed-" label))
          file-path (server-list/path root-dir)
          lock-file (server-list/lock-path file-path)]
      (fs/writeFileSync lock-file contents "utf8")
      (server-list/append-entry! file-path {:pid 123 :port 456})
      (is (= [{:pid 123 :port 456}]
             (server-list/read-entries file-path))
          label)
      (is (not (fs/existsSync lock-file))
          label))))

(deftest append-entry-repairs-unreadable-server-list-lock
  (let [root-dir (node-helper/create-tmp-dir "server-list-unreadable-lock")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)]
    (fs/writeFileSync lock-file "{\"pid\":1}" "utf8")
    (fs/chmodSync lock-file 8r000)
    (try
      (server-list/append-entry! file-path {:pid 123 :port 456})
      (is (= [{:pid 123 :port 456}]
             (server-list/read-entries file-path)))
      (is (not (fs/existsSync lock-file)))
      (finally
        (when (fs/existsSync lock-file)
          (fs/chmodSync lock-file 8r644))))))

(deftest append-entry-times-out-on-live-server-list-lock
  (let [root-dir (node-helper/create-tmp-dir "server-list-live-lock")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)
        lock-payload (js/JSON.stringify (clj->js {:pid (.-pid js/process)
                                                  :lock-id "live-lock"}))]
    (fs/writeFileSync lock-file lock-payload "utf8")
    (try
      (server-list/append-entry! file-path {:pid 123 :port 456})
      (is false "expected server-list lock timeout")
      (catch :default e
        (is (= :server-list-lock-timeout (:code (ex-data e))))
        (is (= file-path (:file-path (ex-data e))))
        (is (= lock-file (:lock-path (ex-data e))))
        (is (= lock-payload
               (.toString (fs/readFileSync lock-file) "utf8")))))))
