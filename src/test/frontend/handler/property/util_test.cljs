(ns frontend.handler.property.util-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.conn :as conn]
            [frontend.handler.property.util :as pu]))

(deftest get-block-property-value-uses-passed-block-map-test
  (with-redefs [conn/get-db
                (fn [& _]
                  (throw (js/Error. "renderer DB conn should not be used")))]
    (is (= "red"
           (pu/get-block-property-value
            {:db/id 1
             :logseq.property/icon "red"}
            :logseq.property/icon)))
    (is (= 2
           (pu/get-block-property-value
            {:db/id 2
             :logseq.property/heading 2}
            :logseq.property/heading)))))
