(ns frontend.db.model-test
  (:require [cljs.test :refer [use-fixtures deftest testing is]]
            [frontend.db.model :as model]
            [frontend.test.helper :as test-helper :refer [load-test-files]]
            [logseq.graph-parser.util.block-ref :as block-ref]
            ))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest get-page-namespace-routes
  (load-test-files [{:file/path "pages/a.b.c.md"
                     :file/content "foo"}
                    {:file/path "pages/b.c.md"
                     :file/content "bar"}
                    {:file/path "pages/b.d.md"
                     :file/content "baz"}])

  (is (= '()
         (map :block/name (model/get-page-namespace-routes test-helper/test-db "b/c")))
      "Empty if page exists"))

;; (deftest test-page-alias-with-multiple-alias
;;   []
;;   (p/let [files [{:file/path "a.md"
;;                   :file/content "---\ntitle: a\nalias: b, c\n---"}
;;                  {:file/path "b.md"
;;                   :file/content "---\ntitle: b\nalias: a, d\n---"}
;;                  {:file/path "e.md"
;;                   :file/content "---\ntitle: e\n---\n## ref to [[b]]"}]
;;           _ (-> (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})
;;                 (p/catch (fn [] "ignore indexedDB error")))
;;           a-aliases (model/page-alias-set test-db "a")
;;           b-aliases (model/page-alias-set test-db "b")
;;           alias-names (model/get-page-alias-names test-db "a")
;;           b-ref-blocks (model/get-page-referenced-blocks test-db "b")
;;           a-ref-blocks (model/get-page-referenced-blocks test-db "a")]
;;     (are [x y] (= x y)
;;       4 (count a-aliases)
;;       4 (count b-aliases)
;;       1 (count b-ref-blocks)
;;       1 (count a-ref-blocks)
;;       (set ["b" "c" "d"]) (set alias-names))))

;; (deftest test-page-alias-set
;;   []
;;   (p/let [files [{:file/path "a.md"
;;                   :file/content "---\ntitle: a\nalias: [[b]]\n---"}
;;                  {:file/path "b.md"
;;                   :file/content "---\ntitle: b\nalias: [[c]]\n---"}
;;                  {:file/path "d.md"
;;                   :file/content "---\ntitle: d\n---\n## ref to [[b]]"}]
;;           _ (-> (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})
;;                 (p/catch (fn [] "ignore indexedDB error")))
;;           a-aliases (model/page-alias-set test-db "a")
;;           b-aliases (model/page-alias-set test-db "b")
;;           alias-names (model/get-page-alias-names test-db "a")
;;           b-ref-blocks (model/get-page-referenced-blocks test-db "b")
;;           a-ref-blocks (model/get-page-referenced-blocks test-db "a")]
;;     (are [x y] (= x y)
;;       3 (count a-aliases)
;;       1 (count b-ref-blocks)
;;       1 (count a-ref-blocks)
;;       (set ["b" "c"]) (set alias-names))))

;; (deftest test-page-alias-without-brackets
;;   []
;;   (p/let [files [{:file/path "a.md"
;;                   :file/content "---\ntitle: a\nalias: b\n---"}
;;                  {:file/path "b.md"
;;                   :file/content "---\ntitle: b\nalias: c\n---"}
;;                  {:file/path "d.md"
;;                   :file/content "---\ntitle: d\n---\n## ref to [[b]]"}]
;;           _ (-> (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})
;;                 (p/catch (fn [] "ignore indexedDB error")))
;;           a-aliases (model/page-alias-set test-db "a")
;;           b-aliases (model/page-alias-set test-db "b")
;;           alias-names (model/get-page-alias-names test-db "a")
;;           b-ref-blocks (model/get-page-referenced-blocks test-db "b")
;;           a-ref-blocks (model/get-page-referenced-blocks test-db "a")]
;;     (are [x y] (= x y)
;;       3 (count a-aliases)
;;       1 (count b-ref-blocks)
;;       1 (count a-ref-blocks)
;;       (set ["b" "c"]) (set alias-names))))

(deftest get-pages-that-mentioned-page-with-show-journal
  (load-test-files [{:file/path "journals/2020_08_15.md"
                     :file/content "link 1 to [[page ONE]] and link to [[generic page]]"}
                    {:file/path "journals/2020_09_18.md"
                     :file/content "link 2 to [[page ONE]]"}
                    {:file/path "pages/page ONE.md"
                     :file/content "tags:: a tag
- page one has link to [[Dec 26th, 2020]] journal page"}
                    {:file/path "pages/a tag.md"
                     :file/content "i'm a tag"}
                    {:file/path "pages/generic page.md"
                     :file/content "- link to page one [[page ONE]]"}])

  (is (= '("sep 18th, 2020" "aug 15th, 2020" "generic page")
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "page ONE" true)))
      "Must be 'generic page' + 2 journals")

  (is (= '("generic page")
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "page ONE" false)))
      "Must be only 'generic page'")

  (is (= '("aug 15th, 2020")
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "generic page" true)))
      "Must show only 'aug 15th, 2020'")

  (is (= '()
         (map first (model/get-pages-that-mentioned-page test-helper/test-db "generic page" false)))
      "Must be empty"))

(deftest remove-links-for-each-level-of-the-namespaces
  (load-test-files [{:file/path "pages/generic page.md"
                     :file/content "tags:: [[one/two/tree]], one/two
- link to ns [[one]]
- link to page one [[page ONE]]"}])

  (is (= '("one/two/tree" "page one")
         (map second (model/get-pages-relation test-helper/test-db true)))
      "(get-pages-relation) Must be only ns one/two/tree")

  (is (= '("one/two/tree" "page one")
         (map second (#'model/remove-nested-namespaces-link [["generic page" "one/two/tree"]
                                                           ["generic page" "one/two"]
                                                           ["generic page" "one"]
                                                           ["generic page" "page one"]])))
      "(model/remove-nested-namespaces-link) Must be only ns one/two/tree")

  (is (= '("one/two/tree" "one/two" "one")
         (#'model/get-parents-namespace-list "one/two/tree/four"))
      "Must be one/two/tree one/two one")

  (is (= '("one/two" "one")
         (#'model/get-unnecessary-namespaces-name '("one/two/tree" "one" "one/two" "non nested tag" "non nested link")))
      "Must be  one/two one"))

(deftest refs-to-page-maintained-on-reload
  (testing 
    "Refs to blocks on a page are retained if that page is reload."
    (let [ test-uuid "16c90195-6a03-4b3f-839d-095a496d9acd"
          target-page-content (str "- target block\n  id:: " (block-ref/->block-ref test-uuid))
          referring-page-content (str "- " (block-ref/->block-ref test-uuid))]
      (load-test-files [{:file/path "pages/target.md"
                         :file/content target-page-content}
                        {:file/path "pages/referrer.md"
                         :file/content referring-page-content}])
      (is (= (model/get-all-referenced-blocks-uuid) [(parse-uuid test-uuid)]))
      (load-test-files [{:file/path "pages/target.md"
                         :file/content target-page-content}])
      (is (= (model/get-all-referenced-blocks-uuid) [(parse-uuid test-uuid)]))
      )))

(deftest reload-file-with-page-rename
  (testing 
    "Reload a file when the disk contents result in the file having a new page name."
    (let [ test-uuid "16c90195-6a03-4b3f-839d-095a496d9efc"
          target-page-content (str "- target block\n  id:: " (block-ref/->block-ref test-uuid))
          referring-page-content (str "- " (block-ref/->block-ref test-uuid))
          update-referring-page-content (str "title:: updatedPage\n- " (block-ref/->block-ref test-uuid))
          get-page-block-count (fn [page-name] (let [page-id (:db/id (model/get-page page-name))]
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
      (is (= (model/get-all-referenced-blocks-uuid) [(parse-uuid test-uuid)]))
      (is (= 0 (get-page-block-count "referrer")))
      (is (= 2 (get-page-block-count "updatedPage")))
      )))

#_(cljs.test/test-ns 'frontend.db.model-test)
