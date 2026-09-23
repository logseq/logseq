(ns frontend.extensions.fsrs-test
  (:require [cljs.test :as test :refer [async deftest is]]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

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
