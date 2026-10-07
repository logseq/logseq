(ns frontend.components.file-test
  (:require ["fs" :as fs-node]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [frontend.components.file-content :as file-content]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.test.node-fixtures :as node-fixtures]
            [frontend.test.node-helper :as test-node-helper]
            [promesa.core :as p]))

(deftest read-file-content-uses-worker-for-relative-db-files-test
  (async done
    (let [repo "logseq_db_file_component"
          repo-dir "/graphs/file-component"
          worker-calls (atom [])
          fs-calls (atom [])]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [qkw repo' path]
                            (swap! worker-calls conj [qkw repo' path])
                            (p/resolved "worker content"))
                          fs/read-file
                          (fn [dir path]
                            (swap! fs-calls conj [dir path])
                            (p/resolved "fs content"))]
            (p/let [relative-content (file-content/<read-file-content repo repo-dir "logseq/config.edn")
                    absolute-content (file-content/<read-file-content repo repo-dir "/tmp/outside.md")]
              (is (= "worker content" relative-content))
              (is (= "fs content" absolute-content))
              (is (= [[:thread-api/get-file-content repo "logseq/config.edn"]]
                     @worker-calls))
              (is (= [[nil "/tmp/outside.md"]]
                     @fs-calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest read-file-content-uses-fs-for-windows-absolute-paths-test
  (async done
    (let [repo "logseq_db_file_windows"
          repo-dir "C:/graphs/win-graph"
          win-path "C:/graphs/win-graph/logseq/export.css"
          worker-calls (atom [])
          fs-calls (atom [])]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [qkw repo' path]
                            (swap! worker-calls conj [qkw repo' path])
                            (p/resolved "worker content"))
                          fs/read-file
                          (fn [dir path]
                            (swap! fs-calls conj [dir path])
                            (p/resolved "fs content"))]
            (p/let [content (file-content/<read-file-content repo repo-dir win-path)]
              (is (= "fs content" content))
              (is (empty? @worker-calls)
                  "Windows absolute export.css is not read from the DB")
              (is (= [[nil win-path]] @fs-calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest read-file-content-creates-missing-absolute-export-css-test
  (async done
    (node-fixtures/setup-get-fs!)
    (let [repo "logseq_db_export_css_read"
          repo-dir (node-path/resolve (test-node-helper/create-tmp-dir))
          export-css-path (node-path/join repo-dir "logseq" "export.css")
          worker-calls (atom [])]
      (is (not (fs-node/existsSync export-css-path))
          "precondition: export.css is missing")
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [& args]
                            (swap! worker-calls conj args)
                            (p/resolved "should-not-read-from-db"))]
            (file-content/<read-file-content repo repo-dir export-css-path))
          (p/then
           (fn [content]
             (is (= "" content)
                 "first open of missing export.css is empty")
             (is (fs-node/existsSync (node-path/join repo-dir "logseq"))
                 "first open creates missing logseq/ parent dir")
             (is (fs-node/existsSync export-css-path)
                 "first open creates missing export.css")
             (is (empty? @worker-calls)
                 "absolute export.css is not read from the DB")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (node-fixtures/restore-get-fs!)
             (when (fs-node/existsSync repo-dir)
               (fs-node/rmSync repo-dir #js {:recursive true :force true}))
             (done)))))))
