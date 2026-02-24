(ns frontend.db.model-test
  (:require [cljs.test :refer [use-fixtures deftest is]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.model :as model]
            [frontend.test.helper :as test-helper :refer [load-test-files]]))

(use-fixtures :each {:before test-helper/start-test-db!
                     :after test-helper/destroy-test-db!})

(def test-db test-helper/test-db)

(deftest test-page-alias-set
  (let [ab-uuid (random-uuid)]
    (load-test-files
     [{:page {:block/title "ab"
              :build/keep-uuid? true
              :block/uuid ab-uuid
              :build/properties {:block/alias #{[:build/page {:block/title "ac"}]}}}}
      {:page {:block/title "aa"
              :build/properties {:block/alias #{[:block/uuid ab-uuid]}}}}
      {:page {:block/title "ae"}
       :blocks [{:block/title (str "## ref to [[" ab-uuid "]]")}]}]))

  (let [page-id (:db/id (test-helper/find-page-by-title "aa"))
        a-aliases (model/page-alias-set test-db page-id)]
    (is (= 3 (count a-aliases)))))

(defn- page-mention-check?
  [page-name include-journals?]
  (->> (model/get-pages-that-mentioned-page test-db (:db/id (test-helper/find-page-by-title page-name)) include-journals?)
       (map (fn [id] (:block/name (db/entity id))))))

(deftest get-pages-that-mentioned-page-with-show-journal
  (let [page-one-uuid (random-uuid)
        generic-page-uuid (random-uuid)
        journal-2020-12-26-uuid (random-uuid)]
    (load-test-files
     [;; -------- Pages --------
      {:page {:block/title "page one"
              :build/keep-uuid? true
              :block/uuid page-one-uuid}
       :blocks
       [{:block/title (str "- page one has link to [["
                           journal-2020-12-26-uuid
                           "]] journal page")}]}
      {:page {:block/title "generic page"
              :build/keep-uuid? true
              :block/uuid generic-page-uuid}
       :blocks
       [{:block/title (str "- link to page one [[" page-one-uuid "]]")}]}
      ;; -------- Journals --------
      {:page {:build/journal 20201226
              :build/keep-uuid? true
              :block/uuid journal-2020-12-26-uuid}}
      {:page {:build/journal 20200815}
       :blocks
       [{:block/title (str "link 1 to [[" page-one-uuid "]] and link to [[" generic-page-uuid "]]")}]}
      {:page {:build/journal 20200918}
       :blocks
       [{:block/title (str "link 2 to [[" page-one-uuid "]]")}]}]))

  (is (= #{"sep 18th, 2020" "aug 15th, 2020" "generic page"}
         (set (page-mention-check? "page one" true)))
      "Must be 'generic page' + 2 journals")

  (is (= '("generic page")
         (page-mention-check? "page one" false))
      "Must be only 'generic page'")

  (is (= '("aug 15th, 2020")
         (page-mention-check? "generic page" true))
      "Must show only 'aug 15th, 2020'")

  (is (= '()
         (page-mention-check? "generic page" false))
      "Must be empty"))

(deftest entity-query-should-return-nil-if-id-not-exists
  (is (nil? (db/entity 1000000))))

(deftest entity-query-should-support-both-graph-string-and-db
  (db/transact! test-db [{:db/id 1 :value "test"}])
  (is (= 1 (:db/id (db/entity test-db 1))))
  (is (= 1 (:db/id (db/entity (conn/get-db test-db) 1)))))

(deftest get-block-by-page-name-and-block-route-name
  (load-test-files
   [{:page {:block/title "foo"}
     :blocks [{:block/title "b2"}
              {:block/title "Header 2"
               :build/properties {:logseq.property/heading 3}}]}])
  (is (uuid?
       (:block/uuid
        (let [page (db/get-page "foo")]
          (model/get-block-by-page-name-and-block-route-name test-db (str (:block/uuid page)) "header 2"))))
      "Header block's content returns map with :block/uuid")

  (is (nil?
       (let [page (db/get-page "foo")]
         (model/get-block-by-page-name-and-block-route-name test-db (str (:block/uuid page)) "b2")))
      "Non header block's content returns nil"))

(deftest get-block-immediate-children
  (load-test-files
   [{:page {:block/title "page1"}
     :blocks [{:block/title "parent"
               :build/children [{:block/title "child 1"
                                 :build/children [{:block/title "grandchild 1"}]}
                                {:block/title "child 2"
                                 :build/children [{:block/title "grandchild 2"}]}
                                {:block/title "child 3"}]}]}])
  (let [parent (-> (d/q '[:find (pull ?b [*]) :where [?b :block/title "parent"]]
                        (conn/get-db test-db))
                   ffirst)]
    (is (= ["child 1" "child 2" "child 3"]
           (map :block/title
                (model/get-block-immediate-children test-db (:block/uuid parent)))))))

(deftest with-pages-preserves-page-ref-when-ui-db-is-partial
  (let [page-ref {:db/id 1}
        block {:db/id 2
               :block/uuid (random-uuid)
               :block/page page-ref}]
    (with-redefs [frontend.db.utils/pull-many (fn [& _] nil)]
      (is (= page-ref
             (:block/page (first (model/with-pages [block]))))
          "When page entity details are unavailable locally, keep the original page ref instead of replacing it with nil"))))
