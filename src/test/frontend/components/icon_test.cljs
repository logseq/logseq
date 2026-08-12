(ns frontend.components.icon-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.icon :as icon]))

(deftest node-icon-precedence-matches-sidebar-and-command-results-test
  (let [own-icon {:type :emoji :id "sparkles"}
        tag-icon {:type :tabler-icon :id "rocket" :color "#ff0000"}
        tag {:db/id 2
             :db/ident :user.class/project
             :logseq.property/icon tag-icon}]
    (testing "the node's own icon wins"
      (is (= own-icon
             (icon/get-node-icon {:db/id 1
                                  :block/tags [tag]
                                  :logseq.property/icon own-icon}
                                 {}))))
    (testing "an inherited tag icon is retained for ordinary blocks"
      (is (= tag-icon
             (icon/get-node-icon {:db/id 1 :block/tags [tag]} {}))))
    (testing "page, class, and property fallbacks stay deterministic"
      (is (= "file"
             (icon/get-node-icon {:db/id 1
                                  :block/name "page"
                                  :block/tags [{:db/ident :logseq.class/Page}]}
                                 {})))
      (is (= "hash"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [{:db/ident :logseq.class/Tag}]}
                                 {})))
      (is (= "letter-p"
             (icon/get-node-icon {:db/id 1
                                  :block/tags [{:db/ident :logseq.class/Property}]}
                                 {}))))))
