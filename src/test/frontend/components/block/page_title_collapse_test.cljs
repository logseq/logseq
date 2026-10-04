(ns frontend.components.block.page-title-collapse-test
  "Publishing remounts without persisted UI collapse state. Class and
   property page titles must still default closed so exported SPA pages
   do not dump their property panels open."
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block :as block]))

(def ^:private class-page
  {:block/title "Task"
   :block/tags [{:db/ident :logseq.class/Tag}]})

(def ^:private property-page
  {:block/title "Status"
   :block/tags [{:db/ident :logseq.class/Property}]})

(def ^:private ordinary-page
  {:block/title "Notes"
   :block/tags [{:db/ident :logseq.class/Page}]})

(deftest class-or-property-page-title-predicate-test
  (is (true? (#'block/class-or-property-page-title? {:page-title? true} class-page)))
  (is (true? (#'block/class-or-property-page-title? {:page-title? true} property-page)))
  (is (false? (#'block/class-or-property-page-title? {:page-title? true} ordinary-page)))
  (is (false? (#'block/class-or-property-page-title? {} class-page))
      "A class block that is not the page title keeps normal collapse rules."))

(deftest page-title-properties-default-collapsed-in-publishing-test
  (testing "class and property page titles start collapsed when UI state is missing"
    (is (true? (#'block/block-collapsed? {:page-title? true} class-page nil))
        "#task and other tag pages start collapsed in exported SPA-HTML.")
    (is (true? (#'block/block-collapsed? {:page-title? true} property-page nil))))
  (testing "an explicit UI override still wins"
    (is (false? (#'block/block-collapsed? {:page-title? true} class-page false)))
    (is (true? (#'block/block-collapsed? {:page-title? true} class-page true))))
  (testing "ordinary page titles are not forced closed"
    (is (false? (#'block/block-collapsed? {:page-title? true} ordinary-page nil)))))
