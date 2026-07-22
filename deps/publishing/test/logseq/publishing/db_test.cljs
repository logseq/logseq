(ns logseq.publishing.db-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.melange.bridge.common.api :as melange-common]
            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.db.validation :as db-validate]
            [logseq.melange.bridge.db.test-helper :as db-test]
            [logseq.publishing.db :as publish-db]))

(deftest clean-export!
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"
                       :build/properties {:logseq.property/publishing-public? false}}
                :blocks [{:block/title "b11"}
                         {:block/title "b12"}
                         {:block/title "![awesome.png](../assets/awesome_1648822509908_0.png"}]}
               {:page {:block/title "page2"}
                :blocks [{:block/title "b21"}
                         {:block/title "![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)"}]}
               {:page {:block/title "page3"}
                :blocks [{:block/title "b31"}]}])
        [filtered-db _assets] (publish-db/clean-export! @conn)
        exported-pages (->> (d/q '[:find (pull ?b [*])
                                   :where [?b :block/name]]
                                 filtered-db)
                            (map (comp :block/name first))
                            set)
        exported-blocks (->> (d/q '[:find (pull ?p [*])
                                    :where
                                    [?b :block/title]
                                    [?b :block/page ?p]
                                    [(missing? $ ?p :logseq.property/built-in?)]]
                                  filtered-db)
                             (map (comp :block/name first))
                             set)]
    (is (set/subset? #{"page2" "page3"} exported-pages)
        "Contains all pages that haven't been marked private")
    (is (not (contains? exported-pages "page1"))
        "Doesn't contain private page")
    (is (= #{"page2" "page3"} exported-blocks)
        "Only exports blocks from public pages")
    ;; TODO: Create assets to test this
    #_(is (= ["thumb-on-fire_1648822523866_0.PNG"] assets)
          "Only exports assets from public pages")))

(deftest filter-only-public-pages-and-blocks-adds-missing-built-in-page-timestamps
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"
                       :build/properties {:logseq.property/publishing-public? true}}
                :blocks [{:block/title "b1"}]}
               {:page {:block/title melange-common/views-page-name
                       :build/properties {:logseq.property/built-in? true
                                          :logseq.property/hide? true}}
                :blocks []}])
        views-page (ldb/get-page @conn melange-common/views-page-name)
        _ (d/transact! conn
                       [[:db/retract (:db/id views-page) :block/created-at (:block/created-at views-page)]
                        [:db/retract (:db/id views-page) :block/updated-at (:block/updated-at views-page)]])
        [filtered-db _assets] (publish-db/filter-only-public-pages-and-blocks @conn)
        exported-views-page (ldb/get-page filtered-db melange-common/views-page-name)]
    (is (int? (:block/created-at exported-views-page))
        "Missing created-at is added to exported built-in pages")
    (is (int? (:block/updated-at exported-views-page))
        "Missing updated-at is added to exported built-in pages")
    (is (empty? (:errors (db-validate/validate-db filtered-db)))
        "Publishing DB remains valid after keeping hidden built-in pages")))

(deftest filter-only-public-pages-and-blocks
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"
                       :build/properties {:logseq.property/publishing-public? false}}
                :blocks [{:block/title "b11"}
                         {:block/title "b12"}
                         {:block/title "![awesome.png](../assets/awesome_1648822509908_0.png"}]}
               {:page {:block/title "page2"
                       :build/properties {:logseq.property/publishing-public? true
                                          :block/alias #{[:build/page {:block/title "page2-alias"}]}}}
                :blocks [{:block/title "b21"}
                         {:block/title "![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)"}]}
               {:page {:block/title "page3"
                       :build/properties {:logseq.property/publishing-public? true}}
                :blocks [{:block/title "b31"}]}])
        [filtered-db _assets] (publish-db/filter-only-public-pages-and-blocks @conn)
        exported-pages (->> (d/q '[:find (pull ?b [*])
                                   :where [?b :block/name]]
                                 filtered-db)
                            (map (comp :block/name first))
                            set)
        exported-block-pages (->> (d/q '[:find (pull ?p [*])
                                         :where
                                         [?b :block/title]
                                         [?b :block/page ?p]
                                         [(missing? $ ?p :logseq.property/built-in?)]]
                                       filtered-db)
                                  (map (comp :block/name first))
                                  set)
        exported-page2-children (->> (:block/_parent (ldb/get-page filtered-db "page2"))
                                     (map :block/title)
                                     set)]

    (is (set/subset? #{"page2" "page3"} exported-pages)
        "Contains all pages that have been marked public")
    (is (not (contains? exported-pages "page1"))
        "Doesn't contain private page")
    (is (seq (ldb/get-page filtered-db "page2-alias"))
        "Alias of public page is exported")
    (is (= #{"page2" "page3"} exported-block-pages)
        "Only exports blocks from public pages")
    (is (contains? exported-page2-children "b21")
        "Public page children are still available through block parent refs")
    ;; TODO: Create assets to test this
    #_(is (= ["thumb-on-fire_1648822523866_0.PNG"] assets)
          "Only exports assets from public pages")))
