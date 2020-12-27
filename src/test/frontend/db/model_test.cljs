(ns frontend.db.model-test
  (:require [frontend.db.model :as model]
            [frontend.db.config :refer [test-db] :as config]
            [datascript.core :as d]
            [frontend.db-schema :as schema]
            [frontend.handler.repo :as repo-handler]
            [cljs.test :refer [deftest is are testing use-fixtures]]))

(deftest test-page-alias-with-multiple-alias
  []
  (let [files [{:file/path "a.md"
                :file/content "---\ntitle: a\nalias: b, c\n---"}
               {:file/path "b.md"
                :file/content "---\ntitle: b\nalias: a, d\n---"}
               {:file/path "e.md"
                :file/content "---\ntitle: e\n---\n## ref to [[b]]"}]
        _ (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})
        a-aliases (model/page-alias-set test-db "a")
        b-aliases (model/page-alias-set test-db "b")
        alias-names (model/get-page-alias-names test-db "a")
        b-ref-blocks (model/get-page-referenced-blocks test-db "b")
        a-ref-blocks (model/get-page-referenced-blocks test-db "a")]
    (are [x y] (= x y)
      4 (count a-aliases)
      4 (count b-aliases)
      1 (count b-ref-blocks)
      1 (count a-ref-blocks)
      ["b" "c" "d"] alias-names)))

(deftest test-page-alias-set
  []
  (let [files [{:file/path "a.md"
                :file/content "---\ntitle: a\nalias: [[b]]\n---"}
               {:file/path "b.md"
                :file/content "---\ntitle: b\nalias: [[c]]\n---"}
               {:file/path "d.md"
                :file/content "---\ntitle: d\n---\n## ref to [[b]]"}]
        _ (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})
        a-aliases (model/page-alias-set test-db "a")
        b-aliases (model/page-alias-set test-db "b")
        alias-names (model/get-page-alias-names test-db "a")
        b-ref-blocks (model/get-page-referenced-blocks test-db "b")
        a-ref-blocks (model/get-page-referenced-blocks test-db "a")]
    (are [x y] (= x y)
      3 (count a-aliases)
      1 (count b-ref-blocks)
      1 (count a-ref-blocks)
      ["b" "c"] alias-names)))

(deftest test-page-alias-without-brackets
  []
  (let [files [{:file/path "a.md"
                :file/content "---\ntitle: a\nalias: b\n---"}
               {:file/path "b.md"
                :file/content "---\ntitle: b\nalias: c\n---"}
               {:file/path "d.md"
                :file/content "---\ntitle: d\n---\n## ref to [[b]]"}]
        _ (repo-handler/parse-files-and-load-to-db! test-db files {:re-render? false})
        a-aliases (model/page-alias-set test-db "a")
        b-aliases (model/page-alias-set test-db "b")
        alias-names (model/get-page-alias-names test-db "a")
        b-ref-blocks (model/get-page-referenced-blocks test-db "b")
        a-ref-blocks (model/get-page-referenced-blocks test-db "a")]
    (are [x y] (= x y)
      3 (count a-aliases)
      1 (count b-ref-blocks)
      1 (count a-ref-blocks)
      ["b" "c"] alias-names)))

(use-fixtures :each
  {:before config/start-test-db!
   :after config/destroy-test-db!})

#_(cljs.test/test-ns 'frontend.db.model-test)
