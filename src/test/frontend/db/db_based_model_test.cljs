(ns frontend.db.db-based-model-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.db.model :as model]))

(deftest hidden-page-test
  (is (false? (model/hidden-page? {:db/id 1 :block/title "page 1"})))
  (is (true? (model/hidden-page? {:db/id 2 :logseq.property/hide? true})))
  (is (false? (model/hidden-page? {:db/id 3
                                   :logseq.property/hide? true
                                   :block/tags [{:db/ident :logseq.class/Property}]})))
  (is (true? (model/hidden-page? "$$$test")))
  (is (true? (model/hidden-page? (str "$$$" (random-uuid))))))
