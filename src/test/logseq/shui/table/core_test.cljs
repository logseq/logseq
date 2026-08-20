(ns logseq.shui.table.core-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.shui.table.core :as table]))

(deftest selecting-an-existing-sort-promotes-it-test
  (let [sorting [{:id :block/title :asc? true}
                 {:id :block/updated-at :asc? false}]
        persisted-sorting (atom nil)
        table-option (table/table-option
                      {:data []
                       :columns [{:id :block/title}
                                 {:id :block/updated-at}]
                       :state {:sorting sorting
                               :row-selection {}
                               :visible-columns {}}
                       :data-fns {:set-sorting! #(reset! persisted-sorting %)
                                  :set-visible-columns! (fn [_])
                                  :set-row-selection! (fn [_])}})
        result ((:column-set-sorting! table-option)
                sorting
                {:id :block/updated-at}
                true)
        expected [{:id :block/updated-at :asc? true}
                  {:id :block/title :asc? true}]]
    (is (= expected result))
    (is (= expected @persisted-sorting))
    (is (= [:block/updated-at :block/title]
           (mapv :id result)))))
