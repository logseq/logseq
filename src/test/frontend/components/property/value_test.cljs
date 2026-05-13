(ns frontend.components.property.value-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.components.property.value :as property-value]
            [promesa.core :as p]))

(deftest resolve-journal-page-for-date-returns-existing-page-test
  (async done
         (let [existing-page {:db/id 100
                              :block/journal-day 20250102}
               created?* (atom false)]
           (-> (#'property-value/<resolve-journal-page-for-date
                (js/Date. "2025-01-02T00:00:00Z")
                (constantly "test-repo")
                (fn [_repo _title _opts]
                  (p/resolved existing-page))
                (fn [_title _opts]
                  (reset! created?* true)
                  (p/resolved {:db/id 999
                               :block/journal-day 20250102}))
                (constantly "Jan 2nd, 2025"))
               (p/then (fn [page]
                         (is (= existing-page page))
                         (is (false? @created?*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest resolve-journal-page-for-date-creates-page-when-missing-test
  (async done
         (let [created-page {:db/id 200
                             :block/journal-day 20250102}
               created-calls* (atom [])]
           (-> (#'property-value/<resolve-journal-page-for-date
                (js/Date. "2025-01-02T00:00:00Z")
                (constantly "test-repo")
                (fn [_repo _title _opts]
                  (p/resolved nil))
                (fn [title opts]
                  (swap! created-calls* conj [title opts])
                  (p/resolved created-page))
                (constantly "Jan 2nd, 2025"))
               (p/then (fn [page]
                         (is (= created-page page))
                         (is (= [["Jan 2nd, 2025" {:redirect? false}]] @created-calls*))
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest resolved-property-value-for-render-skips-default-for-placeholder-row-test
  (let [property {:db/ident :logseq.property/status
                  :logseq.property/default-value {:db/id 3
                                                  :db/ident :logseq.property/status.todo
                                                  :block/title "Todo"}}
        placeholder-block {:db/id 1}]
    (is (nil? (#'property-value/resolved-property-value-for-render placeholder-block property false)))))

(deftest resolved-property-value-for-render-uses-default-for-loaded-block-test
  (let [property {:db/ident :logseq.property/status
                  :logseq.property/default-value {:db/id 3
                                                  :db/ident :logseq.property/status.todo
                                                  :block/title "Todo"}}
        loaded-block {:db/id 1
                      :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}]
    (is (= (:logseq.property/default-value property)
           (#'property-value/resolved-property-value-for-render loaded-block property false)))))

(deftest add-initial-node-choice-dedupes-existing-db-id-test
  (let [existing {:value {:db/id 100
                          :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                  :label "Existing node"}
        duplicate {:value {:db/id 100
                           :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                   :label "Existing node"}]
    (is (= [existing]
           (#'property-value/add-initial-node-choice [existing] duplicate)))))

(deftest add-initial-node-choice-dedupes-existing-uuid-test
  (let [existing {:value {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                  :label "Existing node"}
        duplicate {:value {:block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                   :label "Existing node"}]
    (is (= [existing]
           (#'property-value/add-initial-node-choice [existing] duplicate)))))

(deftest add-initial-node-choice-keeps-distinct-node-with-same-label-test
  (let [existing {:value {:db/id 100
                          :block/uuid #uuid "11111111-1111-1111-1111-111111111111"}
                  :label "Shared title"}
        new-choice {:value {:db/id 101
                            :block/uuid #uuid "22222222-2222-2222-2222-222222222222"}
                    :label "Shared title"}]
    (is (= [existing new-choice]
           (#'property-value/add-initial-node-choice [existing] new-choice)))))
