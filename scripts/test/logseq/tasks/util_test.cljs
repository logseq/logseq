(ns logseq.tasks.util-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.tasks.util :as util]))

(deftest display-width-handles-wide-and-combining-characters
  (is (= 5 (util/display-width "hello")))
  (is (= 4 (util/display-width "中文")))
  (is (= 4 (util/display-width "한국")))
  (is (= 1 (util/display-width "e\u0301"))))

(deftest render-table-right-aligns-columns-using-display-width
  (is (= (str "| :locale | :language |\n"
              "|---------+-----------|\n"
              "|     :en |   English |\n"
              "|     :ja |    日本語 |\n"
              "|     :ko |      한국 |\n")
         (util/render-table [{:locale :en :language "English"}
                             {:locale :ja :language "日本語"}
                             {:locale :ko :language "한국"}]))))
