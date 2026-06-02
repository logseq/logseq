(ns frontend.db.content-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.frontend.content :as db-content]))

(deftest title-ref->id-ref-replaces-markdown-hashtag-link-target-test
  (testing "hashtag targets inside markdown links are stored as id refs"
    (is (= "alias [Tag Number One](#[[5c6cd067-c602-4955-96b8-74b62e08113c]])"
           (db-content/title-ref->id-ref "alias [Tag Number One](#Tag1)"
                                         [{:block/title "Tag1"
                                           :block/uuid #uuid "5c6cd067-c602-4955-96b8-74b62e08113c"}]
                                         {:replace-tag? true})))))
