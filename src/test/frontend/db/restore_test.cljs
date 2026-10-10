(ns frontend.db.restore-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.conn :as db-conn]
            [frontend.db.restore :as db-restore]
            [frontend.db.subs :as db-subs]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(deftest restore-graph-does-not-create-renderer-datascript-conn-test
  (async done
    (let [repo "logseq_db_restore_without_ui_conn"
          block-id (str (random-uuid))
          conflicts-by-block {block-id [{:value "remote"}]}
          previous-state (state/get-state)
          previous-conns @db-conn/conns
          calls (atom [])
          events (atom [])
          current-repos (atom [])
          reset-graphs (atom [])
          date-formatter "yyyy-MM-dd"
          date-formatter-when-current (atom nil)]
      (reset! db-conn/conns {})
      (p/with-redefs [persist-db/<open-and-fetch-schema
                      (fn [repo' _opts]
                        (is (= repo repo'))
                        (swap! calls conj [:open repo'])
                        (p/resolved {:schema db-schema/schema}))
                      state/pub-event!
                      (fn [event]
                        (swap! events conj event)
                        (swap! calls conj [:event event])
                        (p/resolved nil))
                      state/set-current-repo!
                      (fn [repo']
                        (swap! current-repos conj repo')
                        (swap! calls conj [:current-repo repo'])
                        (reset! date-formatter-when-current
                                (state/get-state :ui/date-formatter :nested-path repo'))
                        (state/swap-state! assoc :git/current-repo repo')
                        nil)
                      state/<invoke-db-worker
                      (fn [api repo' & _args]
                        (swap! calls conj [:worker api repo'])
                        (p/resolved
                         (case api
                           :thread-api/db-sync-get-all-block-conflicts
                           conflicts-by-block
                           :thread-api/pull
                           {:logseq.property.journal/title-format date-formatter})))
                      state/set-sync-block-conflicts!
                      (fn [& args]
                        (swap! calls conj (into [:hydrate] args)))
                      db-subs/reset-graph!
                      (fn [repo']
                        (swap! reset-graphs conj repo')
                        (swap! calls conj [:reset repo']))]
        (-> (db-restore/restore-graph! repo)
            (p/then
             (fn [_]
               (is (= [repo] @current-repos))
               (is (= [repo] @reset-graphs)
                   "A restored worker graph must reset renderer subscriptions before rendering it.")
               (is (= [[:graph/restored repo] [:ui/re-render-root]]
                      @events))
               (is (= date-formatter (state/get-date-formatter))
                   "Every restore loads the graph's journal title format into renderer state.")
               (is (= date-formatter @date-formatter-when-current)
                   "The format is loaded before the graph becomes current.")
               (is (= [[:open repo]
                       [:worker :thread-api/db-sync-get-all-block-conflicts repo]
                       [:worker :thread-api/pull repo]
                       [:current-repo repo]
                       [:reset repo]
                       [:hydrate repo conflicts-by-block]
                       [:event [:graph/restored repo]]
                       [:event [:ui/re-render-root]]]
                      @calls)
                   "Restore hydrates all conflicts once after graph reset and before rendering.")
               (is (empty? @db-conn/conns)
                   "Restoring a graph must not create a renderer DataScript connection.")))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (state/replace-state! previous-state)
               (reset! db-conn/conns previous-conns)
               (done))))))))

(deftest failed-restore-keeps-current-graph-and-clears-loading-test
  (async done
    (let [repo "logseq_db_restore_failure"
          previous-state (state/get-state)
          previous-repo (state/get-current-repo)]
      (p/with-redefs [persist-db/<open-and-fetch-schema
                      (fn [_repo _opts]
                        (p/resolved {:schema nil}))]
        (-> (db-restore/restore-graph! repo)
            (p/then (fn []
                      (is false "Restore should reject an invalid schema.")))
            (p/catch
             (fn [_error]
               (is (false? (boolean (state/get-state :graph/loading?))))
               (is (= previous-repo (state/get-current-repo))
                   "Current repo changes only after schema validation succeeds.")))
            (p/finally
             (fn []
               (state/replace-state! previous-state)
               (done))))))))
