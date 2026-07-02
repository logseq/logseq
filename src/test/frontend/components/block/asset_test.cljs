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

(deftest asset-relative-path-test
  (testing "builds the graph-relative asset file path from an asset block"
    (let [asset-uuid (random-uuid)]
      (is (= (str "assets/" asset-uuid ".pdf")
             (block-asset/asset-relative-path
              {:block/uuid asset-uuid
               :logseq.property.asset/type "pdf"}))))))

(deftest show-missing-file-warning-test
  (testing "shows missing-file warning for local asset files that are absent"
    (is (true?
         (block-asset/show-missing-file-warning?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "pdf"}
          false))))
  (testing "does not show missing-file warning while a sync asset has not downloaded yet"
    (is (false?
         (block-asset/show-missing-file-warning?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "pdf"
           :logseq.property.asset/remote-metadata {:checksum "sha-256-value"
                                                   :type "pdf"}}
          false))))
  (testing "does not show missing-file warning before file existence is known"
    (is (false?
         (block-asset/show-missing-file-warning?
          {:block/uuid (random-uuid)
           :logseq.property.asset/type "pdf"}
          nil)))))

(deftest read-mode-title-attrs-test
  (testing "reserves the asset title row at the same height as a one-line editor"
    (let [attrs block-asset/read-mode-title-attrs]
      (is (= {:min-height 24} (:style attrs)))
      (is (= "asset-title-slot text-xs opacity-60 mt-1 cursor-text" (:class attrs))))))
