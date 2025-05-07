(ns frontend.db.file-based.model-test
  (:require [cljs.test :refer [use-fixtures deftest is]]
            [frontend.db.file-based.model :as file-model]
            [frontend.test.helper :as test-helper :refer [load-test-files]]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(deftest get-namespace-pages
  (load-test-files [{:file/path "pages/a.b.c.md"
                     :file/content "foo"}
                    {:file/path "pages/b.c.md"
                     :file/content "bar"}
                    {:file/path "pages/b.d.md"
                     :file/content "baz"}])

  (is (= ["a/b" "a/b/c"]
         (map :block/name (file-model/get-namespace-pages test-helper/test-db "a"))))

  (is (= ["b/c" "b/d"]
         (map :block/name (file-model/get-namespace-pages test-helper/test-db "b")))))

(deftest get-page-namespace-routes
  (load-test-files [{:file/path "pages/a.b.c.md"
                     :file/content "foo"}
                    {:file/path "pages/b.c.md"
                     :file/content "bar"}
                    {:file/path "pages/b.d.md"
                     :file/content "baz"}])

  (is (= '()
         (map :block/name (file-model/get-page-namespace-routes test-helper/test-db "b/c")))
      "Empty if page exists"))