(ns frontend.rfx-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [io.factorhouse.rfx.store :as store]
            [promesa.core :as p]))

(defn- timeout
  [value ms]
  (js/Promise.
   (fn [resolve _reject]
     (js/setTimeout #(resolve value) ms))))

(deftest dispatch-sync-updates-app-db
  (testing "dispatch-sync updates the active RFX app db and subscriptions read the new value"
    (rfx/init! {:initial-value {:counter 0}
                :registry (atom {})})
    (rfx/reg-sub! ::counter
      (fn [db _]
        (:counter db)))
    (rfx/reg-event-db! ::add
      (fn [db [_ amount]]
        (update db :counter + amount)))

    (rfx/dispatch-sync! [::add 3])

    (is (= 3 (rfx/snapshot-sub [::counter])))
    (is (= {:counter 3} (rfx/snapshot)))))

(deftest dispatch-sync-preserves-fast-state
  (rfx/init! {:initial-value {:counter 0
                              :db/query-results {["repo" :frontend.worker.react/other] [:stale]}}
              :registry (atom {})})
  (rfx/reg-event-db! ::increment
    (fn [db _]
      (update db :counter inc)))
  (rfx/replace-state! (assoc (rfx/snapshot) :db/query-results
                             {["repo" :frontend.worker.react/other] [:fresh]})
                      [:db/query-results])

  (rfx/dispatch-sync! [::increment])

  (is (= 1 (:counter (rfx/snapshot))))
  (is (= {["repo" :frontend.worker.react/other] [:fresh]}
         (:db/query-results (rfx/snapshot)))))

(deftest outliner-refresh-bypasses-the-general-rfx-store
  (rfx/init! {:initial-value {:db/latest-transacted-entity-uuids {}}
              :registry (atom {})})
  (let [store-writes (atom 0)
        refresh {:updated-ids #{(random-uuid)}}]
    (with-redefs [store/next-state! (fn [_ db]
                                      (swap! store-writes inc)
                                      db)]
      (rfx/replace-state! (assoc (rfx/snapshot)
                                 :db/latest-transacted-entity-uuids refresh)
                          [:db/latest-transacted-entity-uuids]))
    (is (zero? @store-writes)
        "The hot outliner refresh path should notify only precise state-path listeners.")
    (is (= refresh (:db/latest-transacted-entity-uuids (rfx/snapshot))))))

(deftest replace-state-paths-updates-fast-state-once
  (rfx/init! {:initial-value {:db/latest-transacted-entity-uuids {}}
              :registry (atom {})})
  (let [refresh {:tx-id (random-uuid)
                 :entity-tx-ids {(random-uuid) (random-uuid)}}
        paths [[:db/latest-transacted-entity-uuids :tx-id]
               [:db/latest-transacted-entity-uuids :entity-tx-ids]]
        store-writes (atom 0)]
    (with-redefs [store/next-state! (fn [_ db]
                                      (swap! store-writes inc)
                                      db)]
      (rfx/replace-state-paths! (assoc (rfx/snapshot)
                                       :db/latest-transacted-entity-uuids refresh)
                                paths))
    (is (zero? @store-writes))
    (is (= refresh (:db/latest-transacted-entity-uuids (rfx/snapshot))))))

(deftest pub-event-resolves-handler-result
  (async done
    (testing "pub-event! resolves with the event result after state updates"
      (rfx/init! {:initial-value {:value 1}
                  :registry (atom {})})
      (rfx/reg-event-fx! ::set-with-result
        (fn [{:keys [db]} [_ value]]
          {:db (assoc db :value value)
           ::rfx/result [:saved value]}))

      (-> (rfx/pub-event! [::set-with-result 42])
          (p/then
           (fn [result]
             (is (= [:saved 42] result))
             (is (= {:value 42} (rfx/snapshot)))
             (done)))
          (p/catch
           (fn [error]
             (is false (str "Expected pub-event! to resolve, got " error))
             (done)))))))

(deftest pub-event-rejects-handler-error
  (async done
    (testing "pub-event! rejects when an event returns an error result"
      (rfx/init! {:initial-value {}
                  :registry (atom {})})
      (rfx/reg-event-fx! ::fail
        (fn [_ _]
          {::rfx/error (js/Error. "boom")}))

      (-> (rfx/pub-event! [::fail])
          (p/then
           (fn [result]
             (is false (str "Expected pub-event! to reject, got " result))
             (done)))
          (p/catch
           (fn [error]
             (is (= "boom" (.-message error)))
             (done)))))))

(deftest state-pub-event-dispatches-rfx-events
  (async done
    (testing "frontend.state/pub-event! dispatches through the active RFX runtime"
      (rfx/init! {:initial-value {}
                  :registry (atom {})})
      (state/register-rfx-state-subs!)
      (rfx/reg-event-fx! ::state-event
        (fn [_ [_ value]]
          {::rfx/result [:ok value]}))

      (-> (js/Promise.race #js [(state/pub-event! [::state-event 9])
                                (timeout :timeout 50)])
          (p/then
           (fn [result]
             (is (= [:ok 9] result))
             (done)))
          (p/catch
           (fn [error]
             (is false (str "Expected state/pub-event! to resolve, got " error))
             (done)))))))

(deftest state-pub-event-rejects-missing-rfx-events
  (async done
    (testing "frontend.state/pub-event! rejects when no RFX event is registered"
      (rfx/init! {:initial-value {}
                  :registry (atom {})})
      (state/register-rfx-state-subs!)

      (-> (js/Promise.race #js [(state/pub-event! [::missing-event])
                                (timeout :timeout 50)])
          (p/then
           (fn [result]
             (is (not= :timeout result))
             (is false (str "Expected missing RFX event to reject, got " result))
             (done)))
          (p/catch
           (fn [error]
             (is (re-find #"Cannot find event" (.-message error)))
             (done)))))))

(deftest state-does-not-own-system-event-channel
  (testing "frontend state no longer owns the event dispatch channel"
    (is (not (contains? @state/state :system/events)))))
