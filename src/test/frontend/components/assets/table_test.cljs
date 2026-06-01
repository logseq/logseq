(ns frontend.components.assets.table-test
  (:require [cljs.test :refer [are deftest is testing]]
            [frontend.components.assets.pdf-annotations :as pdf-annotations]
            [frontend.components.assets.table :as asset-table]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [logseq.shui.table.core :as shui-table]))

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

(deftest enhance-columns-adds-non-property-file-column
  (let [columns [{:id :select}
                 {:id :block/title}
                 {:id :logseq.property.asset/type}]
        result (asset-table/enhance-columns
                {:config {}
                 :columns columns
                 :annotation-index annotation-index
                 :set-expanded-pdf-ids! identity})
        file-column (some #(when (= :file (:id %)) %) result)]
    (is (= [:select :block/title :file :logseq.property.asset/type]
           (mapv :id result)))
    (is (= false (:column-list? file-column)))
    (is (fn? (:header file-column)))))

(deftest format-file-size-uses-dynamic-units
  (are [size expected] (= expected (#'asset-table/format-file-size size))
    0 "0 B"
    42 "42 B"
    1024 "1 KB"
    1536 "1.5 KB"
    1048576 "1 MB"
    1572864 "1.5 MB"
    1073741824 "1 GB"
    5368709120 "5 GB"))

(deftest enhance-columns-formats-asset-size-without-changing-sort-value
  (let [get-value (fn [row] (:logseq.property.asset/size row))
        original-cell (fn [_table _row _column _style] [:span "raw"])
        result (asset-table/enhance-columns
                {:config {}
                 :columns [{:id :block/title}
                           {:id :logseq.property.asset/size
                            :cell original-cell
                            :get-value get-value}]
                 :annotation-index annotation-index
                 :set-expanded-pdf-ids! identity})
        size-column (some #(when (= :logseq.property.asset/size (:id %)) %) result)]
    (is (= 1536 ((:get-value size-column) {:logseq.property.asset/size 1536})))
    (is (= [:div.flex.flex-1.items-center.justify-end.text-right "1.5 KB"]
           ((:cell size-column) {} {:logseq.property.asset/size 1536} size-column {})))
    (is (= [:span "raw"]
           ((:cell size-column) {} {:logseq.property.asset/size nil} size-column {})))))

(deftest build-pdf-annotation-table-data-groups-images-under-expanded-pdf
  (testing "collapsed PDFs hide their area highlight image assets from the top level"
    (is (= [10 40]
           (mapv shui-table/table-row-id
                 (pdf-annotations/build-pdf-annotation-table-data
                  [10 20 30 40] annotation-index #{})))))

  (testing "expanded PDFs insert area highlight image rows directly under the PDF"
    (is (= [{:db/id 10
             :asset-table/expanded? true}
            {:db/id 20
             :asset-table/nested? true
             :asset-table/annotation-id 200}
            {:db/id 30
             :asset-table/nested? true
             :asset-table/annotation-id 300}
            40]
           (pdf-annotations/build-pdf-annotation-table-data
            [10 20 30 40] annotation-index #{10}))))

  (testing "annotation images are hidden from the top level even when their source PDF is not in the result set"
    (is (= [40]
           (pdf-annotations/build-pdf-annotation-table-data
            [20 40] annotation-index #{}))))

  (testing "PDFs stay expandable when annotation image rows are not in the current rows"
    (is (= [{:db/id 10
             :asset-table/expanded? true}
            40]
           (pdf-annotations/build-pdf-annotation-table-data
            [10 40] annotation-index #{10}))))

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
      (is (= [{:db/id 10
               :asset-table/expanded? true}
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
             (pdf-annotations/build-pdf-annotation-table-data
              [10 20 30 40 50] index #{10})))))

  (testing "fresh row parent annotation augments stale index before rendering"
    (let [row {:db/id 50
               :block/parent {:db/id 500
                              :logseq.property/ls-type :annotation
                              :logseq.property/asset {:db/id 10}
                              :logseq.property.pdf/hl-image {:db/id 50}
                              :logseq.property.pdf/hl-page 10}}
          effective-index (pdf-annotations/augment-pdf-annotation-asset-index
                           annotation-index
                           [10 20 30 40 row])]
      (is (= [{:db/id 10
               :asset-table/expanded? true}
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
             (pdf-annotations/build-pdf-annotation-table-data
              [10 20 30 40 row] effective-index #{10})))))

  (testing "only explicitly pending area image assets are hidden until their annotation exists"
    (let [row {:db/id 50}]
      (with-redefs [pdf-assets/pending-area-image-asset? (fn [_repo asset-id]
                                                           (= 50 asset-id))]
        (is (= [{:db/id 10
                 :asset-table/expanded? true}
                {:db/id 20
                 :asset-table/nested? true
                 :asset-table/annotation-id 200}
                {:db/id 30
                 :asset-table/nested? true
                 :asset-table/annotation-id 300}
                40]
	               (pdf-annotations/build-pdf-annotation-table-data
	                [10 20 30 row 40] annotation-index #{10})))))))

(deftest build-pdf-annotation-table-data-skips-non-flat-table-data
  (let [grouped-data [["png" [20 30]]
                      ["pdf" [10]]]]
    (is (= grouped-data
           (pdf-annotations/build-pdf-annotation-table-data grouped-data annotation-index #{10})))))

(deftest augment-pdf-annotation-asset-index-skips-non-flat-table-data
  (let [grouped-data [["png" [20 30]]
                      ["pdf" [10]]]]
    (is (= annotation-index
           (pdf-annotations/augment-pdf-annotation-asset-index annotation-index grouped-data)))))

(deftest build-pdf-annotation-asset-index-keeps-image-annotations
  (let [index (#'pdf-annotations/build-pdf-annotation-asset-index
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
  (let [index (#'pdf-annotations/build-pdf-annotation-asset-index
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
         (#'asset-table/pdf-annotation-title
          {:block/title "Custom highlight title"
           :logseq.property.pdf/hl-page 3})))
  (is (= "P3 · Area highlight"
         (#'asset-table/pdf-annotation-title
          {:block/title "pdf area highlight"
           :logseq.property.pdf/hl-page 3})))
  (is (= "P3 · Area highlight"
           (#'asset-table/pdf-annotation-title
            {:block/title ""
             :logseq.property.pdf/hl-page 3}))))

(deftest toggle-expanded-pdf-id-keeps-other-expanded-pdfs
  (is (= #{10 40}
         (#'asset-table/toggle-expanded-pdf-id #{10} 40)))
  (is (= #{40}
         (#'asset-table/toggle-expanded-pdf-id #{10 40} 10))))

(deftest asset-row-selection-includes-pdf-annotation-images
  (testing "selecting a PDF row includes all associated annotation image asset ids"
    (is (= [20 30]
           (vec (pdf-annotations/asset-row-selection-related-ids
                 {:db/id 10 :logseq.property.asset/type "pdf"}
                 annotation-index)))))

  (testing "selecting an annotation image row stays independent"
    (is (nil? (pdf-annotations/asset-row-selection-related-ids
               {:db/id 20 :logseq.property.asset/type "png"}
               annotation-index))))

  (testing "selected row ids expand PDF parents to annotation image ids"
    (is (= [10 20 30 40]
           (pdf-annotations/expand-selected-asset-row-ids
            [10 40] {:selected-all? true} [10 40] annotation-index))))

  (testing "explicit selection keeps individually unchecked annotations unchecked"
    (is (= #{10 20 40}
           (set (pdf-annotations/expand-selected-asset-row-ids
                 [10 40] {:selected-ids #{10 20 40}} [10 40] annotation-index))))))
