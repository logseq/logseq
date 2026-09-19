(ns frontend.components.block.control-icon-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]
            [frontend.util.entity :as entity]))

(def ^:private page-block
  {:db/id 1
   :block/title "Tagged page"
   :block/tags [{:db/ident :logseq.class/Page}]})

(def ^:private plain-block
  {:db/id 2
   :block/title "Plain block"})

(deftest library-page-entries-keep-page-icons-test
  (testing "pages are recognized as pages"
    (is (entity/page? page-block))
    (is (not (entity/page? plain-block))))
  (testing "pages show the control icon in Library and on-page"
    (is (true? (#'block/block-control-with-icon? page-block {:library? true} :icon false)))
    (is (true? (#'block/block-control-with-icon? page-block {} :icon false))))
  (testing "plain blocks without a custom icon stay as bullets"
    (is (false? (#'block/block-control-with-icon? plain-block {:library? true} :icon false)))
    (is (false? (#'block/block-control-with-icon? plain-block {} :icon false))))
  (testing "custom icons, linked blocks, tag icons, and PDFs still show"
    (is (true? (#'block/block-control-with-icon?
                (assoc plain-block :logseq.property/icon {:type :emoji :id "books"})
                {:library? true}
                :icon
                false)))
    (is (true? (#'block/block-control-with-icon? plain-block {:library? true} :icon true)))
    (is (true? (#'block/block-control-with-icon?
                (assoc plain-block :block/tags [{:logseq.property/icon {:type :tabler-icon :id "rocket"}}])
                {}
                :icon
                false)))
    (is (true? (#'block/block-control-with-icon?
                (assoc plain-block :logseq.property.asset/type "pdf")
                {}
                :icon
                false))))
  (testing "hide-block-icon? and a missing icon suppress the control icon"
    (is (false? (#'block/block-control-with-icon? page-block {:hide-block-icon? true} :icon false)))
    (is (false? (#'block/block-control-with-icon? page-block {} nil false)))))
