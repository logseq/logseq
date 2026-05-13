(ns frontend.components.property.config-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.components.property.config :as property-config]))

(deftest closed-choice-scope-opts-test
  (let [owner-class {:db/id 123 :block/tags [{:db/ident :logseq.class/Tag}]}
        owner-page {:db/id 456 :block/tags []}]
    (testing "Create defaults to global choice even in class context"
      (is (= {}
             (property-config/->closed-choice-scope-opts {:owner-block owner-class
                                                          :scoped-to-owner? false}))
          "No scoped-class-id when toggle is off"))

    (testing "Create can opt into class-scoped choice"
      (is (= {:scoped-class-id 123}
             (property-config/->closed-choice-scope-opts {:owner-block owner-class
                                                          :scoped-to-owner? true}))
          "scoped-class-id is included only when toggle is on"))

    (testing "Non-class owner never sets scoped-class-id"
      (is (= {}
             (property-config/->closed-choice-scope-opts {:owner-block owner-page
                                                          :scoped-to-owner? true}))))))

(deftest remove-choice-scope-for-owner-tag-tx-data-test
  (testing "Retract scope only for current owner tag"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21} {:db/id 22}]}
          owner-block {:db/id 22}]
      (is (= [[:db/retract 11 :logseq.property/choice-classes 22]]
             (property-config/->remove-choice-scope-for-owner-tag-tx-data
              {:choice choice :owner-block owner-block})))))

  (testing "No tx-data when current owner tag is not in scoped classes"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21}]}
          owner-block {:db/id 22}]
      (is (= []
             (property-config/->remove-choice-scope-for-owner-tag-tx-data
              {:choice choice :owner-block owner-block}))))))

(deftest use-choice-in-owner-tag-tx-data-test
  (testing "Add owner tag to scoped choice from another tag"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21}]}
          owner-block {:db/id 22}]
      (is (= [[:db/add 11 :logseq.property/choice-classes 22]]
             (property-config/->use-choice-in-owner-tag-tx-data
              {:choice choice :owner-block owner-block})))))

  (testing "No tx-data for global choice"
    (is (= []
           (property-config/->use-choice-in-owner-tag-tx-data
            {:choice {:db/id 11}
             :owner-block {:db/id 22}}))))

  (testing "No tx-data when owner is already in scoped classes"
    (let [choice {:db/id 11
                  :logseq.property/choice-classes [{:db/id 21} {:db/id 22}]}
          owner-block {:db/id 22}]
      (is (= []
             (property-config/->use-choice-in-owner-tag-tx-data
              {:choice choice :owner-block owner-block}))))))

(deftest choice-scoped-from-other-tags?-test
  (testing "True when choice is scoped and current owner tag is not included"
    (is (true?
         (property-config/choice-scoped-from-other-tags?
          {:choice {:logseq.property/choice-classes [{:db/id 21}]}
           :owner-block {:db/id 22 :block/tags [{:db/ident :logseq.class/Tag}]}}))))

  (testing "False for global choice"
    (is (false?
         (property-config/choice-scoped-from-other-tags?
          {:choice {}
           :owner-block {:db/id 22 :block/tags [{:db/ident :logseq.class/Tag}]}}))))

  (testing "False when current owner tag is in scope"
    (is (false?
         (property-config/choice-scoped-from-other-tags?
          {:choice {:logseq.property/choice-classes [{:db/id 21} {:db/id 22}]}
           :owner-block {:db/id 22 :block/tags [{:db/ident :logseq.class/Tag}]}})))))
