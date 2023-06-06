(ns logseq.publishing.db-test
  (:require [cljs.test :refer [deftest is]]
            [clojure.set :as set]
            [logseq.publishing.db :as publish-db]
            [logseq.graph-parser :as graph-parser]
            [datascript.core :as d]
            [logseq.db :as ldb]))

(deftest clean-export!
  (let [conn (ldb/start-conn)
        _ (graph-parser/parse-file conn "page1.md" "public:: false\n- b11\n- b12\n- ![awesome.png](../assets/awesome_1648822509908_0.png)")
        _ (graph-parser/parse-file conn "page2.md" "- b21\n- ![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)")
        _ (graph-parser/parse-file conn "page3.md" "- b31")
        [filtered-db assets] (publish-db/clean-export! @conn)
        exported-pages (->> (d/q '[:find (pull ?b [*])
                                   :where [?b :block/name]]
                                 filtered-db)
                            (map (comp :block/name first))
                            set)
        exported-blocks (->> (d/q '[:find (pull ?p [*])
                                    :where
                                    [?b :block/content]
                                    [?b :block/page ?p]]
                                  filtered-db)
                             (map (comp :block/name first))
                             set)]
    (is (set/subset? #{"page2" "page3"} exported-pages)
        "Contains all pages that haven't been marked private")
    (is (not (contains? exported-pages "page1"))
        "Doesn't contain private page")
    (is (= #{"page2" "page3"} exported-blocks)
        "Only exports blocks from public pages")
    (is (= ["thumb-on-fire_1648822523866_0.PNG"] assets)
        "Only exports assets from public pages")))

(deftest filter-only-public-pages-and-blocks
  (let [conn (ldb/start-conn)
        _ (graph-parser/parse-file conn "page1.md" "- b11\n- b12\n- ![awesome.png](../assets/awesome_1648822509908_0.png)")
        _ (graph-parser/parse-file conn "page2.md" "alias:: page2-alias\npublic:: true\n- b21\n- ![thumb-on-fire.PNG](../assets/thumb-on-fire_1648822523866_0.PNG)")
        _ (graph-parser/parse-file conn "page3.md" "public:: true\n- b31")
        [filtered-db assets] (publish-db/filter-only-public-pages-and-blocks @conn)
        exported-pages (->> (d/q '[:find (pull ?b [*])
                                   :where [?b :block/name]]
                                 filtered-db)
                            (map (comp :block/name first))
                            set)
        exported-block-pages (->> (d/q '[:find (pull ?p [*])
                                         :where
                                         [?b :block/content]
                                         [?b :block/page ?p]]
                                       filtered-db)
                                  (map (comp :block/name first))
                                  set)]

    (is (set/subset? #{"page2" "page3"} exported-pages)
        "Contains all pages that have been marked public")
    (is (not (contains? exported-pages "page1"))
        "Doesn't contain private page")
    (is (seq (d/entity filtered-db [:block/name "page2-alias"]))
          "Alias of public page is exported")
    (is (= #{"page2" "page3"} exported-block-pages)
        "Only exports blocks from public pages")
    (is (= ["thumb-on-fire_1648822523866_0.PNG"] assets)
        "Only exports assets from public pages")))
