(ns frontend.handler.repo-test
  (:require [cljs.test :refer [deftest use-fixtures testing is]]
            [frontend.handler.repo :as repo-handler]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [logseq.graph-parser.cli :as gp-cli]
            [logseq.graph-parser.test.docs-graph-helper :as docs-graph-helper]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [frontend.db.model :as model]
            [frontend.db.conn :as conn]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

;; TODO update docs filename rules to the latest version when the namespace PR is released
(deftest ^:integration parse-and-load-files-to-db
  (let [graph-dir "src/test/docs"
        ;; TODO update me to the latest version of doc when namespace is updated
        _ (docs-graph-helper/clone-docs-repo-if-not-exists graph-dir "v0.6.7")
        files (gp-cli/build-graph-files graph-dir)
        _ (repo-handler/parse-files-and-load-to-db! test-helper/test-db files {:re-render? false :verbose false})
        db (conn/get-db test-helper/test-db)]

    (docs-graph-helper/docs-graph-assertions db (map :file/path files))))

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
