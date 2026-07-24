(ns frontend.handler.common-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.handler.common :as common-handler]
            [frontend.util :as util]))

(deftest copy-to-clipboard-uses-passed-block-raw-titles-test
  (let [copy-call (atom nil)
        block {:db/id 1
               :block/title "rendered title"
               :block/raw-title "raw title"}]
    (with-redefs [util/copy-to-clipboard! (fn [raw-text & {:as opts}]
                                            (reset! copy-call [raw-text opts]))]
      (common-handler/copy-to-clipboard-without-id-property!
       "logseq_db_common"
       "markdown"
       "<p>html</p>"
       [block])
      (is (= ["markdown"
              {:html "<p>html</p>"
               :graph "logseq_db_common"
               :blocks [(assoc block :block/title "raw title")]}]
             @copy-call)))))

(deftest copy-to-clipboard-keeps-title-when-raw-title-is-missing-test
  (let [copy-call (atom nil)
        block {:db/id 1
               :block/title "plain title"}]
    (with-redefs [util/copy-to-clipboard! (fn [raw-text & {:as opts}]
                                            (reset! copy-call [raw-text opts]))]
      (common-handler/copy-to-clipboard-without-id-property!
       "logseq_db_common"
       "markdown"
       nil
       [block])
      (is (= ["markdown"
              {:html nil
               :graph "logseq_db_common"
               :blocks [block]}]
             @copy-call)))))
