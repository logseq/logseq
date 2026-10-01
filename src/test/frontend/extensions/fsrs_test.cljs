(ns frontend.extensions.fsrs-test
  (:require [cljs.test :as test :refer [async deftest is testing]]
            [frontend.extensions.fsrs :as fsrs]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [open-spaced-repetition.cljc-fsrs.core :as fsrs.core]
            [promesa.core :as p]))

(defn- extends-card-block
  []
  {:db/id 7
   :block/uuid (random-uuid)
   :block/tags [{:db/ident :user.class/Project
                 :logseq.property.class/extends [{:db/ident :logseq.class/Card}]}]
   :block/created-at (js/Date.now)})

(defn- deep-extends-card-block
  "A #Project card three extends edges below Card: Project -> Milestone -> Work -> Card.
  Mirrors the nested maps produced by the recursive pull in `repeat-card!`."
  []
  {:db/id 8
   :block/uuid (random-uuid)
   :block/tags [{:db/ident :user.class/Project
                 :logseq.property.class/extends
                 [{:db/ident :user.class/Milestone
                   :logseq.property.class/extends
                   [{:db/ident :user.class/Work
                     :logseq.property.class/extends
                     [{:db/ident :logseq.class/Card}]}]}]}]
   :block/created-at (js/Date.now)})

(deftest card-block?-matches-worker-structured-children
  (testing "direct Card tag"
    (is (true? (#'fsrs/card-block? {:block/tags [{:db/ident :logseq.class/Card}]}))))
  (testing "tag that extends Card"
    (is (true? (#'fsrs/card-block? (extends-card-block)))))
  (testing "nested tag that extends a Card child"
    (is (true? (#'fsrs/card-block?
                {:block/tags [{:db/ident :user.class/Project
                               :logseq.property.class/extends
                               [{:db/ident :user.class/Mid
                                 :logseq.property.class/extends [{:db/ident :logseq.class/Card}]}]}]}))))
  (testing "unrelated tag"
    (is (false? (#'fsrs/card-block? {:block/tags [{:db/ident :user.class/Project}]}))))
  (testing "no tags"
    (is (false? (#'fsrs/card-block? {:block/tags []})))))

(deftest get-card-map-treats-extends-card-as-card
  (let [card-map (#'fsrs/get-card-map (extends-card-block))]
    (is (some? card-map)
        "A #Project block whose tag extends Card must get a card-map, matching the worker.")
    (is (some? (:due card-map)))))

(deftest get-card-map-is-nil-when-block-is-not-a-card
  (is (nil? (#'fsrs/get-card-map {:block/tags [{:db/ident :user.class/Project}]}))))

(deftest repeat-card-throws-on-nil-card-map
  (testing "The Show answers crash: repeat-card! does not accept a nil card-map"
    (is (thrown? js/Error (fsrs.core/repeat-card! nil :good)))))

(deftest rating-due-date-skips-repeat-card-when-card-map-is-nil
  (testing "rating-btns must not call repeat-card! when get-card-map is nil"
    (let [card-map (#'fsrs/get-card-map {:db/id 1 :block/tags []})
          due (when card-map
                (:due (fsrs.core/repeat-card! card-map :good)))]
      (is (nil? card-map))
      (is (nil? due)))))

(deftest rating-due-date-works-for-extends-card
  (let [card-map (#'fsrs/get-card-map (extends-card-block))
        due (when card-map
              (:due (fsrs.core/repeat-card! card-map :good)))]
    (is (some? card-map))
    (is (some? due))))

(deftest rating-extends-card-persists-state
  (async done
    (let [block (extends-card-block)
          persisted (atom nil)]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [api & _args]
                            (case api
                              :thread-api/pull
                              (p/resolved block)
                              :thread-api/get-fsrs-due-card-block-ids
                              (p/resolved [])))
                          property-handler/set-block-properties!
                          (fn [_block-id properties]
                            (reset! persisted properties)
                            (p/resolved nil))
                          state/get-current-repo (constantly "test-graph")]
            (#'fsrs/rate-card! "test-graph" (:db/id block) :good))
          (p/then
           (fn [_]
             (is (some? (:logseq.property.fsrs/state @persisted)))
             (is (some? (:logseq.property.fsrs/due @persisted)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest rating-deep-extends-card-persists-state
  (async done
    (let [block (deep-extends-card-block)
          persisted (atom nil)]
      (-> (p/with-redefs [state/<invoke-db-worker
                          (fn [api & _args]
                            (case api
                              :thread-api/pull
                              (p/resolved block)
                              :thread-api/get-fsrs-due-card-block-ids
                              (p/resolved [])))
                          property-handler/set-block-properties!
                          (fn [_block-id properties]
                            (reset! persisted properties)
                            (p/resolved nil))
                          state/get-current-repo (constantly "test-graph")]
            (#'fsrs/rate-card! "test-graph" (:db/id block) :good))
          (p/then
           (fn [_]
             (is (some? (:logseq.property.fsrs/state @persisted))
                 "Rating a card three extends edges below Card must persist.")
             (is (some? (:logseq.property.fsrs/due @persisted)))))
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
