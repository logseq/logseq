(ns frontend.db.rtc.rtc-fns-test
  (:require [clojure.test :as t :refer [deftest is testing]]
            [frontend.db.rtc.core :as rtc-core]))


(deftest filter-remote-data-by-local-unpushed-ops-test
  (testing "case1"
    (let [[uuid1 uuid2] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :move
            :self uuid1
            :parents [uuid2]
            :left uuid2
            :content "content-str"}}
          unpushed-ops
          [["update" {:block-uuid uuid1
                      :updated-attrs {:content nil}}]]
          r (rtc-core/filter-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :move
               :self uuid1
               :parents [uuid2]
               :left uuid2}}
             r))))
  (testing "case2"
    (let [[uuid1 uuid2] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :update-attrs
            :self uuid1
            :parents [uuid2]
            :left uuid2
            :content "content-str"
            :created-at 123}}
          unpushed-ops
          [["update" {:block-uuid uuid1
                      :updated-attrs {:content nil}}]]
          r (rtc-core/filter-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (= {uuid1
              {:op :update-attrs
               :self uuid1
               :parents [uuid2]
               :left uuid2
               :created-at 123}}
             r))))
  (testing "case3"
    (let [[uuid1] (repeatedly (comp str random-uuid))
          affected-blocks-map
          {uuid1
           {:op :remove
            :block-uuid uuid1}}
          unpushed-ops
          [["move" {:block-uuids [uuid1]}]]
          r (rtc-core/filter-remote-data-by-local-unpushed-ops affected-blocks-map unpushed-ops)]
      (is (empty? r)))))
