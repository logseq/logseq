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

(deftest library-page-icon-visibility-test
  (testing "pages are recognized as pages"
    (is (entity/page? page-block))
    (is (not (entity/page? plain-block))))
  (testing "a page with only the default icon shows the icon on-page and a bullet in Library"
    (is (#'block/block-control-with-icon? page-block {} :icon false))
    (is (not (#'block/block-control-with-icon? page-block {:library? true} :icon false))))
  (testing "plain blocks without a custom icon stay as bullets"
    (is (not (#'block/block-control-with-icon? plain-block {:library? true} :icon false)))
    (is (not (#'block/block-control-with-icon? plain-block {} :icon false))))
  (testing "own icons, linked blocks, tag icons, and PDFs still show in Library"
    (is (#'block/block-control-with-icon?
         (assoc page-block :logseq.property/icon {:type :emoji :id "books"})
         {:library? true}
         :icon
         false))
    (is (#'block/block-control-with-icon?
         (assoc plain-block :logseq.property/icon {:type :emoji :id "books"})
         {:library? true}
         :icon
         false))
    (is (#'block/block-control-with-icon? plain-block {:library? true} :icon true))
    (is (#'block/block-control-with-icon?
         (assoc plain-block :block/tags [{:logseq.property/icon {:type :tabler-icon :id "rocket"}}])
         {:library? true}
         :icon
         false))
    (is (#'block/block-control-with-icon?
         (assoc plain-block :logseq.property.asset/type "pdf")
         {:library? true}
         :icon
         false)))
  (testing "hide-block-icon? and a missing icon suppress the control icon"
    (is (not (#'block/block-control-with-icon? page-block {:hide-block-icon? true} :icon false)))
    (is (not (#'block/block-control-with-icon? page-block {} nil false)))))

(deftest block-control-icon-size-follows-heading-test
  (testing "non-heading blocks keep the existing collapsed and expanded sizes"
    (is (= 14 (#'block/block-control-icon-size plain-block {} false)))
    (is (= 12 (#'block/block-control-icon-size plain-block {} true))))
  (testing "heading blocks share the heading chrome icon size"
    (is (= 28 (#'block/block-control-icon-size {:block/heading-level 1} {} false)))
    (is (= 24 (#'block/block-control-icon-size {:block/heading-level 2} {} false)))
    (is (= 20 (#'block/block-control-icon-size {:block/heading-level 3} {} false)))
    (is (= 16 (#'block/block-control-icon-size {:block/heading-level 4} {} false)))
    (is (= 13 (#'block/block-control-icon-size {:block/heading-level 5} {} false)))
    (is (= 12 (#'block/block-control-icon-size {:block/heading-level 6} {} false))))
  (testing "heading icon size does not shrink when the block is collapsed"
    (is (= 28 (#'block/block-control-icon-size {:block/heading-level 1} {} true))))
  (testing "boolean heading follows indent level like heading chrome"
    (is (= 28 (#'block/block-control-icon-size {:block.temp/heading true} {:level 0} false)))
    (is (= 24 (#'block/block-control-icon-size {:block.temp/heading true} {:level 1} false))))
  (testing "invalid heading levels keep the non-heading icon size"
    (is (= 14 (#'block/block-control-icon-size {:block/heading-level 0} {} false)))
    (is (= 14 (#'block/block-control-icon-size {:block/heading-level 7} {} false)))))
