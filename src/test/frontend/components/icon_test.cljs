(ns frontend.components.icon-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.icon :as icon]))

(deftest node-icon-precedence-matches-sidebar-and-command-results-test
  (let [own-icon {:type :emoji :id "sparkles"}
        tag-icon {:type :tabler-icon :id "rocket" :color "#ff0000"}
        tag {:db/id 2
             :db/ident :user.class/project
             :logseq.property/icon tag-icon}
        page-tag {:db/id 3 :db/ident :logseq.class/Page}
        class-tag {:db/id 4 :db/ident :logseq.class/Tag}
        property-tag {:db/id 5 :db/ident :logseq.class/Property}
        tagged-page {:db/id 1
                     :block/name "tagged-page"
                     :block/tags [tag page-tag]}]
    (testing "the node's own icon wins"
      (is (= own-icon
             (icon/get-node-icon (assoc tagged-page :logseq.property/icon own-icon)
                                 {}))))
    (testing "an inherited tag icon wins over generic block and page fallbacks"
      (is (= tag-icon
             (icon/get-node-icon {:db/id 1 :block/tags [tag]} {})))
      (is (= tag-icon
             (icon/get-node-icon tagged-page {})))
      (is (some? (icon/get-node-icon-cp tagged-page {:not-text-or-page? true}))))
    (testing "a PDF asset icon wins over an inherited tag icon"
      (is (= "book"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [tag]
                                  :logseq.property.asset/type "pdf"}
                                 {}))))
    (testing "page, class, and property fallbacks stay deterministic"
      (is (= "file"
             (icon/get-node-icon {:db/id 1
                                  :block/name "page"
                                  :block/tags [page-tag]}
                                 {})))
      (is (= "hash"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [tag class-tag]}
                                 {})))
      (is (= "letter-p"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [tag property-tag]}
                                 {}))))))
