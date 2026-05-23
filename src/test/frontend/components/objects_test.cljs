(ns frontend.components.objects-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.objects :as objects]
            [frontend.extensions.pdf.assets :as pdf-assets]))

(def annotation-index
  {:image-id->annotation
   {20 {:db/id 200
        :logseq.property/asset {:db/id 10}
        :logseq.property.pdf/hl-image {:db/id 20}
        :logseq.property.pdf/hl-page 3}
    30 {:db/id 300
        :logseq.property/asset {:db/id 10}
        :logseq.property.pdf/hl-image {:db/id 30}
        :logseq.property.pdf/hl-page 8}}
   :pdf-id->annotations
   {10 [{:db/id 200
         :logseq.property/asset {:db/id 10}
         :logseq.property.pdf/hl-image {:db/id 20}
         :logseq.property.pdf/hl-page 3}
        {:db/id 300
         :logseq.property/asset {:db/id 10}
         :logseq.property.pdf/hl-image {:db/id 30}
         :logseq.property.pdf/hl-page 8}]}})

(deftest build-pdf-annotation-table-data-groups-images-under-expanded-pdf
  (testing "collapsed PDFs hide their area highlight image assets from the top level"
    (is (= [10 40]
           (#'objects/build-pdf-annotation-table-data
            [10 20 30 40] annotation-index #{}))))

  (testing "expanded PDFs insert area highlight image rows directly under the PDF"
    (is (= [10
            {:db/id 20
             :asset-table/nested? true
             :asset-table/annotation-id 200}
            {:db/id 30
             :asset-table/nested? true
             :asset-table/annotation-id 300}
            40]
           (#'objects/build-pdf-annotation-table-data
            [10 20 30 40] annotation-index #{10}))))

  (testing "annotation images are hidden from the top level even when their source PDF is not in the result set"
    (is (= [40]
           (#'objects/build-pdf-annotation-table-data
            [20 40] annotation-index #{}))))

  (testing "newly indexed annotation images move from top-level rows to the expanded PDF"
    (let [index (-> annotation-index
                    (assoc-in [:image-id->annotation 50]
                              {:db/id 500
                               :logseq.property/asset {:db/id 10}
                               :logseq.property.pdf/hl-image {:db/id 50}
                               :logseq.property.pdf/hl-page 10})
                    (update-in [:pdf-id->annotations 10] conj
                               {:db/id 500
                                :logseq.property/asset {:db/id 10}
                                :logseq.property.pdf/hl-image {:db/id 50}
                                :logseq.property.pdf/hl-page 10}))]
      (is (= [10
              {:db/id 20
               :asset-table/nested? true
               :asset-table/annotation-id 200}
              {:db/id 30
               :asset-table/nested? true
               :asset-table/annotation-id 300}
              {:db/id 50
               :asset-table/nested? true
               :asset-table/annotation-id 500}
             40]
             (#'objects/build-pdf-annotation-table-data
              [10 20 30 40 50] index #{10})))))

  (testing "fresh row parent annotation augments stale index before rendering"
    (let [row {:db/id 50
               :block/parent {:db/id 500
                              :logseq.property/ls-type :annotation
                              :logseq.property/asset {:db/id 10}
                              :logseq.property.pdf/hl-image {:db/id 50}
                              :logseq.property.pdf/hl-page 10}}
          effective-index (#'objects/augment-pdf-annotation-asset-index
                           annotation-index
                           [10 20 30 40 row])]
      (is (= [10
              {:db/id 20
               :asset-table/nested? true
               :asset-table/annotation-id 200}
              {:db/id 30
               :asset-table/nested? true
               :asset-table/annotation-id 300}
              {:db/id 50
               :asset-table/nested? true
               :asset-table/annotation-id 500}
              40]
             (#'objects/build-pdf-annotation-table-data
              [10 20 30 40 row] effective-index #{10})))))

  (testing "only explicitly pending area image assets are hidden until their annotation exists"
    (let [row {:db/id 50}]
      (with-redefs [pdf-assets/pending-area-image-asset? (fn [_repo asset-id]
                                                           (= 50 asset-id))]
        (is (= [10
                {:db/id 20
                 :asset-table/nested? true
                 :asset-table/annotation-id 200}
                {:db/id 30
                 :asset-table/nested? true
                 :asset-table/annotation-id 300}
                40]
	               (#'objects/build-pdf-annotation-table-data
	                [10 20 30 row 40] annotation-index #{10})))))))

(deftest build-pdf-annotation-table-data-skips-non-flat-table-data
  (let [grouped-data [["png" [20 30]]
                      ["pdf" [10]]]]
    (is (= grouped-data
           (#'objects/build-pdf-annotation-table-data grouped-data annotation-index #{10})))))

(deftest build-pdf-annotation-asset-index-keeps-image-annotations
  (let [index (#'objects/build-pdf-annotation-asset-index
               [{:db/id 300
                 :logseq.property/asset {:db/id 10}
                 :logseq.property.pdf/hl-image {:db/id 30}
                 :logseq.property.pdf/hl-page 8}
                {:db/id 200
                 :logseq.property/asset {:db/id 10}
                 :logseq.property.pdf/hl-image {:db/id 20}
                 :logseq.property.pdf/hl-page 3}
                {:db/id 400
                 :logseq.property/asset {:db/id 10}
                 :logseq.property.pdf/hl-page 4}])]
    (is (= #{20 30}
           (set (keys (:image-id->annotation index)))))
    (is (= [200 300]
           (mapv :db/id (get-in index [:pdf-id->annotations 10]))))))

(deftest build-pdf-annotation-asset-index-sorts-annotations-by-pdf-position
  (let [index (#'objects/build-pdf-annotation-asset-index
               [{:db/id 300
                 :block/order "a0"
                 :logseq.property/asset {:db/id 10}
                 :logseq.property.pdf/hl-image {:db/id 30}
                 :logseq.property.pdf/hl-page 2
                 :logseq.property.pdf/hl-value {:position {:bounding {:x1 30 :y1 20}}}}
                {:db/id 200
                 :block/order "z0"
                 :logseq.property/asset {:db/id 10}
                 :logseq.property.pdf/hl-image {:db/id 20}
                 :logseq.property.pdf/hl-page 2
                 :logseq.property.pdf/hl-value {:position {:bounding {:x1 20 :y1 10}}}}
                {:db/id 400
                 :block/order "b0"
                 :logseq.property/asset {:db/id 10}
                 :logseq.property.pdf/hl-image {:db/id 40}
                 :logseq.property.pdf/hl-page 1
                 :logseq.property.pdf/hl-value {:position {:bounding {:x1 10 :y1 90}}}}])]
    (is (= [400 200 300]
           (mapv :db/id (get-in index [:pdf-id->annotations 10]))))))

(deftest pdf-annotation-title-prefers-custom-title
  (is (= "P3 · Custom highlight title"
         (#'objects/pdf-annotation-title
          {:block/title "Custom highlight title"
           :logseq.property.pdf/hl-page 3})))
  (is (= "P3 · Area highlight"
         (#'objects/pdf-annotation-title
          {:block/title "pdf area highlight"
           :logseq.property.pdf/hl-page 3})))
  (is (= "P3 · Area highlight"
         (#'objects/pdf-annotation-title
          {:block/title ""
           :logseq.property.pdf/hl-page 3}))))

(deftest asset-row-selection-includes-pdf-annotation-images
  (testing "selecting a PDF row includes all associated annotation image asset ids"
    (is (= [20 30]
           (vec (#'objects/asset-row-selection-related-ids
                 {:db/id 10 :logseq.property.asset/type "pdf"}
                 annotation-index)))))

  (testing "selecting an annotation image row stays independent"
    (is (nil? (#'objects/asset-row-selection-related-ids
               {:db/id 20 :logseq.property.asset/type "png"}
               annotation-index))))

  (testing "selected row ids expand PDF parents to annotation image ids"
    (is (= [10 20 30 40]
           (#'objects/expand-selected-asset-row-ids
            [10 40] {:selected-all? true} [10 40] annotation-index))))

  (testing "explicit selection keeps individually unchecked annotations unchecked"
    (is (= #{10 20 40}
           (set (#'objects/expand-selected-asset-row-ids
                 [10 40] {:selected-ids #{10 20 40}} [10 40] annotation-index))))))
