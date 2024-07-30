(ns frontend.worker.handler.page.file-based.rename-test
  (:require [clojure.test :refer [deftest is testing use-fixtures are]]
            [frontend.test.helper :as test-helper]
            [datascript.core :as d]
            [frontend.db :as db]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.worker.handler.page.file-based.rename :as file-page-rename]
            [frontend.handler.editor :as editor-handler]))

;; FIXME: merge properties from both pages

(def repo test-helper/test-db-name)

(def init-data (test-helper/initial-test-page-and-blocks))

(def fbid (:block/uuid (second init-data)))

(defn start-and-destroy-db
  [f]
  (test-helper/start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(use-fixtures :each start-and-destroy-db)

(defn- page-rename [page-uuid new-name]
  (file-page-rename/rename! repo (db/get-db repo false) {} page-uuid new-name))

(deftest rename-test
  (testing "Case change"
    (let [page (db/get-page "test")]
      (page-rename (:block/uuid page) "Test")
      (is (= "Test" (:block/title (db/entity (:db/id page)))))))

  (testing "Name changed"
    (let [page (db/get-page "Test")]
      (page-rename (:block/uuid page) "New name")
      (is (= "New name" (:block/title (db/entity (:db/id page)))))))

  (testing "Merge existing page"
    (test-helper/create-page! "Existing page" {:redirect? false :create-first-block? true})
    (let [page (db/get-page "new name")]
      (page-rename (:block/uuid page) "Existing page"))
    (let [e1 (db/get-page "new name")
          e2 (db/get-page "existing page")]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data))))))))

(deftest merge-with-empty-page
  (test-helper/create-page! "Existing page" {:redirect? false :create-first-block? false})
  (let [page (db/get-page "test")]
    (page-rename (:block/uuid page) "Existing page"))
  (let [e1 (db/get-page "test")
        e2 (db/get-page "existing page")]
      ;; Old page deleted
    (is (nil? e1))
      ;; Blocks from both pages have been merged
    (is (= (count (:block/_page e2)) (dec (count init-data))))))

(deftest merge-existing-pages-should-update-ref-ids
  (testing "Merge existing page"
    (editor-handler/save-block! repo fbid "Block 1 [[Test]]")
    (test-helper/create-page! "Existing page" {:redirect? false :create-first-block? true})
    (let [page (db/get-page "test")]
      (page-rename (:block/uuid page) "Existing page"))
    (let [e1 (db/get-page "test")
          e2 (db/get-page "existing page")]
      ;; Old page deleted
      (is (nil? e1))
      ;; Blocks from both pages have been merged
      (is (= (count (:block/_page e2)) (+ 1 (dec (count init-data)))))
      ;; Content updated
      (is (= "Block 1 [[Existing page]]" (:block/title (db/entity [:block/uuid fbid])))))))

(defn- replace-page-ref!
  [content old-name new-name]
  (let [[original-old-name original-new-name] (map string/trim [old-name new-name])
        [old-ref new-ref] (map #(util/format "[[%s]]" %) [old-name new-name])
        [old-name new-name] (map #(if (string/includes? % "/")
                                    (string/replace % "/" ".")
                                    %)
                                 [original-old-name original-new-name])
        old-org-ref (re-find
                     (re-pattern
                      (util/format
                       "\\[\\[file:\\.*/.*%s\\.org\\]\\[(.*?)\\]\\]" old-name))
                     content)]
    (-> (if old-org-ref
          (let [[old-full-ref old-label] old-org-ref
                new-label (if (= old-label original-old-name)
                            original-new-name
                            old-label)
                new-full-ref (-> (string/replace old-full-ref old-name new-name)
                                 (string/replace (str "[" old-label "]")
                                                 (str "[" new-label "]")))]
            (string/replace content old-full-ref new-full-ref))
          content)
        (string/replace old-ref new-ref))))

(defn- replace-old-page!
  [content old-name new-name]
  (when (and (string? content) (string? old-name) (string? new-name))
    (-> content
        (replace-page-ref! old-name new-name)
        (file-page-rename/replace-tag-ref! old-name new-name))))

(deftest test-replace-page-ref!
  (are [x y] (= (let [[content old-name new-name] x]
                  (replace-page-ref! content old-name new-name))
                y)
    ["bla [[foo]] bla" "foo" "bar"] "bla [[bar]] bla"

    ["bla [[logseq/foo]] bla" "logseq/foo" "logseq/bar"] "bla [[logseq/bar]] bla"

    ["bla [[file:./foo.org][foo]] bla" "foo" "bar"]
    "bla [[file:./bar.org][bar]] bla"

    ["bla [[file:./logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:./logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:../pages/logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:../pages/logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:./pages/logseq.foo.org][logseq/foo]] bla" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][logseq/bar]] bla"

    ["bla [[file:./pages/logseq.foo.org][logseq/foo]] bla [[logseq/foo]]" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][logseq/bar]] bla [[logseq/bar]]"

    ["bla [[file:./pages/logseq.foo.org][don't change this label]] bla [[logseq/foo]]" "logseq/foo" "logseq/bar"]
    "bla [[file:./pages/logseq.bar.org][don't change this label]] bla [[logseq/bar]]"))

(deftest test-replace-tag-ref!
  (are [x y] (= (let [[content old-name new-name] x]
                  (file-page-rename/replace-tag-ref! content old-name new-name))
                y)
    ["#foo" "foo" "bar"] "#bar"
    ["#foo" "foo" "new bar"] "#[[new bar]]"

    ["bla #foo bla" "foo" "bar"] "bla #bar bla"
    ["bla #foo bla" "foo" "new bar"] "bla #[[new bar]] bla"

    ["bla #foo" "foo" "bar"] "bla #bar"
    ["bla #foo" "foo" "new bar"] "bla #[[new bar]]"

    ["#foo #foobar" "foo" "bar"]
    "#bar #foobar"

    ["#foo #foobar bar#foo #foo" "foo" "bar"]
    "#bar #foobar bar#foo #bar"

    ["#foo #foobar bar#foo #foo,," "foo" "bar"]
    "#bar #foobar bar#foo #bar,,"

    ["#foo #foobar bar#foo #foo #foo ball" "foo" "bar"]
    "#bar #foobar bar#foo #bar #bar ball"

    ["#foo #foobar bar#foo #foo\t#foo ball" "foo" "bar"]
    "#bar #foobar bar#foo #bar\t#bar ball"

    ["#foo #foobar bar#foo #foo" "foo" "new bar"]
    "#[[new bar]] #foobar bar#foo #[[new bar]]"

    ["#logseq/foo #logseq/foobar bar#logseq/foo #logseq/foo" "logseq/foo" "logseq/bar"]
    "#logseq/bar #logseq/foobar bar#logseq/foo #logseq/bar"

    ;; #6451
    ["#中文" "中文" "中文2"] "#中文2"
    ["#2中文" "2中文" "中文234"] "#中文234"
    ["#2中文2" "2中文2" "中文1999"] "#中文1999"
    ["#2中文,SLKDF" "2中文" "中文1999"] "#2中文,SLKDF"
    ["#2中文, SLKDF" "2中文" "中文1999"] "#中文1999, SLKDF"
    ["#2中文看来减肥了" "2中文" "中文1999"] "#2中文看来减肥了"
    ["两份健康 #2中文 看来减肥了" "2中文" "中文1999"] "两份健康 #中文1999 看来减肥了"
    ["sdaflk  #2中文   看asdf了" "2中文" "中文1999"] "sdaflk  #中文1999   看asdf了"
    ["sdaflk  #2中文" "2中文" "中文1999"] "sdaflk  #中文1999"))

(deftest test-replace-old-page!
  (are [x y] (= (let [[content old-name new-name] x]
                  (replace-old-page! content old-name new-name))
                y)
       ["#foo bla [[foo]] bla #foo" "foo" "bar"]
       "#bar bla [[bar]] bla #bar"

       ["#logseq/foo bla [[logseq/foo]] bla [[file:./pages/logseq.foo.org][logseq/foo]] bla #logseq/foo" "logseq/foo" "logseq/bar"]
       "#logseq/bar bla [[logseq/bar]] bla [[file:./pages/logseq.bar.org][logseq/bar]] bla #logseq/bar"))
