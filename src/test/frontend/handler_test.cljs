(ns frontend.handler-test
  (:require [cljs.test :refer [async deftest is testing]]
            [electron.ipc :as ipc]
            [frontend.date :as date]
            [frontend.db.async :as db-async]
            [frontend.db.restore :as db-restore]
            [frontend.config :as config]
            [frontend.db.subs :as db-subs]
            [frontend.error :as error]
            [frontend.handler :as handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [frontend.util :as util]
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
            (p/let [_ (handler/restore-and-setup! repo)]
              (is (= formatter (state/get-date-formatter)))
              (is (= [:restore-graph :get-date-formatter :db-restoring-false :watch-for-date]
                     @order)
                  "Startup restore must load the date formatter after the graph and before journals/settings render.")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))

(deftest restore-and-setup-clears-stale-repo-when-graph-is-absent-test
  (async done
    (let [repo "logseq_db_deleted"
          original-state (state/get-state)
          restoring-vals (atom [])]
      (state/swap-state! assoc :git/current-repo repo)
      (state/set-db-restoring! true)
      (-> (p/with-redefs [db-restore/restore-graph!
                          (fn [graph]
                            (is (= repo graph))
                            (p/rejected (ex-info "Graph is absent or stopped by deletion"
                                                 {:code :graph-not-exists :repo graph})))
                          db-subs/reset-graph! (fn [_])
                          graph-handler/<upsert-current-graph-registry! (fn [] (p/resolved nil))
                          graph-handler/remember-current-graph-id-in-tab! (fn [])
                          repo-config-handler/start (fn [_])
                          ui-handler/add-style-if-exists! (fn [])
                          shortcut/refresh! (fn [])
                          page-handler/init-commands! (fn [])
                          page-handler/watch-for-date! (fn [])
                          state/set-db-restoring!
                          (fn [restoring?]
                            (swap! restoring-vals conj restoring?)
                            (state/swap-state! assoc :db/restoring? restoring?))]
            (-> (handler/restore-and-setup! repo)
                (p/then (fn [_]
                          (is false "restore-and-setup! must not swallow a missing-graph error")))
                (p/catch
                 (fn [err]
                   (is (= :graph-not-exists (:code (ex-data err))))
                   (is (nil? (state/get-current-repo))
                       "Stale current repo must be cleared so startup can fall back")
                   (is (some false? @restoring-vals)
                       "Startup must leave the restoring skeleton so the UI can recover")))))
          (p/finally
           (fn []
             (state/replace-state! original-state)
             (done)))))))

(deftest graph-absent-error-detects-ipc-and-ex-info-codes-test
  (is (error/graph-absent-error?
       (ex-info "Graph is absent or stopped by deletion" {:code :graph-not-exists})))
  (is (error/graph-absent-error?
       (ex-info "Graph generation changed" {:code "graph-not-exists"})))
  (let [js-error (js/Error. "Graph is absent or stopped by deletion")]
    (set! (.-code js-error) "graph-not-exists")
    (is (error/graph-absent-error? js-error)))
  (is (error/graph-absent-error?
       (js/Error. "Graph is absent or stopped by deletion"))
      "Electron IPC may reconstruct the error from its message only")
  (is (not (error/graph-absent-error? (ex-info "other" {:code :server-start-failed}))))
  (is (not (error/graph-absent-error? (js/Error. "boom")))))

(deftest open-startup-repo-creates-demo-when-no-repo-test
  (async done
    (let [created (atom nil)]
      (-> (p/with-redefs [repo-handler/new-db!
                          (fn [graph]
                            (reset! created graph)
                            (p/resolved graph))]
            (p/let [_ (handler/<open-startup-repo! nil [])]
              (is (= config/demo-repo @created))))
          (p/catch (fn [err] (is false (str err))))
          (p/finally done)))))

(deftest open-startup-repo-falls-back-to-next-graph-when-restore-fails-test
  (async done
    (let [restored (atom [])]
      (-> (p/with-redefs [handler/restore-and-setup!
                          (fn [repo]
                            (swap! restored conj repo)
                            (if (= "logseq_db_deleted" repo)
                              (p/rejected (ex-info "Graph is absent or stopped by deletion"
                                                   {:code :graph-not-exists :repo repo}))
                              (p/resolved nil)))]
            (p/let [_ (handler/<open-startup-repo!
                       "logseq_db_deleted"
                       [{:url "logseq_db_deleted"}
                        {:url "logseq_db_next"}])]
              (is (= ["logseq_db_deleted" "logseq_db_next"] @restored))))
          (p/catch (fn [err] (is false (str err))))
          (p/finally done)))))

(deftest open-startup-repo-falls-back-to-demo-when-no-other-graph-test
  (async done
    (let [created (atom nil)]
      (-> (p/with-redefs [handler/restore-and-setup!
                          (fn [repo]
                            (p/rejected (ex-info "Graph is absent or stopped by deletion"
                                                 {:code :graph-not-exists :repo repo})))
                          repo-handler/new-db!
                          (fn [graph]
                            (reset! created graph)
                            (p/resolved graph))]
            (p/let [_ (handler/<open-startup-repo!
                       "logseq_db_deleted"
                       [{:url "logseq_db_deleted"}])]
              (is (= config/demo-repo @created))))
          (p/catch (fn [err] (is false (str err))))
          (p/finally done)))))

(deftest discard-unregistered-current-repo-clears-stale-last-opened-graph-test
  (let [discard-f (some-> (resolve 'frontend.handler/discard-unregistered-current-repo!) deref)
        original-state (state/get-state)]
    (is (fn? discard-f))
    (try
      (state/swap-state! assoc :git/current-repo "logseq_db_deleted")
      (discard-f ["logseq_db_other"])
      (is (nil? (state/get-current-repo)))
      (state/swap-state! assoc :git/current-repo "logseq_db_other")
      (discard-f ["logseq_db_other"])
      (is (= "logseq_db_other" (state/get-current-repo)))
      (finally
        (state/replace-state! original-state)))))

(deftest discard-missing-electron-current-repo-uses-disk-graph-list-test
  (async done
    (let [discard-f (some-> (resolve 'frontend.handler/<discard-missing-electron-current-repo!) deref)
          original-state (state/get-state)
          original-electron? util/electron?
          original-ipc ipc/ipc]
      (is (fn? discard-f))
      (state/swap-state! assoc :git/current-repo "logseq_db_deleted")
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [channel & _args]
                      (case channel
                        "getGraphs" (p/resolved ["logseq_db_other"])
                        (p/resolved nil))))
      (-> (p/let [_ (discard-f)]
            (is (nil? (state/get-current-repo))))
          (p/catch (fn [err] (is false (str err))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! ipc/ipc original-ipc)
             (state/replace-state! original-state)
             (done)))))))
