(ns frontend.handler.journal-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.handler.journal :as journal-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private next-journal-uuid #uuid "11111111-1111-1111-1111-111111111111")

(defn- with-journal-navigation
  "Runs `f` with a journal title format other than the default one, where the
  journal of 2026-11-01 exists and its :block/name is not in that format, and
  where the current page is the journal of 2026-10-31. Returns the navigation
  calls `f` made."
  [f]
  (let [calls (atom [])]
    (-> (p/with-redefs [state/get-current-repo (constantly "test")
                        state/get-date-formatter (constantly "yyyy-MM-dd")
                        state/get-current-page (constantly "2026-10-31")
                        date/today-journal-day (constantly 20261231)
                        db-async/<get-block
                        (fn [_repo page-name _opts]
                          (p/resolved (when (= "2026-10-31" page-name)
                                        {:block/journal-day 20261031})))
                        db-async/<page-exists? (fn [& _] (p/resolved false))
                        db-async/<get-journal-page-by-day
                        (fn [_repo journal-day]
                          (p/resolved (when (= 20261101 journal-day)
                                        {:block/uuid next-journal-uuid
                                         :block/name "nov 1st, 2026"
                                         :block/title "2026-11-01"
                                         :block/journal-day 20261101})))
                        route-handler/redirect! (fn [route] (swap! calls conj [:redirect route]))
                        page-handler/<create! (fn [title & _] (swap! calls conj [:create title]))]
          (f))
        (p/then (fn [_] @calls)))))

(deftest go-to-next-journal-finds-existing-journal-by-day-test
  (async done
    (-> (with-journal-navigation journal-handler/go-to-next-journal!)
        (p/then (fn [calls]
                  (is (= [[:redirect {:to :page
                                      :path-params {:name (str next-journal-uuid)}}]]
                         calls)
                      "An existing journal opens even when its :block/name is not in the configured title format")))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest go-to-prev-journal-creates-missing-journal-with-configured-title-test
  (async done
    (-> (with-journal-navigation journal-handler/go-to-prev-journal!)
        (p/then (fn [calls]
                  (is (= [[:create "2026-10-30"]] calls)
                      "A day without a journal page is created with a title in the configured format")))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))

(deftest go-to-tomorrow-crosses-year-boundary-test
  (async done
    (-> (with-journal-navigation journal-handler/go-to-tomorrow!)
        (p/then (fn [calls]
                  (is (= [[:create "2027-01-01"]] calls))))
        (p/catch (fn [error] (is false (str error))))
        (p/finally done))))
