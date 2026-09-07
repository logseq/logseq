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

(deftest lock-stale-requires-an-observed-ownerless-lock
  (is (true? (#'server-list/lock-stale? {:parse-error (js/Error. "bad")})))
  (is (false? (#'server-list/lock-stale? nil)))
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

(deftest append-entry-preserves-unreadable-server-list-lock
  (let [root-dir (node-helper/create-tmp-dir "server-list-unreadable-lock")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)
        read-file fs/readFileSync
        read-error (doto (js/Error. "Permission denied") (aset "code" "EACCES"))]
    (fs/writeFileSync lock-file "{}" "utf8")
    (with-redefs [fs/readFileSync (fn [file & args]
                                  (if (= file lock-file)
                                    (throw read-error)
                                    (apply read-file file args)))]
      (is (identical? read-error
                      (try
                        (server-list/append-entry! file-path {:pid 123 :port 456})
                        (catch :default e e)))))
    (is (fs/existsSync lock-file))
    (is (not (fs/existsSync file-path)))))

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

(deftest acquisition-publishes-complete-metadata
  (let [root-dir (node-helper/create-tmp-dir "server-list-atomic-lock")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)
        write-metadata @#'server-list/write-lock-metadata!]
    (with-redefs [server-list/write-lock-metadata!
                  (fn [fd metadata]
                    (is (not (fs/existsSync lock-file))
                        "An acquiring writer must not publish an empty lock")
                    (write-metadata fd metadata))]
      (server-list/append-entry! file-path {:pid 123 :port 456}))
    (is (= [{:pid 123 :port 456}] (server-list/read-entries file-path)))))

(deftest missing-lock-read-preserves-a-new-holder
  (let [root-dir (node-helper/create-tmp-dir "server-list-replaced-lock")
        file-path (server-list/path root-dir)
        lock-file (server-list/lock-path file-path)
        owner (js/JSON.stringify #js {:pid (.-pid js/process) :lock-id "replacement"})
        read-metadata @#'server-list/read-lock-metadata
        first-read? (atom true)]
    (fs/writeFileSync lock-file "{}")
    (with-redefs [server-list/write-lock-timeout-ms 50
                  server-list/read-lock-metadata
                  (fn [file]
                    (if (compare-and-set! first-read? true false)
                      (do (fs/writeFileSync file owner) nil)
                      (read-metadata file)))]
      (is (= :server-list-lock-timeout
             (try
               (server-list/append-entry! file-path {:pid 123 :port 456})
               (catch :default e (:code (ex-data e)))))))
    (is (= owner (.toString (fs/readFileSync lock-file))))))
