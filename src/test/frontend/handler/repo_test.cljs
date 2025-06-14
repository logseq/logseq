(ns frontend.handler.repo-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest use-fixtures testing is]]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.db.model :as model]
            [frontend.handler.file-based.repo :as file-repo-handler]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [frontend.worker.state :as worker-state]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]))

(use-fixtures :each test-helper/start-and-destroy-db)

(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs-0.10.12"
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.10.12")
        repo-config (edn/read-string (str (fs/readFileSync (node-path/join graph-dir "logseq/config.edn"))))
        files (#'gp-cli/build-graph-files graph-dir repo-config)
        _ (with-redefs [worker-state/get-config (constantly repo-config)]
            (file-repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false :verbose false}))
        db (conn/get-db test-helper/test-db)]

    (docs-graph-helper/docs-graph-assertions db graph-dir (map :file/path files))
    (testing "Additional Counts"
      (is (= 77370 (count (d/datoms db :eavt))) "Correct datoms count")

      (is (= 7095
             (ffirst
              (d/q '[:find (count ?b)
                     :where [?b :block/path-refs ?bp] [?bp :block/name]] db)))
          "Correct referenced blocks count"))))

(deftest parse-files-and-load-to-db-with-block-refs-on-reload
  (testing "Refs to blocks on a page are retained if that page is reloaded"
    (let [test-uuid "16c90195-6a03-4b3f-839d-095a496d9acd"
          target-page-content (str "- target block\n  id:: " test-uuid)
          referring-page-content (str "- " (block-ref/->block-ref test-uuid))]
      (load-test-files [{:file/path "pages/target.md"
                         :file/content target-page-content}
                        {:file/path "pages/referrer.md"
                         :file/content referring-page-content}])
      (is (= [(parse-uuid test-uuid)] (model/get-all-referenced-blocks-uuid)))

      (load-test-files [{:file/path "pages/target.md"
                         :file/content target-page-content}])
      (is (= [(parse-uuid test-uuid)] (model/get-all-referenced-blocks-uuid))))))

(deftest parse-files-and-load-to-db-with-page-rename
  (testing
   "Reload a file when the disk contents result in the file having a new page name"
    (let [test-uuid "16c90195-6a03-4b3f-839d-095a496d9efc"
          target-page-content (str "- target block\n  id:: " test-uuid)
          referring-page-content (str "- " (block-ref/->block-ref test-uuid))
          update-referring-page-content (str "title:: updatedPage\n- " (block-ref/->block-ref test-uuid))
          get-page-block-count (fn [page-name]
                                 (let [page-id (:db/id (model/get-page page-name))]
                                   (if (some? page-id)
                                     (model/get-page-blocks-count test-helper/test-db page-id)
                                     0)))]
      (load-test-files [{:file/path "pages/target.md"
                         :file/content target-page-content}
                        {:file/path "pages/referrer.md"
                         :file/content referring-page-content}])
      (is (= [(parse-uuid test-uuid)] (model/get-all-referenced-blocks-uuid)))
      (is (= 1 (get-page-block-count "referrer")))
      (is (= 0 (get-page-block-count "updatedPage")))

      (load-test-files [{:file/path "pages/referrer.md"
                         :file/content update-referring-page-content}])
      (is (= [(parse-uuid test-uuid)] (model/get-all-referenced-blocks-uuid)))
      (is (= 0 (get-page-block-count "referrer")))
      (is (= 2 (get-page-block-count "updatedPage"))))))
