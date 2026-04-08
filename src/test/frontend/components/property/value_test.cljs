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
