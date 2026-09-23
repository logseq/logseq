(ns frontend.extensions.fsrs-test
  (:require [cljs.test :as test :refer [async deftest is testing]]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest card-ids-for-view-prefers-due-then-all
  (testing "due>0 review stays due-only"
    (is (= [1 2] (#'fsrs/card-ids-for-view [1 2] [1 2 3]))))
  (testing "due=0 browse falls back to every matching card"
    (is (= [3 4] (#'fsrs/card-ids-for-view [] [3 4]))))
  (testing "empty only when no cards exist"
    (is (= [] (#'fsrs/card-ids-for-view [] [])))))

(deftest get-card-ids-for-view-falls-back-when-due-is-empty
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [api & _args]
                            (swap! calls conj api)
                            (case api
                              :thread-api/get-fsrs-due-card-block-ids
                              (p/resolved [])
                              :thread-api/get-fsrs-card-block-ids
                              (p/resolved [10 11])
                              (p/resolved nil)))]
            (#'fsrs/<get-card-ids-for-view "test-graph" nil))
          (p/then
           (fn [ids]
             (is (= [10 11] ids)
                 "due=0 browse uses every matching card")
             (is (= [:thread-api/get-fsrs-due-card-block-ids
                     :thread-api/get-fsrs-card-block-ids]
                    @calls)
                 "All-cards query runs only after the due query is empty")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest get-card-ids-for-view-keeps-due-review-when-due-exists
  (async done
    (let [calls (atom [])]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [api & _args]
                            (swap! calls conj api)
                            (case api
                              :thread-api/get-fsrs-due-card-block-ids
                              (p/resolved [7])
                              :thread-api/get-fsrs-card-block-ids
                              (p/resolved [7 8 9])
                              (p/resolved nil)))]
            (#'fsrs/<get-card-ids-for-view "test-graph" nil))
          (p/then
           (fn [ids]
             (is (= [7] ids)
                 "due>0 review stays due-only")
             (is (= [:thread-api/get-fsrs-due-card-block-ids] @calls)
                 "Browse query is skipped while due cards exist")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest rating-last-due-card-updates-due-count
  (async done
    (let [original-count (state/get-state :srs/cards-due-count)
          block-uuid (random-uuid)
          block {:db/id 42
                 :block/uuid block-uuid
                 :block/tags [{:db/ident :logseq.class/Card}]
                 :block/created-at (js/Date.now)}
          due-ids (atom [42])
          events (atom [])]
      (state/set-state! :srs/cards-due-count 1)
      (-> (p/with-redefs [state/get-current-repo (constantly "test-graph")
                          state/<invoke-db-worker
                          (fn [api & _args]
                            (case api
                              :thread-api/pull
                              (p/resolved block)
                              :thread-api/get-fsrs-due-card-block-ids
                              (do (swap! events conj :count-refresh)
                                  (p/resolved @due-ids))))
                          property-handler/set-block-properties!
                          (fn [_block-id _properties]
                            (swap! events conj :rated)
                            (reset! due-ids [])
                            (p/resolved nil))]
            (#'fsrs/rate-card! "test-graph" 42 :good))
          (p/then
           (fn [_]
             (is (= [:rated :count-refresh] @events)
                 "Rating persists first, then refreshes the due-card query.")
             (is (zero? (state/get-state :srs/cards-due-count))
                 "Sidebar due count resets after the last due card is rated.")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (state/set-state! :srs/cards-due-count original-count)
             (done)))))))
