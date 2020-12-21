(ns frontend.db.model-test
  (:require [frontend.db.model :as model]
            [frontend.db.conn :as conn]
            [datascript.core :as d]
            [frontend.db-schema :as schema]
            [frontend.handler.repo :as repo-handler]
            [cljs.test :refer [deftest is are testing]]))

(defonce test-db "test-db")

(defn- run-db!
  []
  (conn/start! nil test-db))

(deftest test-page-alias-set
  []
  (run-db!)
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

#_(cljs.test/test-ns 'frontend.db.model-test)
