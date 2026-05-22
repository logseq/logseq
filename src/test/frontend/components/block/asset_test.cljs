(ns frontend.components.block.asset-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.block.asset :as block-asset]))

(deftest link-ext-test
  (testing "falls back to asset type when the URL has no extension"
    (is (= :pdf
           (block-asset/link-ext
            "zotero://select/library/items/QLUSY2JL"
            "zotero://select/library/items/QLUSY2JL"
            {:logseq.property.asset/type "pdf"})))))

(deftest link-file-name-test
  (testing "uses the resolved extension in the displayed file name"
    (is (= "test.pdf"
           (block-asset/link-file-name
            {:block/title "test"}
            :pdf)))))
