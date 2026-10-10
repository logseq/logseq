(ns frontend.handler-test
  (:require [cljs.test :refer [async deftest is testing]]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.db.restore :as db-restore]
            [frontend.handler :as handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [promesa.core :as p]))

(deftest date-watch-queries-the-journal-only-when-the-day-changes-test
  (let [today (atom "Jul 19th, 2026")
        create-count (atom 0)
        interval-callback (atom nil)
        interval-id (atom 0)
        cleared-intervals (atom [])
        original-set-interval js/setInterval
        original-clear-interval js/clearInterval]
    (set! js/setInterval
          (fn [callback _delay]
            (reset! interval-callback callback)
            (swap! interval-id inc)))
    (set! js/clearInterval #(swap! cleared-intervals conj %))
    (try
      (with-redefs [date/today #(deref today)
                    page-handler/create-today-journal! #(swap! create-count inc)]
        (page-handler/watch-for-date!)
        (testing "repeated checks on the same day reuse the loaded journal"
          (@interval-callback)
          (@interval-callback)
          (is (= 1 @create-count)))

        (testing "a day change refreshes the journal once"
          (reset! today "Jul 20th, 2026")
          (@interval-callback)
          (@interval-callback)
          (is (= 2 @create-count)))

        (testing "installing a watcher for another graph replaces the old timer"
          (page-handler/watch-for-date!)
          (is (= [1] @cleared-intervals))
          (is (= 3 @create-count))
          (@interval-callback)
          (is (= 3 @create-count))))
      (finally
        (set! js/setInterval original-set-interval)
        (set! js/clearInterval original-clear-interval)))))

(deftest restore-and-setup-loads-date-formatter-before-journals-render-test
  (async done
    (let [repo "logseq_db_startup_date_fmt"
          formatter "yyyy-MM-dd"
          order (atom [])]
      (-> (p/with-redefs [state/get-current-repo (constantly repo)
                          db-restore/restore-graph!
                          (fn [graph]
                            (swap! order conj :restore-graph)
                            (is (= repo graph))
                            (p/resolved nil))
                          db-async/<get-date-formatter
                          (fn [graph]
                            (swap! order conj :get-date-formatter)
                            (is (= repo graph))
                            (p/resolved formatter))
                          graph-handler/<upsert-current-graph-registry!
                          (fn [] (p/resolved nil))
                          graph-handler/remember-current-graph-id-in-tab!
                          (fn [])
                          repo-config-handler/start
                          (fn [_])
                          ui-handler/add-style-if-exists!
                          (fn [])
                          shortcut/refresh!
                          (fn [])
                          page-handler/init-commands!
                          (fn [])
                          page-handler/watch-for-date!
                          (fn []
                            (swap! order conj :watch-for-date)
                            (is (= formatter (state/get-date-formatter))
                                "Journal creation must see the persisted format, not the default."))
                          state/set-db-restoring!
                          (fn [restoring?]
                            (when (false? restoring?)
                              (swap! order conj :db-restoring-false)
                              (is (= formatter (state/get-date-formatter))
                                  "Settings must see the persisted format before the UI leaves restoring.")))]
            (handler/restore-and-setup! repo))
          (p/then
           (fn []
             (is (= formatter (state/get-date-formatter)))
             (is (= [:restore-graph :get-date-formatter :db-restoring-false :watch-for-date]
                    @order)
                 "Startup restore must load the date formatter after the graph and before journals/settings render.")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
